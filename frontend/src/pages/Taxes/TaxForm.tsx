import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import ActionBar from '../../components/UI/ActionBar';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateMasterData, canEditMasterData } from '../../utils/rolePermissions';

export default function TaxForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const canEdit = canEditMasterData(user?.role);
  const canCreate = canCreateMasterData(user?.role);

  if (user?.role === 'contact') {
    return <Navigate to="/taxes" replace />;
  }
  if (user?.role === 'invoicing_user' && isEdit) {
    return <Navigate to="/taxes" replace />;
  }

  const [formData, setFormData] = useState({
    name: '',
    computation_method: '',
    value: '',
    applicableOn: '' // sales | purchase | both
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const computationOptions = [
    { value: 'percentage', label: '% (Percentage)' },
    { value: 'fixed', label: 'Fixed Value' }
  ];

  const applicableOptions = [
    { value: 'sales', label: 'Sales' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'both', label: 'Both' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tax name is required';
    }

    if (!formData.computation_method) {
      newErrors.computation_method = 'Computation method is required';
    }

    if (!formData.value) {
      newErrors.value = 'Value is required';
    } else if (isNaN(Number(formData.value)) || Number(formData.value) <= 0) {
      newErrors.value = 'Value must be a positive number';
    } else if (formData.computation_method === 'percentage' && Number(formData.value) > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }

    if (!formData.applicableOn) {
      newErrors.applicableOn = 'Applicable on is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    computation_method: formData.computation_method as 'percentage' | 'fixed',
    value: Number(formData.value),
    is_applicable_on_sales: ['sales','both'].includes(formData.applicableOn),
    is_applicable_on_purchase: ['purchase','both'].includes(formData.applicableOn)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = buildPayload();
    setIsLoading(true);
    try {
      console.log('Submitting tax payload', payload);
      await new Promise(resolve => setTimeout(resolve, 800));
      navigate('/taxes');
    } catch (error) {
      console.error('Error saving tax:', error);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Taxes Master</h1>
        {canCreate && (
          <ActionBar
            onNew={() => navigate('/taxes/new')}
            onConfirm={handleSubmit as any}
            onArchiveChange={() => {/* archive placeholder */}}
            onBack={() => navigate('/taxes')}
          />
        )}
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Tax Name"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="e.g., GST 18%"
            />

            <Select
              label="Tax Computation"
              required
              options={computationOptions}
              value={formData.computation_method}
              onChange={(e) => handleChange('computation_method', e.target.value)}
              error={errors.computation_method}
              placeholder="Select computation method"
            />

            <Input
              label={`Value ${formData.computation_method === 'percentage' ? '(%)' : '(₹)'}`}
              type="number"
              required
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              error={errors.value}
              placeholder={formData.computation_method === 'percentage' ? '18' : '100'}
              helperText={formData.computation_method === 'percentage' ? 'Enter percentage (0-100)' : 'Enter fixed amount'}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Tax For <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {applicableOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="applicableOn"
                      value={option.value}
                      checked={formData.applicableOn === option.value}
                      onChange={(e) => handleChange('applicableOn', e.target.value)}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.applicableOn && (
                <p className="text-sm text-red-600">{errors.applicableOn}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => navigate('/taxes')}>Back</Button>
            {((isEdit && canEdit) || (!isEdit && canCreate)) && (
              <Button type="submit" isLoading={isLoading}>{isEdit ? 'Confirm Changes' : 'Confirm'}</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}