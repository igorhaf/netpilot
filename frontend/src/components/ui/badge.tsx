import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
            secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200 dark:border-gray-800',
            destructive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800',
            outline: 'text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600',
            success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800',
            warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
        }

        return (
            <div
                className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                    variants[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Badge.displayName = 'Badge'

export { Badge }