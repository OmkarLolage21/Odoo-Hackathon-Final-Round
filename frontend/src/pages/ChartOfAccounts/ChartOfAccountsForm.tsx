import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import ActionBar from '../../components/UI/ActionBar';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateMasterData, canEditMasterData } from '../../utils/rolePermissions';

export default function ChartOfAccountsForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const canEdit = canEditMasterData(user?.role);
  const canCreate = canCreateMasterData(user?.role);

  if (user?.role === 'contact') {
    return <Navigate to="/chart-of-accounts" replace />;
  }
  if (user?.role === 'invoicing_user' && isEdit) {
    return <Navigate to="/chart-of-accounts" replace />;
  }

  const [formData, setFormData] = useState({
    account_name: '',
    account_type: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const typeOptions = [
    { value: 'asset', label: 'Assets' },
    { value: 'liability', label: 'Liabilities' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'equity', label: 'Equity' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required';
    }

    if (!formData.account_type) {
      newErrors.account_type = 'Account type is required';
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
      const payload = {
        account_name: formData.account_name.trim(),
        account_type: formData.account_type as 'asset' | 'liability' | 'income' | 'expense' | 'equity',
        is_active: formData.is_active
      };
      console.log('Submitting account payload', payload);
      await new Promise(resolve => setTimeout(resolve, 600));
      navigate('/chart-of-accounts');
    } catch (error) {
      console.error('Error saving account:', error);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chart of Accounts Master</h1>
        {canCreate && (
          <ActionBar
            onNew={() => navigate('/chart-of-accounts/new')}
            onConfirm={handleSubmit as any}
            onArchiveChange={() => {/* archive placeholder */}}
            onBack={() => navigate('/chart-of-accounts')}
          />
        )}
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Account Name" required value={formData.account_name} onChange={(e) => handleChange('account_name', e.target.value)} error={errors.account_name} placeholder="Enter account name" />

            <Select label="Type" required options={typeOptions} value={formData.account_type} onChange={(e) => handleChange('account_type', e.target.value)} error={errors.account_type} placeholder="Select account type" />
            <div className="flex items-center space-x-2 mt-2">
              <input id="is_active" type="checkbox" checked={formData.is_active} onChange={e=>setFormData(p=>({...p,is_active:e.target.checked}))} className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
              <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => navigate('/chart-of-accounts')}>Back</Button>
            {((isEdit && canEdit) || (!isEdit && canCreate)) && (
              <Button type="submit" isLoading={isLoading}>{isEdit ? 'Confirm Changes' : 'Confirm'}</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}