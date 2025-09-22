import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
    size?: 'default' | 'sm'
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, size = 'default', checked, onCheckedChange, ...props }, ref) => {
        const sizes = {
            default: 'h-6 w-11',
            sm: 'h-5 w-9'
        }

        const thumbSizes = {
            default: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
            sm: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        }

        return (
            <label className={cn('relative inline-flex cursor-pointer', className)}>
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    ref={ref}
                    {...props}
                />
                <div
                    className={cn(
                        'peer relative rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 peer-checked:bg-blue-600 peer-checked:hover:bg-blue-700 peer-unchecked:bg-gray-200 peer-unchecked:hover:bg-gray-300 dark:peer-unchecked:bg-gray-700 dark:peer-unchecked:hover:bg-gray-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                        sizes[size]
                    )}
                >
                    <div
                        className={cn(
                            'pointer-events-none absolute top-0.5 left-0.5 inline-block rounded-full bg-white shadow transform transition duration-200 ease-in-out peer-checked:translate-x-5 peer-unchecked:translate-x-0',
                            size === 'sm' ? 'h-4 w-4 peer-checked:translate-x-4' : 'h-5 w-5 peer-checked:translate-x-5'
                        )}
                    />
                </div>
            </label>
        )
    }
)
Switch.displayName = 'Switch'

export { Switch }