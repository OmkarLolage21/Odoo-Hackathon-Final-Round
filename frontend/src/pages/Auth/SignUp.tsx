import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    loginId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

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
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await register(
        formData.email,
        formData.password,
        formData.loginId,
        formData.name,
        'contact_user' // Backend role for self-registration
      );
      // Registration successful - user will be automatically logged in
    } catch (error: any) {
      console.error('Error signing up:', error);
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sign Up
          </h2>
          <p className="text-gray-600">
            Create your account
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Name"
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="Enter your full name"
          />

          <Input
            label="Login ID"
            required
            value={formData.loginId}
            onChange={(e) => handleChange('loginId', e.target.value)}
            error={errors.loginId}
            placeholder="6-12 characters"
          />

          <Input
            label="Email ID"
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="Enter your email"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
                  errors.password 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-brand-500'
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Re-Enter Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={`block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
                  errors.confirmPassword 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-brand-500'
                }`}
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {errors.submit && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            Sign Up
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:text-brand-500 font-medium">
                Sign In
              </Link>
            </p>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600 mb-3">For Sign up Page:</div>
            <div className="space-y-1 text-xs bg-gray-50 p-3 rounded">
              <p>Create a 'invoicing user' database into the system on signup</p>
              <p>Check creds as follows:</p>
              <p>1. Login ID should be unique and must be between 6-12 characters</p>
              <p>2. Email ID should not be a duplicate in database</p>
              <p>3. Password must be unique and must contain a small case, a large case and a special character and length should be more than 8 characters</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}