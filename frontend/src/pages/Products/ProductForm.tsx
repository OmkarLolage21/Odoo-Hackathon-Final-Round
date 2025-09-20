import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import ActionBar from '../../components/UI/ActionBar';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateMasterData, canEditMasterData } from '../../utils/rolePermissions';

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const canEdit = canEditMasterData(user?.role);
  const canCreate = canCreateMasterData(user?.role);

  // Contact users blocked entirely
  if (user?.role === 'contact') {
    return <Navigate to="/products" replace />;
  }
  // Invoicing user cannot edit existing product
  if (user?.role === 'invoicing_user' && isEdit) {
    return <Navigate to="/products" replace />;
  }

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    sales_price: '',
    purchase_price: '',
    saleTaxPercent: '', // extension beyond schema
    purchaseTaxPercent: '', // extension beyond schema
    hsn_code: '',
    current_stock: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Product type is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.sales_price) {
      newErrors.sales_price = 'Sales price is required';
    } else if (isNaN(Number(formData.sales_price)) || Number(formData.sales_price) <= 0) {
      newErrors.sales_price = 'Sales price must be a positive number';
    }

    if (!formData.purchase_price) {
      newErrors.purchase_price = 'Purchase price is required';
    } else if (isNaN(Number(formData.purchase_price)) || Number(formData.purchase_price) <= 0) {
      newErrors.purchase_price = 'Purchase price must be a positive number';
    }

    if (!formData.saleTaxPercent) {
      newErrors.saleTaxPercent = 'Sales tax is required';
    } else if (isNaN(Number(formData.saleTaxPercent)) || Number(formData.saleTaxPercent) < 0) {
      newErrors.saleTaxPercent = 'Sales tax must be a valid percentage';
    }

    if (!formData.purchaseTaxPercent) {
      newErrors.purchaseTaxPercent = 'Purchase tax is required';
    } else if (isNaN(Number(formData.purchaseTaxPercent)) || Number(formData.purchaseTaxPercent) < 0) {
      newErrors.purchaseTaxPercent = 'Purchase tax must be a valid percentage';
    }

    if (!formData.hsn_code.trim()) {
      newErrors.hsn_code = 'HSN/SAC Code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    type: formData.type as 'goods' | 'service',
    category: formData.category.trim() || null,
    sales_price: Number(formData.sales_price),
    purchase_price: Number(formData.purchase_price),
    hsn_code: formData.hsn_code.trim() || null,
    current_stock: formData.current_stock,
    sale_tax_percent: formData.saleTaxPercent ? Number(formData.saleTaxPercent) : null,
    purchase_tax_percent: formData.purchaseTaxPercent ? Number(formData.purchaseTaxPercent) : null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = buildPayload();
    setIsLoading(true);
    try {
      console.log('Submitting product payload', payload);
      await new Promise(resolve => setTimeout(resolve, 800));
      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Master</h1>
        {canCreate && (
          <ActionBar
            onNew={() => navigate('/products/new')}
            onConfirm={handleSubmit as any}
            onArchiveChange={() => {/* archive placeholder */}}
            onBack={() => navigate('/products')}
          />
        )}
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Product Name"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="Enter product name"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="goods"
                    checked={formData.type === 'goods'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  Goods
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="service"
                    checked={formData.type === 'service'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  Service
                </label>
              </div>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            <Input label="Category" required value={formData.category} onChange={(e) => handleChange('category', e.target.value)} error={errors.category} placeholder="e.g., Furniture, Electronics" />

            <Input label="HSN/SAC Code" required value={formData.hsn_code} onChange={(e) => handleChange('hsn_code', e.target.value)} error={errors.hsn_code} placeholder="Enter HSN/SAC code" helperText="Fetch from API" />

            <Input label="Sales Price" type="number" required value={formData.sales_price} onChange={(e) => handleChange('sales_price', e.target.value)} error={errors.sales_price} placeholder="0.00" />

            <Input
              label="Sales Tax %"
              type="number"
              required
              value={formData.saleTaxPercent}
              onChange={(e) => handleChange('saleTaxPercent', e.target.value)}
              error={errors.saleTaxPercent}
              placeholder="18"
            />

            <Input label="Purchase Price" type="number" required value={formData.purchase_price} onChange={(e) => handleChange('purchase_price', e.target.value)} error={errors.purchase_price} placeholder="0.00" />

            <Input
              label="Purchase Tax %"
              type="number"
              required
              value={formData.purchaseTaxPercent}
              onChange={(e) => handleChange('purchaseTaxPercent', e.target.value)}
              error={errors.purchaseTaxPercent}
              placeholder="18"
            />
            <Input label="Current Stock" readOnly value={String(formData.current_stock)} onChange={() => {}} placeholder="0" />
          </div>

          {/* HSN Code Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">HSN/SAC Code Information</h3>
            <div className="bg-white border rounded p-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>HSN Code:</strong> 9401</p>
                  <p><strong>Description:</strong> Seats (other than those of heading 9402), whether or not convertible into beds, and parts thereof</p>
                </div>
                <div>
                  <p><strong>Rate:</strong> 18%</p>
                  <p><strong>Effective From:</strong> 01-07-2017</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">HSN/SAC Code - Fetch from API</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => navigate('/products')}>Back</Button>
            {((isEdit && canEdit) || (!isEdit && canCreate)) && (
              <Button type="submit" isLoading={isLoading}>{isEdit ? 'Confirm Changes' : 'Confirm'}</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}