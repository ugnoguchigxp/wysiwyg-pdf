import type { Doc, ImageNode } from 'wysiwyg-pdf';
import { uploadFile } from '../api/upload';

/**
 * Data URL to File
 */
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

/**
 * Scan document for base64 images, upload them using the queue, and return updated doc
 */
export const uploadDocAssets = async (
    doc: Doc,
    addTask: (
        name: string,
        handler: (item: any, onProgress: any, signal: AbortSignal) => Promise<any>
    ) => string
): Promise<Doc> => {
    const newNodes = [...doc.nodes];
    const newSurfaces = [...doc.surfaces];
    const uploadPromises: Promise<void>[] = [];

    // Scan nodes for base64 images
    for (let i = 0; i < newNodes.length; i++) {
        const node = newNodes[i];
        if (node.t === 'image' && (node as ImageNode).src.startsWith('data:')) {
            const imgNode = node as ImageNode;
            const base64 = imgNode.src;

            const promise = new Promise<void>((resolve, reject) => {
                try {
                    console.log(`[uploadDocAssets] Adding task for node ${imgNode.id}`);
                    addTask(`Upload Image: ${imgNode.name || 'Untitled'}`, async (_item, onProgress, signal) => {
                        try {
                            const file = dataURLtoFile(base64, `image-${imgNode.id}.png`);
                            onProgress(10);
                            const result = await uploadFile(file, signal);
                            onProgress(100);

                            if (result?.url) {
                                newNodes[i] = {
                                    ...imgNode,
                                    src: result.url
                                } as any;
                            }

                            resolve();
                            return result;
                        } catch (err) {
                            console.error(`[uploadDocAssets] Task failed for node ${imgNode.id}:`, err);
                            reject(err);
                            throw err;
                        }
                    });
                } catch (e) {
                    console.error(`[uploadDocAssets] Failed to add task for node ${imgNode.id}:`, e);
                    reject(e);
                }
            });

            uploadPromises.push(promise);
        }
    }

    // Scan surfaces for base64 background images
    for (let i = 0; i < newSurfaces.length; i++) {
        const surface = newSurfaces[i];
        if (surface?.bg && surface.bg.startsWith('data:')) {
            const base64 = surface.bg;
            const promise = new Promise<void>((resolve, reject) => {
                try {
                    console.log(`[uploadDocAssets] Adding task for surface background ${surface.id}`);
                    addTask(`Upload Background: ${surface.id}`, async (_item, onProgress, signal) => {
                        try {
                            const file = dataURLtoFile(base64, `bg-${surface.id}.png`);
                            onProgress(10);
                            const result = await uploadFile(file, signal);
                            onProgress(100);

                            if (result?.url) {
                                newSurfaces[i] = {
                                    ...surface,
                                    bg: result.url
                                };
                            }

                            resolve();
                            return result;
                        } catch (err) {
                            console.error(`[uploadDocAssets] Task failed for surface background ${surface.id}:`, err);
                            reject(err);
                            throw err;
                        }
                    });
                } catch (e) {
                    console.error(`[uploadDocAssets] Failed to add task for surface background ${surface.id}:`, e);
                    reject(e);
                }
            });
            uploadPromises.push(promise);
        }
    }

    if (uploadPromises.length > 0) {
        console.log(`[uploadDocAssets] Waiting for ${uploadPromises.length} uploads...`);
        await Promise.all(uploadPromises);
        console.log(`[uploadDocAssets] All uploads completed.`);
    }

    return {
        ...doc,
        nodes: newNodes,
        surfaces: newSurfaces,
    };
};
