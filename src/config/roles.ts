export const ROLES = {
  ADMIN: "admin",
  BRANCH_ADMIN: "branch_admin",
  USER: "user",
} as const;

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.BRANCH_ADMIN]: "Branch Admin",
  [ROLES.USER]: "User",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
