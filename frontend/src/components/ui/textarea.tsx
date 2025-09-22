import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: 'default' | 'error'
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500',
            error: 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
        }

        return (
            <textarea
                className={cn(
                    'flex min-h-[80px] w-full rounded-md border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
                    variants[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = 'Textarea'

export { Textarea }