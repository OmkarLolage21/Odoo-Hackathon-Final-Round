import { useEffect, useState, useMemo } from 'react';
import { PurchaseOrderLineInput, PurchaseOrderResponse, ContactResponse } from '../../types';
import contactService from '../../services/contactService';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import productService from '../../services/productService';
import purchaseOrderService from '../../services/purchaseOrderService';
import { createBillFromPurchaseOrder } from '../../services/vendorBillService';
import { useAuth } from '../../contexts/AuthContext';
// (duplicate type import removed)

interface DraftLine extends PurchaseOrderLineInput { temp_id: string; product_id?: string | null; tax_percent?: number; }

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const [order, setOrder] = useState<PurchaseOrderResponse | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [newLine, setNewLine] = useState<DraftLine>({ temp_id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, product_id: null, tax_percent: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorId, setVendorId] = useState<string | null>(null);
  // Fetch contacts for vendor dropdown
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  useEffect(() => {
    contactService.list().then(list => {
      const filtered = list.filter(c => c.type === 'vendor' || c.type === 'both');
      setContacts(filtered);
    }).catch(()=>{});
  }, []);

  const vendorOptions = useMemo(() => contacts.map(c => ({ value: c.id, label: c.name })), [contacts]);

  useEffect(() => {
    if (!role) return;
    setProductLoading(true);
    productService.list(role)
      .then((data: any[]) => setProducts(data))
      .catch(()=>{})
      .finally(()=> setProductLoading(false));
  }, [role]);

  useEffect(() => {
    if (!newLine.product_id) return;
    const p = products.find((p: any) => p.id === newLine.product_id);
    if (p) {
      setNewLine((n: DraftLine) => ({ ...n, product_name: p.name, unit_price: p.purchasePrice, tax_percent: p.purchaseTaxPercent ?? 0 }));
    }
  }, [newLine.product_id, products]);

  const addLocalLine = () => {
    if (!newLine.product_id || !newLine.product_name || newLine.quantity <= 0) return;
  setLines((prev: DraftLine[]) => [...prev, newLine]);
    setNewLine({ temp_id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, product_id: null, tax_percent: 0 });
  };

  const createDraft = async () => {
    if (!role) return;
    if (lines.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const payload = { vendor_name: vendorName || null, lines: lines.map((l: DraftLine) => ({ product_name: l.product_name, product_id: l.product_id, quantity: l.quantity, unit_price: l.unit_price })) };
      const po = await purchaseOrderService.createDraft(payload as any, role);
      setOrder(po);
    } catch (e:any) {
      setError(e.message || 'Failed to create purchase order');
    } finally { setLoading(false); }
  };

  const confirmOrder = async () => {
    if (!role || !order) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await purchaseOrderService.update(order.id, { status: 'confirmed' } as any, role);
      setOrder(updated);
    } catch(e:any) {
      setError(e.message || 'Failed to confirm purchase order');
    } finally { setLoading(false); }
  };

  const createBill = async () => {
    if (!role || !order || order.status !== 'confirmed') return;
    setLoading(true);
    setError(null);
    try {
  const bill: any = await createBillFromPurchaseOrder(order.id, role);
  navigate(`/vendor-bills/${bill.id}`);
    } catch(e:any) {
      setError(e.message || 'Failed to create vendor bill');
    } finally { setLoading(false); }
  };

  const columns = [
    { key: 'idx', label: 'Sr. No.' },
    { key: 'product_name', label: 'Product' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit_price', label: 'Unit Price' },
    { key: 'untaxed_amount', label: 'Untaxed Amount' },
    { key: 'tax_percent', label: 'Tax %' },
    { key: 'tax_amount', label: 'Tax Amount' },
    { key: 'total_amount', label: 'Total' },
  ];

  const displayLines = (order ? order.lines : lines.map((l: DraftLine) => ({
    id: l.temp_id,
    product_name: l.product_name,
    quantity: l.quantity,
    unit_price: l.unit_price,
    untaxed_amount: l.quantity * l.unit_price,
    tax_percent: l.tax_percent ?? 0,
    tax_amount: (l.quantity * l.unit_price) * ((l.tax_percent ?? 0)/100),
    total_amount: (l.quantity * l.unit_price) * (1 + (l.tax_percent ?? 0)/100),
  }))).map((line: any, idx: number) => ({ ...line, idx: idx + 1 }));

  const totals = displayLines.reduce((acc: {untaxed:number; tax:number; total:number}, l: any) => {
    acc.untaxed += Number(l.untaxed_amount) || 0;
    acc.tax += Number(l.tax_amount) || 0;
    acc.total += Number(l.total_amount) || 0;
    return acc;
  }, { untaxed: 0, tax: 0, total: 0 });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => navigate('/purchase-orders/new')}>New</Button>
          {!order && (
            <Button size="sm" variant="primary" disabled={loading || lines.length===0} onClick={createDraft}>{loading ? 'Saving...' : 'Save Draft'}</Button>
          )}
          {order && order.status==='draft' && (
            <Button size="sm" variant="primary" disabled={loading} onClick={confirmOrder}>{loading ? 'Confirming...' : 'Confirm'}</Button>
          )}
          <Button size="sm" variant="secondary" disabled>Print</Button>
          <Button size="sm" variant="secondary" disabled>Send</Button>
          <Button size="sm" variant="secondary" disabled>Cancel</Button>
          <Button size="sm" variant="primary" disabled={!(order && order.status==='confirmed')} onClick={createBill}>{loading && order?.status==='confirmed' ? 'Creating...' : 'Bill'}</Button>
          <div className="ml-auto flex gap-2 text-xs">
            <span className={`px-2 py-1 rounded border ${(!order)?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Draft</span>
            <span className={`px-2 py-1 rounded border ${(order && order.status==='confirmed')?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Confirm</span>
            <span className={`px-2 py-1 rounded border ${(order && order.status==='cancelled')?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Cancelled</span>
          </div>
          <div className="ml-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/purchase-orders')}>Back</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">PO No.</label>
            <div className="text-sm font-medium">{order?.po_number || '(auto)'}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">auto generate UUID (future: sequential)</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">PO Date</label>
            <div className="text-sm font-medium">{order ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Creation date</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Vendor</label>
            {(!order || order.status==='draft') ? (
              <select
                aria-label="Vendor"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={vendorId || ''}
                onChange={e => {
                  const val = e.target.value || '';
                  setVendorId(val || null);
                  const sel = vendorOptions.find(o => o.value === val);
                  setVendorName(sel?.label || '');
                }}
              >
                <option value="">Select vendor</option>
                {vendorOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : <div className="text-sm font-medium">{vendorName || '-'}</div>}
            <div className="text-[10px] text-gray-500 mt-0.5">Linked to Contacts (vendor/both)</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Reference</label>
            <div className="text-sm font-medium">-</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Optional reference</div>
          </div>
        </div>
        {(!order) && (
          <div className="grid md:grid-cols-6 gap-4 items-end">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600">Product</label>
              <select
                aria-label="Product select"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newLine.product_id || ''}
                onChange={e=>setNewLine(n=>({...n, product_id: e.target.value || null}))}
              >
                <option value="">{productLoading ? 'Loading...' : 'Select product'}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600">Qty</label>
              <Input type="number" value={newLine.quantity} onChange={e=>{
                let q = Number(e.target.value);
                if (isNaN(q)) q = 1;
                if (q < 1) q = 1;
                if (q > 10) q = 10;
                setNewLine(n=>({...n, quantity: q}));
              }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600">Unit Price</label>
              <Input type="number" value={newLine.unit_price} onChange={e=>{
                let v = Number(e.target.value);
                if (isNaN(v) || v < 0) v = 0;
                setNewLine(n=>({...n, unit_price: v}));
              }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600">Tax %</label>
              <Input type="number" value={newLine.tax_percent ?? 0} disabled />
            </div>
            <div className="flex items-center pt-5">
              <Button type="button" onClick={addLocalLine}>Add Line</Button>
            </div>
          {/* (Removed duplicate quantity input) */}
          </div>
        )}
        <Table columns={columns as any} data={displayLines as any} isLoading={false} />
        <div className="flex justify-end mt-4 space-x-8 text-sm font-semibold">
          <div>Untaxed: {totals.untaxed.toFixed(2)}</div>
          <div>Tax: {totals.tax.toFixed(2)}</div>
          <div>Total: {totals.total.toFixed(2)}</div>
        </div>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </Card>
    </div>
  );
}
