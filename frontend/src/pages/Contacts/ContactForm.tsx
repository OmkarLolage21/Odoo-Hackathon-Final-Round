import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import ActionBar from '../../components/UI/ActionBar';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateContact, canEditContact, canDeleteContact } from '../../utils/rolePermissions';
import { contactService } from '../../services/contactService';

export default function ContactForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const canEdit = canEditContact(user?.role);
  const canCreate = canCreateContact(user?.role);
  const canDelete = canDeleteContact(user?.role);

  // Block contact users entirely
  if (user?.role === 'contact') {
    return <Navigate to="/contacts" replace />;
  }

  // If invoicing_user tries to edit (not create) block
  if (user?.role === 'invoicing_user' && isEdit) {
    return <Navigate to="/contacts" replace />;
  }

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    email: '',
    mobile: '',
    address: {
      city: '',
      state: '',
      pincode: ''
    },
    profileImage: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(!isEdit);

  // Load existing contact in edit mode
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isEdit || !id) return;
      setIsLoading(true);
      try {
        const data = await contactService.get(id);
        if (!active) return;
        setFormData({
          name: data.name || '',
            type: (data.type as any) || '',
            email: data.email || '',
            mobile: data.mobile || '',
            address: {
              city: data.address_city || '',
              state: data.address_state || '',
              pincode: data.address_pincode || ''
            },
            profileImage: ''
        });
      } catch (e: any) {
        if (!active) return;
        setApiError(e.message || 'Failed to load contact');
      } finally {
        if (active) {
          setIsLoading(false);
          setInitialLoaded(true);
        }
      }
    };
    load();
    return () => { active = false; };
  }, [isEdit, id]);

  const typeOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'both', label: 'Both (Customer & Vendor)' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Contact type is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number is invalid';
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.address.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.address.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    type: formData.type as 'customer' | 'vendor' | 'both',
    email: formData.email.trim() || null,
    mobile: formData.mobile.trim() || null,
    address_city: formData.address.city.trim() || null,
    address_state: formData.address.state.trim() || null,
    address_pincode: formData.address.pincode.trim() || null,
    // user_id intentionally omitted (future enhancement)
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = buildPayload();
    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      if (isEdit && id) {
        await contactService.update(id, payload as any);
        setApiSuccess('Contact updated successfully');
        setTimeout(() => navigate('/contacts'), 600);
        return;
      }
      await contactService.create(payload as any);
      setApiSuccess('Contact created successfully');
      setTimeout(() => navigate('/contacts'), 600);
    } catch (error: any) {
      console.error('Error saving contact:', error);
      setApiError(error.message || 'Failed to save contact');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isEdit && !initialLoaded) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading contact...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Action Bar */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Master</h1>
        {canCreate && (
          <ActionBar
            onNew={() => navigate('/contacts/new')}
            onConfirm={handleSubmit as any}
            onArchiveChange={() => {/* archive logic placeholder */}}
            onBack={() => navigate('/contacts')}
          />
        )}
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Contact Name"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Enter contact name"
                />

                <Select
                  label="Type"
                  required
                  options={typeOptions}
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  error={errors.type}
                  placeholder="Select contact type"
                />

                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={errors.email}
                  placeholder="Enter email address"
                />

                <Input
                  label="Phone"
                  required
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  error={errors.mobile}
                  placeholder="Enter mobile number"
                />
              </div>

              {/* Address Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    required
                    value={formData.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                    error={errors.city}
                    placeholder="Enter city"
                  />

                  <Input
                    label="State"
                    required
                    value={formData.address.state}
                    onChange={(e) => handleChange('address.state', e.target.value)}
                    error={errors.state}
                    placeholder="Enter state"
                  />

                  <Input
                    label="Pincode"
                    required
                    value={formData.address.pincode}
                    onChange={(e) => handleChange('address.pincode', e.target.value)}
                    error={errors.pincode}
                    placeholder="Enter pincode"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Profile Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                  >
                    Upload Image
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {apiError && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
              {apiError}
            </div>
          )}
          {apiSuccess && (
            <div className="p-3 rounded bg-green-50 text-green-700 text-sm">
              {apiSuccess}
            </div>
          )}

          <div className="flex justify-between space-x-4 pt-6 border-t border-gray-200">
            {isEdit && canDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  if (!id) return;
                  if (!window.confirm('Delete this contact permanently?')) return;
                  setIsLoading(true);
                  setApiError(null);
                  try {
                    await contactService.delete(id);
                    navigate('/contacts');
                  } catch (e: any) {
                    setApiError(e.message || 'Failed to delete contact');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/contacts')}
            >
              Back
            </Button>
            {((isEdit && canEdit) || (!isEdit && canCreate)) && (
              <Button
                type="submit"
                isLoading={isLoading}
              >
                {isEdit ? 'Confirm Changes' : 'Confirm'}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}