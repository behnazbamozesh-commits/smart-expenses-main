'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast } from 'sonner';
import { CircleCheck as CheckCircle2, Circle as XCircle, TriangleAlert as AlertTriangle, Info, Loader as Loader2 } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-slate-800 group-[.toaster]:text-white group-[.toaster]:border-slate-700 group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg group-[.toaster]:p-4',
          description: 'group-[.toast]:text-slate-400',
          actionButton:
            'group-[.toast]:bg-emerald-600 group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1',
          cancelButton:
            'group-[.toast]:bg-slate-700 group-[.toast]:text-slate-300 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1',
          success: 'group-[.toaster]:border-emerald-500/50',
          error: 'group-[.toaster]:border-red-500/50',
          warning: 'group-[.toaster]:border-amber-500/50',
          info: 'group-[.toaster]:border-blue-500/50',
        },
      }}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
