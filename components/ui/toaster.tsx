"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider
      swipeDirection="right"
      duration={2000} // Auto close after 2 seconds
    >
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast
          key={id}
          {...props}
          className={`p-2 text-sm ${
            variant === "default" ? "bg-green-500 text-white" : ""
          } ${variant === "destructive" ? "bg-red-500 text-white" : ""} shadow-lg rounded-lg pointer-events-auto`}
        >
          <div className="grid gap-1">
            {title && <ToastTitle className="text-sm">{title}</ToastTitle>}
            {description && (
              <ToastDescription className="text-sm">{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose className="text-sm" />
        </Toast>
      ))}
      <ToastViewport
        className="fixed top-0 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 w-[350px] max-w-[100vw] m-0 list-none p-4 outline-none"
      />
    </ToastProvider>
  );
}

