import { useEffect, useState, useMemo } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import { useNavigate } from 'react-router-dom';
import { SalesOrderLineInput, SalesOrderResponse, ContactResponse } from '../../types';
import contactService from '../../services/contactService';
import customerInvoiceService from '../../services/customerInvoiceService';
import { useAuth } from '../../contexts/AuthContext';
import salesOrderService from '../../services/salesOrderService';
import productService from '../../services/productService';

interface DraftLine extends SalesOrderLineInput { temp_id: string; product_id?: string | null; tax_percent?: number; }

export default function SalesOrderForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [order, setOrder] = useState<SalesOrderResponse | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [newLine, setNewLine] = useState<DraftLine>({ temp_id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, product_id: null, tax_percent: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  useEffect(() => {
    if (!role) return;
    setProductLoading(true);
    productService.list(role)
      .then(data => setProducts(data))
      .catch(()=>{})
      .finally(()=> setProductLoading(false));
  }, [role]);

  // Fetch contacts for dropdown (customers and both)
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  useEffect(() => {
    contactService.list().then(list => {
      const filtered = list.filter(c => c.type === 'customer' || c.type === 'both');
      setContacts(filtered);
    }).catch(()=>{});
  }, []);

  const customerOptions = useMemo(() => contacts.map(c => ({ value: c.id, label: c.name })), [contacts]);

  // When product changes, auto-fill unit price and tax preview
  useEffect(() => {
    if (!newLine.product_id) return;
    const p = products.find(p => p.id === newLine.product_id);
    if (p) {
      setNewLine(n => ({
        ...n,
        product_name: p.name,
        unit_price: p.salesPrice,
        tax_percent: p.salesTaxPercent ?? 0
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newLine.product_id]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLocalLine = () => {
    if (!newLine.product_id || !newLine.product_name || newLine.quantity <= 0) return;
    setLines(prev => [...prev, newLine]);
    setNewLine({ temp_id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, product_id: null, tax_percent: 0 });
  };

  const submitDraft = async () => {
    if (!role) return;
    if (lines.length === 0) return;
    setLoading(true);
    setError(null);
    try {
  const payload = { lines: lines.map(l => ({ product_name: l.product_name, product_id: l.product_id, quantity: l.quantity, unit_price: l.unit_price })) };
      const so = await salesOrderService.createDraft(payload, role);
      setOrder(so);
    } catch (e: any) {
      setError(e.message || 'Failed to create sales order');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: 'draft' | 'confirmed' | 'cancelled') => {
    if (!order || !role) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await salesOrderService.update(order.id, { status }, role);
      setOrder(updated);
    } catch (e:any) {
      setError(e.message || 'Status update failed');
    } finally {
      setLoading(false);
    }
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

  const displayLines = (order ? order.lines : lines.map(l => ({
    id: l.temp_id,
    product_name: l.product_name,
    quantity: l.quantity,
    unit_price: l.unit_price,
    untaxed_amount: l.quantity * l.unit_price,
    tax_percent: l.tax_percent ?? 0,
    tax_amount: (l.quantity * l.unit_price) * ((l.tax_percent ?? 0)/100),
    total_amount: (l.quantity * l.unit_price) * (1 + (l.tax_percent ?? 0)/100),
  }))).map((line, idx) => ({ ...line, idx: idx + 1 }));

  const totals = displayLines.reduce((acc, l: any) => {
    acc.untaxed += Number(l.untaxed_amount) || 0;
    acc.tax += Number(l.tax_amount) || 0;
    acc.total += Number(l.total_amount) || 0;
    return acc;
  }, { untaxed: 0, tax: 0, total: 0 });

  const createInvoice = async () => {
    if (!order || order.status !== 'confirmed' || !role) return;
    setLoading(true);
    setError(null);
    try {
      const inv = await customerInvoiceService.createFromSalesOrder(order.id, role);
      navigate(`/customer-invoices/${inv.id}`);
    } catch (e:any) {
      setError(e.message || 'Failed to create invoice');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => navigate('/sales-orders/new')}>New</Button>
          <Button size="sm" variant="primary" disabled={!!order && order.status !== 'draft'} onClick={() => { if(!order) submitDraft(); else updateStatus('confirmed'); }}>
            {order ? 'Confirm' : (loading ? 'Saving...' : 'Confirm')}
          </Button>
          <Button size="sm" variant="secondary" disabled>Print</Button>
          <Button size="sm" variant="secondary" disabled>Send</Button>
          <Button size="sm" variant="secondary" disabled={!order || order.status !== 'draft'} onClick={() => updateStatus('cancelled')}>Cancel</Button>
          <Button size="sm" variant="primary" disabled={!(order && order.status==='confirmed')} onClick={createInvoice}>Invoice</Button>
          <div className="ml-auto flex gap-2 text-xs">
            <span className={`px-2 py-1 rounded border ${(!order || order.status==='draft')?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Draft</span>
            <span className={`px-2 py-1 rounded border ${(order && order.status==='confirmed')?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Confirm</span>
            <span className={`px-2 py-1 rounded border ${(order && order.status==='cancelled')?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Cancelled</span>
          </div>
          <div className="ml-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/sales-orders')}>Back</Button>
          </div>
        </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

        {/* Header fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">SO No.</label>
            <div className="text-sm font-medium">{order?.so_number || '(auto)'}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">auto generate UUID (can switch to sequential later)</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">SO Date</label>
            <div className="text-sm font-medium">{order ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Creation date</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Customer</label>
            {(!order || order.status==='draft') && !loading ? (
              <select
                aria-label="Customer"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={customerId || ''}
                onChange={e => {
                  const val = e.target.value || '';
                  setCustomerId(val || null);
                  const sel = customerOptions.find(o => o.value === val);
                  setCustomerName(sel?.label || '');
                }}
              >
                <option value="">Select customer</option>
                {customerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : <div className="text-sm font-medium">{customerName || '-'}</div>}
            <div className="text-[10px] text-gray-500 mt-0.5">Linked to Contacts (customer/both)</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Reference</label>
            {(!order || order.status==='draft') ? (
              <Input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Reference" />
            ) : <div className="text-sm font-medium">{reference || '-'}</div>}
            <div className="text-[10px] text-gray-500 mt-0.5">Optional reference field</div>
          </div>
        </div>
      </Card>

      {(!order || order.status === 'draft') && !loading && (
        <Card>
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
              <Input type="number" value={newLine.unit_price} onChange={e=>setNewLine(n=>({...n, unit_price: Number(e.target.value)}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600">Tax %</label>
              <Input type="number" value={newLine.tax_percent ?? 0} disabled />
            </div>
            <div className="flex items-center pt-5">
              <Button type="button" onClick={addLocalLine}>Add Line</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <Table
          columns={columns as any}
          data={displayLines as any}
          isLoading={false}
        />
        <div className="flex justify-end mt-4 space-x-8 text-sm font-semibold">
          <div>Untaxed: {totals.untaxed.toFixed(2)}</div>
          <div>Tax: {totals.tax.toFixed(2)}</div>
          <div>Total: {totals.total.toFixed(2)}</div>
        </div>
      </Card>
    </div>
  );
}
