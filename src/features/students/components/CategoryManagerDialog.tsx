"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/features/students/actions/category.actions";
import type { CategoryRow } from "@/types/category";

export function CategoryManagerDialog({
  open,
  onOpenChange,
  categories,
  onCategoriesChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryRow[];
  onCategoriesChange: (categories: CategoryRow[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newMalayalam, setNewMalayalam] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editMalayalam, setEditMalayalam] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!newLabel.trim()) {
      toast.error("Label is required.");
      return;
    }
    const value = newValue.trim() || newLabel.trim().toLowerCase().replace(/\s+/g, "_");
    startTransition(async () => {
      const result = await createCategoryAction({ value, label: newLabel, malayalamLabel: newMalayalam });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Category created.");
      setAdding(false);
      setNewValue("");
      setNewLabel("");
      setNewMalayalam("");
      // Optimistic: add to local list (server revalidates on next navigation)
      const newCat: CategoryRow = {
        id: crypto.randomUUID(),
        value,
        label: newLabel.trim(),
        malayalam_label: newMalayalam.trim() || null,
        sort_order: categories.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onCategoriesChange([...categories, newCat]);
    });
  }

  function startEdit(cat: CategoryRow) {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditMalayalam(cat.malayalam_label ?? "");
  }

  function handleSaveEdit() {
    if (!editingId || !editLabel.trim()) return;
    startTransition(async () => {
      const result = await updateCategoryAction(editingId, {
        label: editLabel,
        malayalamLabel: editMalayalam,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Category updated.");
      onCategoriesChange(
        categories.map((c) =>
          c.id === editingId
            ? { ...c, label: editLabel.trim(), malayalam_label: editMalayalam.trim() || null }
            : c,
        ),
      );
      setEditingId(null);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(deleteTarget.id);
      if (result.error) {
        toast.error(result.error);
        setDeleteTarget(null);
        return;
      }
      toast.success("Category deleted.");
      onCategoriesChange(categories.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Create, edit, or delete participant categories. Categories in use by
              students or programs can&apos;t be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
              >
                {editingId === cat.id ? (
                  <>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Label"
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Input
                        value={editMalayalam}
                        onChange={(e) => setEditMalayalam(e.target.value)}
                        placeholder="Malayalam (optional)"
                        className="h-7 text-sm"
                        lang="ml"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleSaveEdit}
                      disabled={isPending}
                    >
                      <Check className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{cat.label}</p>
                      {cat.malayalam_label ? (
                        <p className="truncate text-xs text-muted-foreground" lang="ml">
                          {cat.malayalam_label}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => startEdit(cat)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeleteTarget(cat)}
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            {categories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No categories yet. Add one below.
              </p>
            ) : null}
          </div>

          {adding ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (e.g. Sub Junior)"
                className="h-8"
                autoFocus
              />
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value / slug (auto-generated if empty)"
                className="h-8"
              />
              <Input
                value={newMalayalam}
                onChange={(e) => setNewMalayalam(e.target.value)}
                placeholder="Malayalam label (optional)"
                className="h-8"
                lang="ml"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={isPending}>
                  {isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAdding(true)}
            >
              <Plus className="size-4" data-icon="inline-start" />
              Add category
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. Categories that still have students or programs
              can&apos;t be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
