'use client'

import { Toast, ToastContainer } from '@/components/ui/toast'
import { useToastStore } from '@/hooks/use-toast'

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore()

  return (
    <ToastContainer>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={removeToast}
        />
      ))}
    </ToastContainer>
  )
}