"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationProps {
  title: string;
  description: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
  error?: string | null;
  confirmLabel?: string;
  processingLabel?: string;
}

export function DeleteConfirmation({
  title,
  description,
  onCancel,
  onConfirm,
  isProcessing = false,
  error,
  confirmLabel = "Usuń",
  processingLabel = "Usuwanie...",
}: DeleteConfirmationProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  useEffect(() => {
    const deadline = Date.now() + 5000;
    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) window.clearInterval(intervalId);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, []);

  const readyToConfirm = secondsRemaining === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
        className="w-full max-w-md space-y-4 rounded-2xl border-2 border-destructive bg-card p-6 shadow-[5px_5px_0_0_var(--destructive)]"
      >
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="size-6 shrink-0" />
          <h2 id="delete-confirmation-title" className="font-heading text-xl uppercase">
            {readyToConfirm ? title : "Chwila przed potwierdzeniem"}
          </h2>
        </div>

        <div id="delete-confirmation-description" className="font-mono text-xs text-muted-foreground">
          {readyToConfirm ? (
            description
          ) : (
            <p aria-live="polite">
              Potwierdzenie usunięcia będzie dostępne za{" "}
              <strong className="text-foreground">{secondsRemaining} s</strong>.
            </p>
          )}
        </div>

        {readyToConfirm && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="h-10 flex-1 rounded-xl border-2 border-foreground/20 font-heading text-xs font-bold uppercase disabled:opacity-50"
          >
            Anuluj
          </button>
          {readyToConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="h-10 flex-1 rounded-xl border-2 border-destructive bg-destructive font-heading text-xs font-bold uppercase text-destructive-foreground disabled:opacity-50"
            >
              {isProcessing ? processingLabel : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
