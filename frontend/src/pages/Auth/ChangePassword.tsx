import { useState } from 'react';
import { authService } from '../../services/authService';
import Button from '../../components/UI/Button';

export default function ChangePassword() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.new_password !== form.confirm_password) {
      setError('New password and confirmation do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(form);
      setSuccess('Password updated successfully');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e: any) {
      setError(e.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Change Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="current_password" className="block text-sm font-medium mb-1">Current Password</label>
          <input
            id="current_password"
            type="password"
            placeholder="Enter current password"
            value={form.current_password}
            onChange={(e) => handleChange('current_password', e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 border-gray-300"
          />
        </div>
        <div>
          <label htmlFor="new_password" className="block text-sm font-medium mb-1">New Password</label>
          <input
            id="new_password"
            type="password"
            placeholder="Enter new password"
            value={form.new_password}
            onChange={(e) => handleChange('new_password', e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 border-gray-300"
          />
        </div>
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            id="confirm_password"
            type="password"
            placeholder="Re-enter new password"
            value={form.confirm_password}
            onChange={(e) => handleChange('confirm_password', e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 border-gray-300"
          />
        </div>
        {error && <div className="text-sm p-2 bg-red-50 text-red-700 rounded">{error}</div>}
        {success && <div className="text-sm p-2 bg-green-50 text-green-700 rounded">{success}</div>}
        <Button type="submit" isLoading={loading}>Update Password</Button>
      </form>
    </div>
  );
}
