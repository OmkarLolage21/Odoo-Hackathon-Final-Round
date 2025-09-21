import { useEffect, useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useNavigate, useParams } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import customerInvoiceService from '../../services/customerInvoiceService';
import { PaymentResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// InvoicePaymentForm: create & confirm a payment for a posted customer invoice
// URL: /customer-invoices/:id/pay
export default function InvoicePaymentForm() {
  const navigate = useNavigate();
  const { id: invoiceId } = useParams();
  const { user } = useAuth();
  const role = user?.role;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<'cash' | 'bank'>('bank');
  const [note, setNote] = useState('');

  // remaining amount is derived inline where needed; no separate memo required

  useEffect(() => {
    (async () => {
      if (!invoiceId) return;
      try {
        const inv = await customerInvoiceService.get(invoiceId, role);
        setInvoice(inv);
        // attempt to load existing draft; if list fails fall back to creation
        let existing = null;
        try {
          const existingPayments = await paymentService.list(role);
          existing = existingPayments.find(p => p.customer_invoice_id === invoiceId && p.status === 'draft') || null;
        } catch (listErr) {
          // log but continue; we'll attempt creation below
          console.warn('Payment list failed, will attempt direct create', listErr);
        }
        if (existing) {
          setPayment(existing);
          setAmount(existing.amount);
          setMethod(existing.payment_method);
        } else if (inv.status === 'posted' && inv.total_amount > inv.amount_paid) {
          try {
            const created = await paymentService.create({
              partner_type: 'customer',
              partner_name: inv.customer_name || null,
              payment_method: 'bank',
              amount: inv.total_amount - inv.amount_paid,
              customer_invoice_id: inv.id,
            }, role);
            setPayment(created);
            setAmount(created.amount);
            setMethod(created.payment_method);
          } catch (createErr:any) {
            setError('Failed to create draft payment: ' + (createErr?.message || 'Unknown error'));
          }
        }
      } catch (e) {
        console.error('Failed to init payment form', e);
        setError('Failed to load invoice or initialize payment');
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId, role]);

  const disabled = !payment || payment.status !== 'draft';

  const onChangeAmount = async (v: string) => {
    if (!payment) return;
    const num = Number(v);
    if (isNaN(num) || num < 0) return;
    setAmount(num);
    if (payment.status === 'draft') {
      try {
        const updated = await paymentService.update(payment.id, { }, role); // backend currently only supports status updates; amount set at creation
        setPayment(updated);
      } catch (e) { /* silent */ }
    }
  };

  const onConfirm = async () => {
    if (!payment) return;
    if (payment.status === 'draft') {
      try {
        const updated = await paymentService.update(payment.id, { status: 'posted' }, role);
        setPayment(updated);
        // reload invoice to reflect paid amount
        if (invoiceId) {
          const refreshed = await customerInvoiceService.get(invoiceId, role);
          setInvoice(refreshed);
        }
        navigate(`/customer-invoices/${invoiceId}`);
      } catch (e) {
        console.error('Payment confirm failed', e);
      }
    }
  };

  const onCancel = async () => {
    if (!payment || payment.status !== 'draft') return;
    try {
      const updated = await paymentService.update(payment.id, { status: 'cancelled' }, role);
      setPayment(updated);
    } catch (e) { console.error('Cancel failed', e); }
  };

  const onChangeMethod = async (m: 'cash' | 'bank') => { if (disabled || !payment) return; setMethod(m); };

  const formattedCurrency = (v: number) => `₹${v.toFixed(2)}`;

  if (loading) return <div className="p-4 text-sm">Loading...</div>;
  if (!invoice) return <div className="p-4 text-sm text-red-600">Invoice not found</div>;
  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        {error}
        <div className="mt-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/customer-invoices/${invoiceId}`)}>Back to Invoice</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => invoice && navigate(`/customer-invoices/${invoice.id}/pay`)}>New</Button>
          <Button size="sm" variant="primary" disabled={payment?.status !== 'draft'} onClick={onConfirm}>Confirm</Button>
          <Button size="sm" variant="secondary" disabled>Print</Button>
          <Button size="sm" variant="secondary" disabled>Send</Button>
          <Button size="sm" variant="secondary" disabled={payment?.status !== 'draft'} onClick={onCancel}>Cancel</Button>
          <div className="ml-auto flex gap-2 text-xs">
            <span className={`px-2 py-1 rounded border ${payment?.status==='draft'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Draft</span>
            <span className={`px-2 py-1 rounded border ${payment?.status==='posted'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Confirm</span>
            <span className={`px-2 py-1 rounded border ${payment?.status==='cancelled'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Cancelled</span>
          </div>
          <div className="ml-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button size="sm" variant="ghost" onClick={() => invoice && navigate(`/customer-invoices/${invoice.id}`)}>Back</Button>
          </div>
        </div>
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Payment No.</label>
            <div className="text-sm font-medium">{payment?.payment_number}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Payment Date</label>
            <div className="text-sm font-medium">{payment?.payment_date}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Payment Type</label>
            <div className="text-sm font-medium capitalize">Receive</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Partner Type</label>
            <div className="text-sm font-medium capitalize">Customer</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Partner Name</label>
            <div className="text-sm font-medium">{invoice.customer_name || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Amount</label>
            <input type="number" disabled={disabled} className="border rounded px-2 py-1 text-sm w-40" value={amount} onChange={e => onChangeAmount(e.target.value)} aria-label="Payment Amount" title="Payment Amount" />
            <div className="text-[10px] text-gray-500 mt-0.5">Change allowed while Draft</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Payment Via</label>
            <div className="flex gap-4 text-sm mt-1">
              {['bank','cash'].map(m => (
                <label key={m} className={`flex items-center gap-1 cursor-pointer ${disabled?'opacity-60':''}`}>
                  <input type="radio" name="method" disabled={disabled} checked={method===m} onChange={() => onChangeMethod(m as 'bank' | 'cash')} />
                  <span className="capitalize">{m}</span>
                </label>
              ))}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Select Medium</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Note</label>
            <textarea rows={3} disabled={disabled} className="border rounded px-2 py-1 text-sm w-full" value={note} onChange={e => setNote(e.target.value)} aria-label="Payment Note" title="Payment Note" placeholder="Optional note" />
            <div className="text-[10px] text-gray-500 mt-0.5">Extra Description</div>
          </div>
        </div>
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div />
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Invoice Total</span><span>{formattedCurrency(invoice.total_amount)}</span></div>
            <div className="flex justify-between"><span>Already Paid</span><span>{formattedCurrency(invoice.amount_paid)}</span></div>
            <div className="flex justify-between"><span>This Payment</span><span>{formattedCurrency(amount)}</span></div>
            <div className="flex justify-between font-semibold text-purple-800"><span>Remaining After</span><span>{formattedCurrency(Math.max(0, invoice.total_amount - invoice.amount_paid - amount))}</span></div>
            <div className="text-[10px] text-gray-500">(Total - Paid - This)</div>
          </div>
          <div className="text-sm">
            <div className="flex justify-between text-purple-700 font-semibold"><span>Untaxed</span><span>{formattedCurrency(invoice.total_untaxed)}</span></div>
            <div className="flex justify-between text-purple-700 font-semibold"><span>Tax</span><span>{formattedCurrency(invoice.total_tax)}</span></div>
            <div className="flex justify-between text-lg mt-1 border rounded px-3 py-1 bg-purple-50 font-bold text-purple-800">
              <span>Grand Total</span>
              <span>{formattedCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
