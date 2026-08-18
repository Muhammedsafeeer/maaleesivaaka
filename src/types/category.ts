/** A category row from the `categories` table — the admin-managed source of truth. */
export type CategoryRow = {
  id: string;
  value: string;
  label: string;
  malayalam_label: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
