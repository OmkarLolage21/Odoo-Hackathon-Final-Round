import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePurchase } from '../../contexts/PurchaseContext';

// BillPaymentForm supports two entry modes:
// 1. /vendor-bills/:id/pay -> creates (if needed) a draft payment for remaining amount
// 2. /payments/:paymentId (future) -> loads existing payment (not yet routed)
export default function BillPaymentForm() {
  const navigate = useNavigate();
  const { id: billIdParam, paymentId: paymentIdParam } = useParams(); // either billId (vendor-bills/:id/pay) or paymentId (payments/:paymentId)
  const [search] = useSearchParams();
  const paymentIdQuery = search.get('payment');

  const { vendorBills, billPayments, createPaymentFromBill, updateBillPayment, postBillPayment, cancelBillPayment, computeTotals, formatCurrency } = usePurchase();
  const [paymentId, setPaymentId] = useState<string | null>(paymentIdParam || paymentIdQuery);

  // create payment if coming from bill route without explicit payment id
  useEffect(() => {
    if (!paymentId && billIdParam) {
      const bill = vendorBills.find(b => b.id === billIdParam);
      if (bill) {
        // attempt to find existing draft for this bill
        const existing = billPayments.find(p => p.billId === bill.id && p.status === 'draft');
        if (existing) {
          setPaymentId(existing.id);
        } else {
          const created = createPaymentFromBill(bill.id, 'bank');
            if (created) setPaymentId(created.id);
        }
      }
    }
  }, [paymentId, billIdParam, vendorBills, billPayments, createPaymentFromBill]);

  const payment = useMemo(() => billPayments.find(p => p.id === paymentId) || null, [billPayments, paymentId]);
  const bill = useMemo(() => payment ? vendorBills.find(b => b.id === payment.billId) || null : null, [payment, vendorBills]);
  const totals = bill ? computeTotals(bill.lines) : { untaxed: 0, tax: 0, total: 0 };
  const remainingBefore = bill ? totals.total - bill.paidAmount : 0;
  const remainingAfter = payment && bill ? Math.max(0, remainingBefore - payment.amount) : remainingBefore;

  const disabled = !payment || payment.status !== 'draft';

  const onChangeAmount = (v: string) => {
    if (!payment) return;
    const num = Number(v);
    if (isNaN(num) || num < 0) return;
    updateBillPayment(payment.id, { amount: num });
  };

  const onConfirm = () => {
    if (payment && payment.status === 'draft') {
      postBillPayment(payment.id);
      // redirect back to bill after posting
      navigate(`/vendor-bills/${payment.billId}/edit`);
    }
  };

  const onCancel = () => { payment && payment.status === 'draft' && cancelBillPayment(payment.id); };

  if (!bill || !payment) return <div className="p-4 text-sm text-gray-600">Loading Payment...</div>;

  return (
    <div className="space-y-6">
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => bill && navigate(`/vendor-bills/${bill.id}/pay`)}>New</Button>
          <Button size="sm" variant="primary" disabled={payment.status !== 'draft'} onClick={onConfirm}>Confirm</Button>
          <Button size="sm" variant="secondary" disabled>Print</Button>
            <Button size="sm" variant="secondary" disabled>Send</Button>
          <Button size="sm" variant="secondary" disabled={payment.status !== 'draft'} onClick={onCancel}>Cancel</Button>
          <div className="ml-auto flex gap-2 text-xs">
            <span className={`px-2 py-1 rounded border ${payment.status==='draft'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Draft</span>
            <span className={`px-2 py-1 rounded border ${payment.status==='posted'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Confirm</span>
            <span className={`px-2 py-1 rounded border ${payment.status==='cancelled'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Cancelled</span>
          </div>
          <div className="ml-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button size="sm" variant="ghost" onClick={() => bill && navigate(`/vendor-bills/${bill.id}/edit`)}>Back</Button>
          </div>
        </div>
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Payment No.</label>
            <div className="text-sm font-medium">{payment.number}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">auto generate Payment Number + 1 of last Payment</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Payment Date</label>
            <div className="text-sm font-medium">{payment.date}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Date</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Payment Type</label>
            <div className="text-sm font-medium capitalize">Send</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Send / Receive</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Partner Type</label>
            <div className="text-sm font-medium capitalize">Vendor</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Vendor / Customer</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Partner Name</label>
            <div className="text-sm font-medium">{bill.vendor}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">From Contact Master - Many to one</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Amount</label>
            <input type="number" disabled={disabled} className="border rounded px-2 py-1 text-sm w-40" value={payment.amount} onChange={e => onChangeAmount(e.target.value)} aria-label="Payment Amount" title="Payment Amount" />
            <div className="text-[10px] text-gray-500 mt-0.5">Change allowed while Draft</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Payment Via</label>
            <div className="flex gap-4 text-sm mt-1">
              {['bank','cash'].map(m => (
                <label key={m} className={`flex items-center gap-1 cursor-pointer ${disabled?'opacity-60':''}`}>
                  <input type="radio" name="method" disabled={disabled} checked={payment.method===m} onChange={() => updateBillPayment(payment.id, { method: m as 'bank' | 'cash' })} />
                  <span className="capitalize">{m}</span>
                </label>
              ))}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Select Medium</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Note</label>
            <textarea rows={3} disabled={disabled} className="border rounded px-2 py-1 text-sm w-full" value={payment.note || ''} onChange={e => updateBillPayment(payment.id, { note: e.target.value })} aria-label="Payment Note" title="Payment Note" placeholder="Optional note" />
            <div className="text-[10px] text-gray-500 mt-0.5">Extra Description</div>
          </div>
        </div>
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div />
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Bill Total</span><span>{formatCurrency(totals.total)}</span></div>
            <div className="flex justify-between"><span>Already Paid</span><span>{formatCurrency(bill.paidAmount)}</span></div>
            <div className="flex justify-between"><span>This Payment</span><span>{formatCurrency(payment.amount)}</span></div>
            <div className="flex justify-between font-semibold text-purple-800"><span>Remaining After</span><span>{formatCurrency(remainingAfter)}</span></div>
            <div className="text-[10px] text-gray-500">(Total - Paid - This)</div>
          </div>
          <div className="text-sm">
            <div className="flex justify-between text-purple-700 font-semibold"><span>Total</span><span>{formatCurrency(totals.untaxed)}</span></div>
            <div className="flex justify-between text-purple-700 font-semibold"><span>Tax</span><span>{formatCurrency(totals.tax)}</span></div>
            <div className="flex justify-between text-lg mt-1 border rounded px-3 py-1 bg-purple-50 font-bold text-purple-800">
              <span>Grand Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
