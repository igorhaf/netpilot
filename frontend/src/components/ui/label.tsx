import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    variant?: 'default' | 'error'
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            error: 'text-sm font-medium text-red-600 dark:text-red-400'
        }

        return (
            <label
                className={cn(
                    'block leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    variants[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Label.displayName = 'Label'

export { Label }