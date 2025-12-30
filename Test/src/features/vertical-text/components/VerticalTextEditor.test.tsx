import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { VerticalTextEditor } from '@/features/vertical-text/components/VerticalTextEditor';
import type { TextNode } from '@/types/canvas';

// Element Mock
const mockTextNode: TextNode = {
    id: 'test-node',
    s: 'surface-1',
    t: 'text',
    text: 'あいう',
    x: 10,
    y: 20,
    w: 100,
    h: 200,
    fontSize: 20,
    font: 'Arial',
    fill: '#000000',
    vertical: true,
    padding: 10,
};

// Stage/Transformer Mock
const mockStage = {
    container: () => document.createElement('div'),
    getPointerPosition: () => ({ x: 0, y: 0 }),
    findOne: vi.fn(() => ({
        getAbsolutePosition: () => ({ x: 10, y: 20 }),
    })),
} as any;

describe('VerticalTextEditor', () => {
    const defaultProps = {
        node: mockTextNode,
        scale: 1,
        stageNode: mockStage,
        onTextChange: vi.fn(),
        onClose: vi.fn(),
    };

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render textarea with correct initial value', () => {
        render(<VerticalTextEditor {...defaultProps} />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea).toBeTruthy();
        expect(textarea.value).toBe('あいう');
    });

    it('should call onTextChange when text is changed', () => {
        render(<VerticalTextEditor {...defaultProps} />);
        const textarea = screen.getByRole('textbox');

        fireEvent.change(textarea, { target: { value: 'あいうえ' } });

        // Check only the first argument (text) as the second argument (rect) is calculated inside
        expect(defaultProps.onTextChange).toHaveBeenCalledWith('あいうえ', expect.anything());
    });

    it('should call onClose when blurred', () => {
        render(<VerticalTextEditor {...defaultProps} />);
        const textarea = screen.getByRole('textbox');

        fireEvent.blur(textarea);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when Esc is pressed', () => {
        render(<VerticalTextEditor {...defaultProps} />);
        const textarea = screen.getByRole('textbox');

        fireEvent.keyDown(textarea, { key: 'Escape' });

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should handle composition start and end', () => {
        render(<VerticalTextEditor {...defaultProps} />);
        const textarea = screen.getByRole('textbox');

        // IME Input Start
        fireEvent.compositionStart(textarea);
        // Enter key during IME should not trigger finish
        fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true });
        expect(defaultProps.onClose).not.toHaveBeenCalled();

        // IME Input End
        fireEvent.compositionEnd(textarea);
    });

    it('should apply styles correctly (vertical-rl)', () => {
        render(<VerticalTextEditor {...defaultProps} />);
        const textarea = screen.getByRole('textbox');

        expect(textarea.style.writingMode).toBe('vertical-rl');
    });
});
