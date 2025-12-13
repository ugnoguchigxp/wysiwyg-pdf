import { PEN_CURSOR_URL } from '../cursors';
import React, { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';
import { simplifyPoints } from '../../../utils/geometry';

interface SignatureKonvaEditorProps {
    width?: number;
    height?: number;
    onSave?: (dataUrl: string) => void;
    onCancel?: () => void;
}

interface SignatureLine {
    points: number[];
    color: string;
    strokeWidth: number;
}

export const SignatureKonvaEditor: React.FC<SignatureKonvaEditorProps> = ({
    width = 600,
    height = 300,
    onSave,
    onCancel,
}) => {
    const [lines, setLines] = useState<SignatureLine[]>([]);
    const isDrawing = useRef(false);
    const stageRef = useRef<Konva.Stage>(null);

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        isDrawing.current = true;
        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;

        setLines([...lines, { points: [pos.x, pos.y], color: '#000000', strokeWidth: 3 }]);
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        // no drawing - skipping
        if (!isDrawing.current) {
            return;
        }
        const stage = e.target.getStage();
        const point = stage?.getPointerPosition();
        if (!point) return;

        // replace last
        const lastLine = { ...lines[lines.length - 1] };
        // add point
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        // replace last
        const newLines = lines.slice();
        newLines.splice(lines.length - 1, 1, lastLine);
        setLines(newLines);
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const handleSave = () => {
        if (stageRef.current) {
            // We might want to trim or handle background, but for now simple export
            const dataURL = stageRef.current.toDataURL();

            // Apply optimization logic (DRY principle with ReportKonvaEditor)
            const optimizedLines = lines.map(line => {
                // 1. Simplify points with tolerance 2.0
                const simplified = simplifyPoints(line.points, 2.0);

                // 2. Round to 3 decimal places
                const rounded = simplified.map(val => Math.round(val * 1000) / 1000);

                return {
                    ...line,
                    points: rounded
                };
            });

            // Log Object for debugging as requested by user
            console.log('Signature Lines Object (Optimized):', optimizedLines);

            onSave?.(dataURL);
        }
    };

    const handleClear = () => {
        setLines([]);
    }

    const handleDownload = () => {
        if (stageRef.current) {
            const dataURL = stageRef.current.toDataURL();
            const link = document.createElement('a');
            link.download = 'signature.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
            <div
                className="border-2 border-gray-400 bg-white rounded overflow-hidden"
                style={{
                    cursor: PEN_CURSOR_URL
                }}
            >
                <Stage
                    width={width}
                    height={height}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchEnd={handleMouseUp}
                    ref={stageRef}
                >
                    <Layer>
                        {lines.map((line, i) => (
                            <Line
                                key={i}
                                points={line.points}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={
                                    'source-over'
                                }
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>

            <div className="flex w-full justify-between items-center px-2">
                <div className="flex gap-2">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    >
                        Clear
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                        Download
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
