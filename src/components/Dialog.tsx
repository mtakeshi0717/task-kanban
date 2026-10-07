import type { ReactNode } from "react";

type DialogProps = {
  label: string;
  children: ReactNode;
};

export default function Dialog({ label, children }: DialogProps) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        {children}
      </div>
    </div>
  );
}
