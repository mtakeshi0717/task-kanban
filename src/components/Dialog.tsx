import type { ReactNode } from "react";
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DialogProps = {
  label: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function Dialog({ label, description, onClose, children }: DialogProps) {
  return (
    <DialogRoot open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
