import { AlertTriangle, Trash2, X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { Button } from "./ui/button";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isPending, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-[#111A28] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={
                variant === "danger"
                  ? "grid size-11 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30 shrink-0"
                  : "grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shrink-0"
              }
            >
              {variant === "danger" ? (
                <Trash2 className="size-5" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
            </div>
            <div>
              <h2
                id="confirm-modal-title"
                className="text-base font-bold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
              <span className="text-[11px] font-medium text-gray-400">
                Action confirmation
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-[#162234] transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="text-xs text-gray-600 dark:text-[#8B9CB0] leading-relaxed">
          {description}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-[#1C283A]/60">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-gray-200 dark:border-[#1C283A] bg-white dark:bg-transparent px-5 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#162234] transition-colors shadow-none"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className={
              variant === "danger"
                ? "rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-5 shadow-sm transition-colors border-0"
                : "rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 shadow-sm transition-colors border-0"
            }
          >
            {isPending ? "Processing…" : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
