import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName: string;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you absolutely sure?",
  description,
  itemName,
  loading = false,
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText === itemName;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ||
              `This action cannot be undone. This will permanently delete "${itemName}" and all associated data.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="confirm-delete" className="text-sm text-muted-foreground">
            Type <span className="font-semibold text-foreground">{itemName}</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            className="mt-2"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={itemName}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!isConfirmed || loading}
            onClick={() => {
              onConfirm();
              setConfirmText("");
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
