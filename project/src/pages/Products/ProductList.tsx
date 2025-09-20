import React, { useEffect, useMemo, useState } from 'react';
import { listProducts, deleteProduct } from '../../services/productService';
import { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';

const ProductList: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const canManage = role === 'admin';
  const canView = role === 'admin' || role === 'invoicing_user';

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    listProducts(role)
      .then(setProducts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [role, canView]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.hsnCode || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const total = filtered.length;
  const totalSalesValue = filtered.reduce((sum: number, p: Product) => sum + (p.salesPrice || 0), 0);
  const totalPurchaseValue = filtered.reduce((sum: number, p: Product) => sum + (p.purchasePrice || 0), 0);
    return { total, totalSalesValue, totalPurchaseValue };
  }, [filtered]);

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id, role);
  setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!canView) {
    return <div className="p-4 text-red-500">Not authorized to view products.</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        {canManage && <Button href="/products/new">New Product</Button>}
      </div>

      <Card className="p-4 grid gap-4 md:grid-cols-4">
        <div>
          <div className="text-sm text-gray-500">Total Products</div>
          <div className="text-lg font-medium">{stats.total}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Sales Value</div>
          <div className="text-lg font-medium">₹ {stats.totalSalesValue.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Purchase Value</div>
          <div className="text-lg font-medium">₹ {stats.totalPurchaseValue.toFixed(2)}</div>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-64"
          />
        </div>
      </Card>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <Table
        isLoading={loading}
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Type', accessor: 'type' },
          { header: 'HSN Code', accessor: 'hsnCode' },
          { header: 'Category', accessor: 'category' },
          { header: 'Sales Price', accessor: (row: Product) => `₹ ${row.salesPrice.toFixed(2)}` },
          { header: 'Purchase Price', accessor: (row: Product) => `₹ ${row.purchasePrice.toFixed(2)}` },
          { header: 'Sales Tax %', accessor: (row: Product) => row.salesTaxPercent.toFixed(2) },
          { header: 'Purchase Tax %', accessor: (row: Product) => row.purchaseTaxPercent.toFixed(2) },
          { header: 'Actions', accessor: (row: Product) => (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" href={`/products/${row.id}`}>View</Button>
              {canManage && (
                <>
                  <Button size="sm" href={`/products/${row.id}/edit`}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
                </>
              )}
            </div>
          ) }
        ]}
        data={filtered}
      />
    </div>
  );
};

export default ProductList;
