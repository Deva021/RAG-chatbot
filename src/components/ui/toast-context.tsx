'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
            <div
                key={toast.id}
                className={`flex items-center justify-between rounded-md p-4 shadow-md w-80 text-white ${
                    toast.type === 'success' ? 'bg-green-600' :
                    toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                }`}
            >
                <span className="text-sm">{toast.message}</span>
                <button onClick={() => removeToast(toast.id)} className="ml-4 hover:opacity-80">
                    <X className="h-4 w-4" />
                </button>
            </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
