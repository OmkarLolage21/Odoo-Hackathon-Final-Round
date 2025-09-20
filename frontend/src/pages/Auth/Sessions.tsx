import { useEffect, useState } from 'react';
import { authService, UserSession } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';

export default function Sessions() {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getSessions();
      setSessions(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleLogoutAll = async () => {
    setActionLoading(true);
    try {
      await authService.logoutAll();
      await loadSessions();
    } catch (e: any) {
      setError(e.message || 'Failed to logout from all sessions');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Active Sessions</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadSessions} disabled={loading}>Refresh</Button>
          <Button variant="danger" onClick={handleLogoutAll} isLoading={actionLoading}>Logout All</Button>
          <Button variant="ghost" onClick={logout}>Sign Out</Button>
        </div>
      </div>

      {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-600">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="text-sm text-gray-600">No active sessions.</div>
      ) : (
        <div className="overflow-hidden border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-2">User Agent</th>
                <th className="px-4 py-2">IP</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2">Expires</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 max-w-xs truncate" title={s.user_agent || ''}>{s.user_agent || 'Unknown'}</td>
                  <td className="px-4 py-2">{s.ip_address || '—'}</td>
                  <td className="px-4 py-2">
                    {s.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{new Date(s.expires_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
