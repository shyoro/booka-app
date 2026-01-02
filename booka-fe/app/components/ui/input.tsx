import * as React from "react"

import { cn } from "~/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Layout
        'w-full min-w-0',
        // Box model
        'h-9 px-3 py-1 rounded-md border border-input',
        // Typography
        'text-base md:text-sm placeholder:text-muted-foreground',
        // Visuals
        'bg-transparent dark:bg-input/30 shadow-xs outline-none',
        // File input styling
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        // Selection styling
        'selection:bg-primary selection:text-primary-foreground',
        // Interactive states
        'transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        // Disabled states
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        // Validation states
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className
      )}
      {...props}
    />
  )
}

export { Input }
