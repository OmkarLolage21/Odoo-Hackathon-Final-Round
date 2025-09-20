import apiClient from '../utils/apiClient';
import { User } from '../types';

const BASE_PATH = '/api/v1/users';

const roleHeader = (role?: string) => ({ 'X-User-Role': role || '' });

// Backend returns array of UserWithProfile; we'll map minimal fields we need.
interface UserWithProfileApi {
  id: string;
  email: string;
  role: string;
  is_active?: boolean;
  profile?: {
    username?: string;
    full_name?: string | null;
    avatar_url?: string | null;
  };
}

function mapUser(u: UserWithProfileApi): User {
  return {
    id: u.id,
    name: u.profile?.full_name || u.profile?.username || u.email.split('@')[0],
    email: u.email,
    role: u.role as any,
    full_name: u.profile?.full_name || undefined,
    username: u.profile?.username || undefined,
    is_active: u.is_active,
  };
}

class UserService {
  async list(role?: string) {
    const data = await apiClient.get<UserWithProfileApi[]>(BASE_PATH, { headers: roleHeader(role) });
    return data.map(mapUser);
  }
}

export const userService = new UserService();
export default userService;
