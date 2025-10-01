import { createContext, forwardRef, useContext, useState, useId } from 'react'
import { cn } from '@/lib/utils'

interface SelectContextType {
    value: string
    onValueChange: (value: any) => void
    open: boolean
    setOpen: (open: boolean) => void
    contentId: string
}

const SelectContext = createContext<SelectContextType | undefined>(undefined)

const useSelect = () => {
    const context = useContext(SelectContext)
    if (!context) {
        throw new Error('useSelect must be used within a Select')
    }
    return context
}

interface SelectProps {
    value: string
    onValueChange: (value: any) => void
    children: React.ReactNode
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
    const [open, setOpen] = useState(false)
    const contentId = useId()

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen, contentId }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
}

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
    ({ className, children, ...props }, ref) => {
        const { open, setOpen, contentId } = useSelect()

        return (
            <button
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-controls={contentId}
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                onClick={() => setOpen(!open)}
                ref={ref}
                {...props}
            >
                {children}
                <svg
                    className="h-4 w-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
            </button>
        )
    }
)
SelectTrigger.displayName = 'SelectTrigger'

interface SelectValueProps {
    placeholder?: string
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
    const { value } = useSelect()
    return <span>{value || placeholder}</span>
}

interface SelectContentProps {
    children: React.ReactNode
}

const SelectContent = ({ children }: SelectContentProps) => {
    const { open, contentId } = useSelect()

    if (!open) return null

    return (
        <div
            id={contentId}
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
        >
            <div className="max-h-60 overflow-auto p-1">
                {children}
            </div>
        </div>
    )
}

interface SelectItemProps {
    value: string
    children: React.ReactNode
}

const SelectItem = ({ value, children }: SelectItemProps) => {
    const { value: selectedValue, onValueChange, setOpen } = useSelect()

    const handleClick = () => {
        onValueChange(value)
        setOpen(false)
    }

    const isSelected = selectedValue === value

    return (
        <div
            className={cn(
                'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700',
                isSelected && 'bg-gray-100 dark:bg-gray-700'
            )}
            onClick={handleClick}
        >
            {children}
            {isSelected && (
                <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                </span>
            )}
        </div>
    )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }