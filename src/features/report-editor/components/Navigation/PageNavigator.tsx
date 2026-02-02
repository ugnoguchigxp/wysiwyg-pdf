import React from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PageNavigatorProps {
    currentPageIndex: number
    totalPages: number
    onPageChange: (index: number) => void
    onAddPage: () => void
    onDeletePage: (index: number) => void
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
    currentPageIndex,
    totalPages,
    onPageChange,
    onAddPage,
    onDeletePage,
}) => {
    return (
        <div className="flex items-center gap-1 p-1 bg-secondary/80 backdrop-blur-sm border border-border rounded-lg shadow-sm">
            <Button
                variant="ghost"
                size="circle"
                className="h-8 w-8"
                onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                title="Previous Page"
            >
                <ChevronLeft size={16} />
            </Button>

            <div className="flex items-center gap-0.5 px-1 text-sm font-medium min-w-[50px] justify-center">
                <span>{currentPageIndex + 1}</span>
                <span className="text-muted-foreground">/</span>
                <span>{totalPages}</span>
            </div>

            <Button
                variant="ghost"
                size="circle"
                className="h-8 w-8"
                onClick={() => onPageChange(Math.min(totalPages - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === totalPages - 1}
                title="Next Page"
            >
                <ChevronRight size={16} />
            </Button>

            <div className="w-[1px] h-4 bg-border mx-0.5" />

            <Button
                variant="ghost"
                size="circle"
                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                onClick={onAddPage}
                title="Add Blank Page"
            >
                <Plus size={16} />
            </Button>

            <Button
                variant="ghost"
                size="circle"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDeletePage(currentPageIndex)}
                disabled={totalPages <= 1}
                title="Delete Current Page"
            >
                <Trash2 size={16} />
            </Button>
        </div>
    )
}
