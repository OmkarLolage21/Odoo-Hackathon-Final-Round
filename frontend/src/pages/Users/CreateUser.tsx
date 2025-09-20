import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    loginId: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Determine allowed roles based on current user
  const roleOptions = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') {
      return [
        { value: 'invoicing_user', label: 'Invoicing User - Standard operational access' },
        { value: 'contact', label: 'Contact - Self service limited access' }
      ];
    }
    if (user.role === 'invoicing_user') {
      return [
        { value: 'contact', label: 'Contact - Self service limited access' }
      ];
    }
    return [];
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.loginId.trim()) {
      newErrors.loginId = 'Login ID is required';
    } else if (formData.loginId.length < 6 || formData.loginId.length > 12) {
      newErrors.loginId = 'Login ID should be between 6-12 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/users');
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // If contact user tries to access, redirect (no permission)
  if (user?.role === 'contact') {
    return <Navigate to="/users" replace />;
  }

  // invoicing_user cannot edit existing users (only create contact users)
  if (user?.role === 'invoicing_user' && isEdit) {
    return <Navigate to="/users" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/users')}
          className="p-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit User' : 'Create User'}</h1>
          <p className="text-gray-600">{isEdit ? 'Modify user details (Admin only)' : 'Add a new user to the system'}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Name"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="Enter full name"
            />

            <Select
              label="Role"
              required
              options={roleOptions}
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              error={errors.role}
              placeholder="Select user role"
            />

            <Input
              label="Login ID"
              required
              value={formData.loginId}
              onChange={(e) => handleChange('loginId', e.target.value)}
              error={errors.loginId}
              placeholder="6-12 characters"
              helperText="Must be unique and between 6-12 characters"
            />

            <Input
              label="Email ID"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              placeholder="Enter email address"
              helperText="Should not be duplicate in database"
            />

            <Input
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              placeholder="Enter password"
              helperText="Must contain uppercase, lowercase, number and special character"
            />

            <Input
              label="Re-Enter Password"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              placeholder="Confirm password"
            />
          </div>

          {/* User Rights Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-2">User Rights</h3>
            <ul className="text-sm text-green-700 space-y-1">
              {user?.role === 'admin' && (
                <>
                  <li><strong>Invoicing User:</strong> Operational tasks, invoicing & contact creation</li>
                  <li><strong>Contact:</strong> Restricted to own data visibility</li>
                </>
              )}
              {user?.role === 'invoicing_user' && (
                <li><strong>Contact:</strong> Restricted to own data visibility</li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/users')}
            >
              Cancel
            </Button>
            {!isEdit && (
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Create
              </Button>
            )}
            {isEdit && user?.role === 'admin' && (
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Save Changes
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}