/** Display names for `users.role` / Spatie role slug (School Admin vs system Admin). */
export const ROLE_LABELS = {
  admin: "System Administrator",
  school_admin: "School Admin",
  faculty: "Faculty",
  parent: "Parent",
};

/** Tailwind classes for role badges in tables/cards (aligned with UserManagement). */
export const ROLE_BADGE_CLASSES = {
  admin: "bg-blue-100 text-blue-700",
  school_admin: "bg-violet-100 text-violet-700",
  faculty: "bg-emerald-100 text-emerald-700",
  parent: "bg-amber-100 text-amber-700",
};
