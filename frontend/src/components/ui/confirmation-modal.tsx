'use client'

import { ReactNode } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  subtitle: string
  itemName: string
  consequences: string[]
  confirmText: string
  isLoading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  itemName,
  consequences,
  confirmText,
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {/* Item with trash icon */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/30">
            <Trash2 className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{itemName}</span>
          </div>

          {/* Consequences */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Esta ação irá:</p>
            <ul className="space-y-2">
              {consequences.map((consequence, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  {consequence}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="btn-primary bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600"
            >
              {isLoading ? 'Excluindo...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}