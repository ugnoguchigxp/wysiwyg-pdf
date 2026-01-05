import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'

describe('components/ui/Tooltip', () => {
    it('renders correctly', () => {
        render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )

        expect(screen.getByText('Hover me')).toBeInTheDocument()
        // Radix/Tooltip renders accessible hidden copy. Check we have at least one.
        expect(screen.getAllByText('Tooltip text').length).toBeGreaterThan(0)
    })
})
