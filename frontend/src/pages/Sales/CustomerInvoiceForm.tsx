import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import ActionBar from '../../components/UI/ActionBar';
import Select from '../../components/UI/Select';
import { useNavigate, useParams } from 'react-router-dom';
import productService from '../../services/productService';
import accountService from '../../services/accountService';
import customerInvoiceService from '../../services/customerInvoiceService';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerInvoiceCreateRequest, CustomerInvoiceResponse, ContactResponse } from '../../types';
import contactService from '../../services/contactService';

interface LineUI { id: string; product_id?: string; product_name: string; hsn_code?: string; account_id?: string | null; quantity: number; unit_price: number; }

export default function CustomerInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const role = user?.role;

  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [lines, setLines] = useState<LineUI[]>([{ id: '1', product_name: '', quantity: 1, unit_price: 0, account_id: undefined }]);
  const [status, setStatus] = useState<string>('draft');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  // View (read-only) only if existing invoice and not in draft
  const isView = !!id && status !== 'draft';

  useEffect(() => {
    (async () => {
      const [prodList, acctList] = await Promise.all([
        productService.list(role),
        accountService.list(role)
      ]);
      setProducts(prodList);
      setAccounts(acctList);

      if (id) {
        try {
          const invoice: CustomerInvoiceResponse = await customerInvoiceService.get(id, role);
          setCustomerName(invoice.customer_name || '');
            // Dates from backend assumed ISO; slice for input date value
          setInvoiceDate(invoice.invoice_date ? invoice.invoice_date.slice(0,10) : '');
          setDueDate(invoice.due_date ? invoice.due_date.slice(0,10) : '');
          setStatus(invoice.status);
          setAmountPaid(invoice.amount_paid);
          setTotalAmount(invoice.total_amount);
          if (invoice.lines && invoice.lines.length) {
            setLines(invoice.lines.map((l, idx) => ({
              id: String(idx + 1),
              product_id: l.product_id || undefined,
              product_name: l.product_name || '',
              hsn_code: l.hsn_code || '',
              account_id: l.account_id || undefined,
              quantity: l.quantity,
              unit_price: l.unit_price,
            })));
          }
        } catch (e) {
          console.error('Failed to fetch invoice', e);
        }
      }
    })();
  }, [role, id]);

  // After products are loaded and lines present, fill missing HSN codes
  useEffect(() => {
    if (!products.length) return;
    setLines(ls => ls.map(l => {
      if (l.hsn_code || !l.product_id) return l;
      const prod = products.find(p => p.id === l.product_id);
      if (!prod) return l;
      return { ...l, hsn_code: prod.hsnCode || '' };
    }));
  }, [products]);

  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name })), [products]);
  const accountOptions = useMemo(() => accounts.map((a: any) => ({ value: a.id, label: a.name })), [accounts]);

  // Contacts (customers & both) for dropdown
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  useEffect(() => {
    contactService.list().then(list => {
      setContacts(list.filter(c => c.type === 'customer' || c.type === 'both'));
    }).catch(()=>{});
  }, []);
  const customerOptions = useMemo(() => contacts.map(c => ({ value: c.id, label: c.name })), [contacts]);

  const updateLine = (lineId: string, patch: Partial<LineUI>) => {
    setLines(ls => ls.map(l => l.id === lineId ? { ...l, ...patch } : l));
  };

  const onChangeProduct = (lineId: string, productId: string) => {
    const p = products.find(p => p.id === productId);
    updateLine(lineId, { product_id: productId, product_name: p?.name || '', hsn_code: p?.hsnCode || '' });
  };

  const addLine = () => setLines(ls => [...ls, { id: String(ls.length + 1), product_name: '', quantity: 1, unit_price: 0 }]);

  const totals = useMemo(() => {
    // Client-side provisional subtotal only; server returns tax/total
    const untaxed = lines.reduce((s, l) => s + (l.quantity || 0) * (l.unit_price || 0), 0);
    return { untaxed };
  }, [lines]);

  const onSave = async () => {
    const payload: CustomerInvoiceCreateRequest = {
      status: 'draft',
      customer_name: customerName || null,
      invoice_date: invoiceDate || null,
      due_date: dueDate || null,
      lines: lines.map(l => ({
        product_name: l.product_name,
        product_id: l.product_id,
        account_id: l.account_id ?? null,
        quantity: l.quantity,
        unit_price: l.unit_price,
      }))
    };
    const resp = await customerInvoiceService.create(payload, role);
    navigate(`/customer-invoices/${resp.id}`);
    return resp;
  };

  const onConfirm = async () => {
    if (!id) return;
    const updated = await customerInvoiceService.updateStatus(id, 'posted', role);
    setStatus(updated.status);
    setAmountPaid(updated.amount_paid);
    setTotalAmount(updated.total_amount);
  };

  const outstanding = useMemo(() => Math.max(0, totalAmount - amountPaid), [totalAmount, amountPaid]);
  const canPay = !!id && status === 'posted' && outstanding > 0;
  const onPay = () => { if (id) navigate(`/customer-invoices/${id}/pay`); };

  return (
    <div className="space-y-6">
      <ActionBar
        onBack={() => navigate(-1)}
        onNew={() => navigate('/customer-invoices/new')}
        onConfirm={isView ? undefined : onSave}
        onArchiveChange={() => {}}
      />
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{id ? `Customer Invoice #${id}` : 'New Customer Invoice'}</h1>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-1 rounded border ${status === 'draft' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{status.toUpperCase()}</span>
            {status === 'draft' && id && (
              <Button size="sm" onClick={onConfirm} variant="primary">Confirm</Button>
            )}
            {canPay && (
              <Button size="sm" onClick={onPay} variant="secondary">Pay</Button>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            {isView ? (
              <Input value={customerName} readOnly />
            ) : (
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
            )}
            <div className="text-[10px] text-gray-500 mt-0.5">Linked to Contacts (customer/both)</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} readOnly={isView} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} readOnly={isView} />
          </div>
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 font-medium w-12">Sr. No.</th>
                <th className="text-left px-3 py-2 font-medium">Product</th>
                <th className="text-left px-3 py-2 font-medium">HSN No.</th>
                <th className="text-left px-3 py-2 font-medium">Account Type</th>
                <th className="text-right px-3 py-2 font-medium">Qty</th>
                <th className="text-right px-3 py-2 font-medium">Unit Price</th>
                <th className="text-right px-3 py-2 font-medium">Untaxed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, idx) => (
                <tr key={line.id}>
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 min-w-[220px]">
                    {isView ? (
                      <Input value={line.product_name} readOnly />
                    ) : (
                      <Select
                        options={productOptions}
                        value={line.product_id || ''}
                        onChange={e => onChangeProduct(line.id, e.target.value)}
                        placeholder="Select product"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 w-40">
                    <Input value={line.hsn_code || ''} readOnly placeholder="Auto from product" />
                  </td>
                  <td className="px-3 py-2 min-w-[220px]">
                    {isView ? (
                      <Input value={accountOptions.find(a => a.value === line.account_id)?.label || ''} readOnly />
                    ) : (
                      <Select
                        options={accountOptions}
                        value={line.account_id || ''}
                        onChange={e => updateLine(line.id, { account_id: e.target.value })}
                        placeholder="Select account"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 w-28">
                    <Input type="number" value={line.quantity}
                      onChange={e => {
                        if (isView) return;
                        let q = Number(e.target.value);
                        if (isNaN(q)) q = 1;
                        if (q < 1) q = 1;
                        if (q > 10) q = 10;
                        updateLine(line.id, { quantity: q });
                      }} readOnly={isView} />
                  </td>
                  <td className="px-3 py-2 w-36">
                    <Input type="number" value={line.unit_price}
                      onChange={e => updateLine(line.id, { unit_price: Number(e.target.value) })} readOnly={isView} />
                  </td>
                  <td className="px-3 py-2 text-right w-36">₹{(line.quantity * line.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isView && (
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={addLine}>Add Line</Button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">Total Untaxed: ₹{totals.untaxed.toFixed(2)} {id && status !== 'draft' && (
            <span className="ml-4 text-gray-500">Outstanding: ₹{outstanding.toFixed(2)}</span>
          )}</div>
          {!isView && (
            <div className="flex items-center gap-3">
              <Button onClick={onSave}>Save (Draft)</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
