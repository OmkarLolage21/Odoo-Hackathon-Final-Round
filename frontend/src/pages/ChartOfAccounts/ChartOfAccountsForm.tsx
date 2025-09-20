import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import ActionBar from '../../components/UI/ActionBar';
import { useAuth } from '../../contexts/AuthContext';
import accountService from '../../services/accountService';
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
    name: '',
    type: '',
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

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    let active = true;
    async function load() {
      if (isEdit && id) {
        setIsLoading(true);
        try {
          const acct = await accountService.get(id, user?.role);
          if (active) {
            setFormData({ name: acct.name, type: acct.type });
          }
        } catch (e: any) {
          // swallow load error for now; could surface with a toast later
        } finally {
          active && setIsLoading(false);
        }
      }
    }
    load();
    return () => { active = false; };
  }, [isEdit, id, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      const payload = {
        name: formData.name.trim(),
        type: formData.type as 'asset' | 'liability' | 'income' | 'expense' | 'equity'
      };
      if (isEdit && id) {
        await accountService.update(id, payload, user?.role);
      } else {
        await accountService.create(payload, user?.role);
      }
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
            <Input label="Account Name" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} error={errors.name} placeholder="Enter account name" />

            <Select label="Type" required options={typeOptions} value={formData.type} onChange={(e) => handleChange('type', e.target.value)} error={errors.type} placeholder="Select account type" />
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