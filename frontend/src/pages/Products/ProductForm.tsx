import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import ActionBar from '../../components/UI/ActionBar';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateMasterData, canEditMasterData } from '../../utils/rolePermissions';
import productService from '../../services/productService';

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
    tax_name: '',
    hsn_code: '',
    current_stock: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hsnQuery, setHsnQuery] = useState('');
  const [hsnCategory, setHsnCategory] = useState<'null' | 'P' | 'S'>('null');
  const [hsnResults, setHsnResults] = useState<{ code: string; description: string }[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [hsnSearching, setHsnSearching] = useState(false);
  const role = user?.role;

  // Load product when editing
  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    setIsFetching(true);
    productService.get(id as string, role)
      .then(p => {
        if (!active) return;
        setFormData({
          name: p.name,
          type: p.type,
          category: p.category || '',
          sales_price: String(p.salesPrice),
          purchase_price: String(p.purchasePrice),
          tax_name: p.taxName || '',
          hsn_code: p.hsnCode || '',
          current_stock: String(p.currentStock ?? 0),
        });
      })
      .catch(e => setErrors(prev => ({ ...prev, load: e.message })))
      .finally(() => active && setIsFetching(false));
    return () => { active = false; };
  }, [isEdit, id, role]);

  // Fetch existing categories once (reuse product list API if available)
  useEffect(() => {
    // lightweight: reuse list to derive categories (admin or invoicing_user only)
  if (!role || (role as string) === 'contact') return;
    productService.list(role).then(list => {
      const cats = Array.from(new Set(list.map(p => p.category).filter(Boolean)));
      setAllCategories(cats as string[]);
    }).catch(()=>{});
  }, [role]);

  // Debounced HSN search
  useEffect(() => {
    if (!hsnQuery.trim()) { setHsnResults([]); return; }
    const handle = setTimeout(() => {
      setHsnSearching(true);
      productService.searchHsn(
        hsnQuery + '',
        role,
        hsnCategory
      )
        .then(r => setHsnResults(r))
        .catch(() => setHsnResults([]))
        .finally(() => setHsnSearching(false));
    }, 400);
    return () => clearTimeout(handle);
  }, [hsnQuery, role, formData.type, formData.category, hsnCategory]);


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
    // Tax percentage validation (0-100, allow decimals)
    // tax_name optional; if provided enforce length
    if (formData.tax_name && formData.tax_name.length > 100) {
      newErrors.tax_name = 'Tax name too long';
    }

    if (!formData.hsn_code.trim()) {
      newErrors.hsn_code = 'HSN/SAC Code is required';
    }

    if (formData.current_stock) {
      const cs = Number(formData.current_stock);
      if (isNaN(cs) || cs < 0) newErrors.current_stock = 'Current stock must be a non-negative number';
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
  tax_name: formData.tax_name.trim() || null,
    hsn_code: formData.hsn_code.trim() || null,
  current_stock: formData.current_stock ? Number(formData.current_stock) : 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = buildPayload();
    setIsLoading(true);
    try {
      if (isEdit) {
        await productService.update(id as string, payload as any, role);
      } else {
        await productService.create(payload as any, role);
      }
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

            <div className="space-y-1 relative">
              <label className="block text-sm font-medium text-gray-700">Product Category <span className="text-red-500">*</span></label>
              <input
                value={formData.category}
                onChange={e => {
                  handleChange('category', e.target.value);
                  setCategoryQuery(e.target.value);
                  setShowCategorySuggestions(true);
                }}
                onFocus={() => { if (categoryQuery.length >= 0) setShowCategorySuggestions(true); }}
                placeholder="e.g., Furniture, Electronics"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${errors.category ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
              {showCategorySuggestions && (categoryQuery.length > 0 || allCategories.length > 0) && (
                <ul className="absolute z-20 mt-1 max-h-48 overflow-auto w-full bg-white border rounded shadow text-sm divide-y">
                  {allCategories.filter(c => c.toLowerCase().includes(categoryQuery.toLowerCase()) && c !== formData.category).slice(0,8).map(c => (
                    <li
                      key={c}
                      className="p-2 hover:bg-purple-50 cursor-pointer"
                      onClick={() => { setFormData(prev => ({ ...prev, category: c })); setShowCategorySuggestions(false); }}
                    >{c}</li>
                  ))}
                  {categoryQuery && !allCategories.some(c => c.toLowerCase() === categoryQuery.toLowerCase()) && (
                    <li className="p-2 text-gray-500 italic">Press Tab/Enter to keep "{categoryQuery}"</li>
                  )}
                  <li className="p-2 text-right"><button type="button" className="text-xs text-gray-500 hover:text-gray-700" onClick={() => setShowCategorySuggestions(false)}>Close</button></li>
                </ul>
              )}
            </div>

            <div className="space-y-1 relative">
              <Input
                label="HSN/SAC Code"
                required
                value={formData.hsn_code}
                onChange={(e) => { handleChange('hsn_code', e.target.value); setHsnQuery(e.target.value); }}
                error={errors.hsn_code}
                placeholder="Search or enter HSN/SAC code"
                helperText="Type to search official codes"
              />
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">HSN Search Scope</span>
                  <div className="flex gap-1">
                    {[
                      { label: 'All', value: 'null' },
                      { label: 'Goods', value: 'P' },
                      { label: 'Services', value: 'S' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setHsnCategory(opt.value as any)}
                        className={`px-2 py-1 rounded border text-xs transition ${hsnCategory === opt.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-purple-50'}`}
                      >{opt.label}</button>
                    ))}
                    {hsnResults.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setHsnResults([]); setHsnQuery(''); }}
                        className="px-2 py-1 rounded border text-xs bg-white text-gray-500 hover:text-gray-700 border-gray-300"
                      >Clear</button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500">Choose a scope before searching by description. All = both goods & services.</p>
              </div>
              {hsnSearching && <div className="absolute right-3 top-9 text-xs text-gray-500">Searching…</div>}
              {(hsnResults.length > 0 || (!hsnSearching && hsnQuery.trim())) && (
                <ul className="absolute z-10 mt-1 max-h-60 overflow-auto w-full bg-white border rounded shadow text-sm divide-y">
                  {hsnResults.length === 0 && !hsnSearching && (
                    <li className="p-3 text-gray-500 text-xs">No results for "{hsnQuery}". Try adjusting scope or query.</li>
                  )}
                  {hsnResults.map(r => (
                    <li
                      key={r.code + r.description}
                      className="p-2 hover:bg-purple-50 cursor-pointer"
                      onClick={() => { setFormData(prev => ({ ...prev, hsn_code: r.code })); setHsnQuery(''); setHsnResults([]); }}
                    >
                      <div className="font-medium">{r.code}</div>
                      <div className="text-gray-600 line-clamp-2">{r.description}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Input label="Sales Price" type="number" required value={formData.sales_price} onChange={(e) => handleChange('sales_price', e.target.value)} error={errors.sales_price} placeholder="0.00" />

            <Input label="Tax Name" value={formData.tax_name} onChange={(e) => handleChange('tax_name', e.target.value)} error={errors.tax_name} placeholder="e.g., GST18" helperText="Must match a configured tax entry name" />

            <Input label="Purchase Price" type="number" required value={formData.purchase_price} onChange={(e) => handleChange('purchase_price', e.target.value)} error={errors.purchase_price} placeholder="0.00" />
            <Input label="Current Stock" type="number" value={formData.current_stock} onChange={(e) => handleChange('current_stock', e.target.value)} error={errors.current_stock} placeholder="0" helperText="Leave blank for 0" />
          </div>

          {/* HSN search helper message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
            Start typing an HSN/SAC code or description to search. Select a result to fill the code.
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => navigate('/products')}>Back</Button>
            {((isEdit && canEdit) || (!isEdit && canCreate)) && (
              <Button type="submit" isLoading={isLoading || isFetching}>{isEdit ? 'Confirm Changes' : 'Confirm'}</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}