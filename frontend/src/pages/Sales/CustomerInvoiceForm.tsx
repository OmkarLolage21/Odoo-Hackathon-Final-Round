import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import ActionBar from '../../components/UI/ActionBar';
import Select from '../../components/UI/Select';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import accountService from '../../services/accountService';
import customerInvoiceService from '../../services/customerInvoiceService';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerInvoiceCreateRequest } from '../../types';

interface LineUI { id: string; product_id?: string; product_name: string; hsn_code?: string; account_id?: string | null; quantity: number; unit_price: number; }

export default function CustomerInvoiceForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [lines, setLines] = useState<LineUI[]>(
    [{ id: '1', product_name: '', quantity: 1, unit_price: 0, account_id: undefined }]
  );

  useEffect(() => {
    (async () => {
      const [prodList, acctList] = await Promise.all([
        productService.list(role),
        accountService.list(role)
      ]);
      setProducts(prodList);
      setAccounts(acctList);
    })();
  }, [role]);

  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name })), [products]);
  const accountOptions = useMemo(() => accounts.map((a: any) => ({ value: a.id, label: a.name })), [accounts]);

  const updateLine = (id: string, patch: Partial<LineUI>) => {
    setLines(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
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
    navigate('/customer-invoices');
    return resp;
  };

  return (
    <div className="space-y-6">
      <ActionBar onBack={() => navigate(-1)} onNew={() => navigate('/customer-invoices/new')} onConfirm={onSave} onArchiveChange={()=>{}} />
      <Card>
        <h1 className="text-xl font-semibold mb-4">New Customer Invoice</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 font-medium w-12">Sr. No.</th>
                <th className="text-left px-3 py-2 font-medium">Product</th>
                <th className="text-left px-3 py-2 font-medium">HSN No.</th>
                <th className="text-left px-3 py-2 font-medium">Account Name</th>
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
                    <Select
                      options={productOptions}
                      value={line.product_id || ''}
                      onChange={e => onChangeProduct(line.id, e.target.value)}
                      placeholder="Select product"
                    />
                  </td>
                  <td className="px-3 py-2 w-40">
                    <Input value={line.hsn_code || ''} readOnly placeholder="Auto from product" />
                  </td>
                  <td className="px-3 py-2 min-w-[220px]">
                    <Select
                      options={accountOptions}
                      value={line.account_id || ''}
                      onChange={e => updateLine(line.id, { account_id: e.target.value })}
                      placeholder="Select account"
                    />
                  </td>
                  <td className="px-3 py-2 w-28">
                    <Input type="number" value={line.quantity}
                      onChange={e => updateLine(line.id, { quantity: Number(e.target.value) })} />
                  </td>
                  <td className="px-3 py-2 w-36">
                    <Input type="number" value={line.unit_price}
                      onChange={e => updateLine(line.id, { unit_price: Number(e.target.value) })} />
                  </td>
                  <td className="px-3 py-2 text-right w-36">₹{(line.quantity * line.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={addLine}>Add Line</Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">Total Untaxed: ₹{totals.untaxed.toFixed(2)}</div>
          <div className="flex items-center gap-3">
            <Button onClick={onSave}>Save (Draft)</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
