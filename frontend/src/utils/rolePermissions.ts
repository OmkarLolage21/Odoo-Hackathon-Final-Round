// Centralized role-based permission helpers
import { User, AppRole } from '../types';

// Normalize role names (backend uses 'contact_user', frontend uses 'contact')
export const normalizeRole = (role?: AppRole | string | null): AppRole | null => {
  if (!role) return null;
  if (role === 'contact_user') return 'contact';
  return role as AppRole;
};

export const canCreateUser = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'invoicing_user';
};

export const canEditUser = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin';
};

export const canDeleteUser = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin';
};

export const canCreateContact = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'invoicing_user';
};

export const canEditContact = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin';
};

export const canDeleteContact = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin';
};

export const canEditMasterData = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin';
};

export const canCreateMasterData = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'invoicing_user';
};

export const canDeleteMasterData = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin';
};

export const visibleUserActions = (role?: AppRole | string | null) => ({
  create: canCreateUser(role),
  edit: canEditUser(role),
  delete: canDeleteUser(role),
});

export const visibleContactActions = (role?: AppRole | string | null) => ({
  create: canCreateContact(role),
  edit: canEditContact(role),
  delete: canDeleteContact(role),
});

export const restrictUserListColumns = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'contact';
};

export const restrictContactListColumns = (role?: AppRole | string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'contact';
};

export function isSelf(user: User | null | undefined, target: User | null | undefined) {
  if (!user || !target) return false;
  return user.id === target.id || user.email === target.email;
}
