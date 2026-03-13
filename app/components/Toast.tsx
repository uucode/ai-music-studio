'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
type ToastItem = { id: number; message: string; type: ToastType };

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
}>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: '💡',
};

const BG: Record<ToastType, string> = {
  success: 'bg-green-500/90',
  error: 'bg-red-500/90',
  info: 'bg-purple-500/90',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-xl shadow-lg text-white text-sm backdrop-blur-lg animate-fade-in ${BG[t.type]}`}
          >
            {ICONS[t.type]} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
