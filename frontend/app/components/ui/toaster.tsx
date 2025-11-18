import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { useUIStore } from '../../stores/ui-store';

export function Toaster() {
  const { toasts, removeToast } = useUIStore();

  return (
    <ToastProvider>
      {toasts.map((toast) => {
        const variant =
          toast.type === 'error'
            ? 'destructive'
            : toast.type === 'success'
              ? 'success'
              : toast.type === 'warning'
                ? 'warning'
                : 'default';

        return (
          <Toast
            key={toast.id}
            variant={variant}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
          >
            <div className="grid gap-1">
              <ToastTitle>
                {toast.type === 'success' && 'Success'}
                {toast.type === 'error' && 'Error'}
                {toast.type === 'warning' && 'Warning'}
                {toast.type === 'info' && 'Info'}
              </ToastTitle>
              <ToastDescription>{toast.message}</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
