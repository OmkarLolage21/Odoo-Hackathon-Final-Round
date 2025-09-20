// Centralized role-based permission helpers
import { User } from '../types';

export type AppRole = 'admin' | 'invoicing_user' | 'contact';

export const canCreateUser = (role?: AppRole | string | null) => role === 'admin' || role === 'invoicing_user';
export const canEditUser = (role?: AppRole | string | null) => role === 'admin';
export const canDeleteUser = (role?: AppRole | string | null) => role === 'admin';

export const canCreateContact = (role?: AppRole | string | null) => role === 'admin' || role === 'invoicing_user';
export const canEditContact = (role?: AppRole | string | null) => role === 'admin';
export const canDeleteContact = (role?: AppRole | string | null) => role === 'admin';

export const canEditMasterData = (role?: AppRole | string | null) => role === 'admin';
export const canCreateMasterData = (role?: AppRole | string | null) => role === 'admin' || role === 'invoicing_user';
export const canDeleteMasterData = (role?: AppRole | string | null) => role === 'admin';

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

export const restrictUserListColumns = (role?: AppRole | string | null) => role === 'contact';
export const restrictContactListColumns = (role?: AppRole | string | null) => role === 'contact';

export function isSelf(user: User | null | undefined, target: User | null | undefined) {
  if (!user || !target) return false;
  return user.id === target.id || user.email === target.email;
}
