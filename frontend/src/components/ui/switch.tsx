import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
    size?: 'default' | 'sm'
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, size = 'default', checked, onCheckedChange, disabled, ...props }, ref) => {
        const sizeClasses = {
            default: 'h-6 w-11',
            sm: 'h-5 w-9'
        }

        const thumbSizeClasses = {
            default: 'h-5 w-5',
            sm: 'h-4 w-4'
        }

        const thumbTranslateClasses = {
            default: checked ? 'translate-x-5' : 'translate-x-0',
            sm: checked ? 'translate-x-4' : 'translate-x-0'
        }

        return (
            <label className={cn('relative inline-flex cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    disabled={disabled}
                    ref={ref}
                    {...props}
                />
                <div
                    className={cn(
                        'relative rounded-full transition-colors duration-200 ease-in-out',
                        // Estados de cor
                        checked
                            ? 'bg-primary hover:bg-primary/90'
                            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600',
                        // Focus ring
                        'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                        // Disabled
                        disabled && 'cursor-not-allowed opacity-50',
                        sizeClasses[size]
                    )}
                >
                    <div
                        className={cn(
                            'pointer-events-none absolute top-0.5 left-0.5 inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out',
                            thumbSizeClasses[size],
                            thumbTranslateClasses[size]
                        )}
                    />
                </div>
            </label>
        )
    }
)
Switch.displayName = 'Switch'

export { Switch }