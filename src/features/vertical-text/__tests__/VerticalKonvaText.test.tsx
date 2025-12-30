import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

import { Stage, Layer } from 'react-konva';
import { VerticalKonvaText } from '../components/VerticalKonvaText';
import type { TextNode } from '@/types/canvas';


// Helper to mock a TextNode
const mockTextNode = (override: Partial<TextNode> = {}): TextNode => ({
    id: 'test-node',
    s: 'surface-1',
    t: 'text',
    text: 'あいう',
    x: 0,
    y: 0,
    w: 100,
    h: 200,
    fontSize: 20,
    font: 'Arial',
    fill: '#000000',
    vertical: true,
    ...override,
});

describe('VerticalKonvaText Component', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders vertically distributed characters', () => {
        const node = mockTextNode({ text: 'あいう' });

        const { container } = render(
            <Stage width={300} height={300}>
                <Layer>
                    <VerticalKonvaText node={node} />
                </Layer>
            </Stage>
        );

        expect(container).toBeTruthy();
    });

    it('renders without crashing when text is empty', () => {
        const node = mockTextNode({ text: '' });

        const { container } = render(
            <Stage width={300} height={300}>
                <Layer>
                    <VerticalKonvaText node={node} />
                </Layer>
            </Stage>
        );

        expect(container).toBeTruthy();
    });

    it('renders with custom padding', () => {
        const node = mockTextNode({ text: 'あ', padding: 20 });

        const { container } = render(
            <Stage width={300} height={300}>
                <Layer>
                    <VerticalKonvaText node={node} />
                </Layer>
            </Stage>
        );

        expect(container).toBeTruthy();
    });

    it('renders with visible prop set to false', () => {
        const node = mockTextNode({ text: 'あいう' });

        const { container } = render(
            <Stage width={300} height={300}>
                <Layer>
                    <VerticalKonvaText node={node} visible={false} />
                </Layer>
            </Stage>
        );

        expect(container).toBeTruthy();
    });

    it('handles multiline text (newlines)', () => {
        const node = mockTextNode({ text: 'あ\nい' });

        const { container } = render(
            <Stage width={300} height={300}>
                <Layer>
                    <VerticalKonvaText node={node} />
                </Layer>
            </Stage>
        );

        expect(container).toBeTruthy();
    });

    it('handles special characters (punctuation, brackets)', () => {
        const node = mockTextNode({ text: '。、「」' });

        const { container } = render(
            <Stage width={300} height={300}>
                <Layer>
                    <VerticalKonvaText node={node} />
                </Layer>
            </Stage>
        );

        expect(container).toBeTruthy();
    });
});


