import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import { useNavigate, useParams } from 'react-router-dom';
import { usePurchase } from '../../contexts/PurchaseContext';
import BillLineItemsTable from '../../components/Purchase/BillLineItemsTable';
import Button from '../../components/UI/Button';
import { createVendorBill as apiCreateBill, getVendorBill } from '../../services/vendorBillService';

export default function VendorBillForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { vendorBills, createVendorBill, postVendorBill, setVendorBillLines, computeTotals, formatCurrency, updateVendorBill, importVendorBill } = usePurchase();
  const [billId, setBillId] = useState<string | null>(null);
  // removed inline partial payment; dedicated payment page instead

  useEffect(() => {
    const role = localStorage.getItem('user_role') || undefined;
    if (!id && !billId) {
      const bill = createVendorBill({ vendor: 'Azure Interior' });
      setBillId(bill.id);
      return;
    }
    if (id) {
      setBillId(id);
      // if bill not in context, fetch from backend
      const existing = vendorBills.find(b => b.id === id);
      if (!existing) {
        getVendorBill(id, role).then((res: any) => {
          const mapped = {
            id: res.id,
            number: res.bill_number,
            vendor: res.vendor_name || '',
            date: res.bill_date || new Date().toISOString().slice(0,10),
            dueDate: res.due_date || undefined,
            reference: res.bill_reference || '',
            poId: res.purchase_order_id || undefined,
            status: res.status === 'confirmed' ? 'posted' : (res.status as any),
            lines: (res.lines || []).map((l: any) => ({
              id: l.id,
              product: l.product_name,
              quantity: l.quantity,
              unitPrice: l.unit_price,
              taxPercent: l.tax_percent,
              hsn: l.hsn_code,
              accountName: l.account_name,
            })),
            paidAmount: (Number(res.paid_cash || 0) + Number(res.paid_bank || 0))
          } as any;
          importVendorBill(mapped);
        }).catch(()=>{});
      }
    }
  }, [id, billId, createVendorBill, vendorBills, importVendorBill]);

  const bill = useMemo(() => vendorBills.find(b => b.id === billId) || null, [vendorBills, billId]);
  const totals = bill ? computeTotals(bill.lines) : { untaxed: 0, tax: 0, total: 0 };
  const remaining = bill ? totals.total - bill.paidAmount : 0;

  const onConfirm = async () => {
    if (!bill || bill.status !== 'draft') return;
    const payload = {
      vendor_name: bill.vendor,
      bill_reference: bill.reference,
      purchase_order_id: bill.poId || undefined,
      lines: bill.lines.map(l => ({
        product_name: l.product,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        account_name: l.accountName || undefined,
      })),
    };
    try {
      const res: any = await apiCreateBill(payload, localStorage.getItem('user_role') || undefined);
      const mappedLines = (res.lines || []).map((r: any, idx: number) => ({
        id: bill.lines[idx]?.id || String(idx),
        product: r.product_name,
        quantity: r.quantity,
        unitPrice: r.unit_price,
        taxPercent: r.tax_percent,
        hsn: r.hsn_code,
        accountName: r.account_name,
      }));
      setVendorBillLines(bill.id, mappedLines);
      postVendorBill(bill.id);
    } catch (e) {
      console.error(e);
    }
  };
  const goPay = () => {
    if (!bill) return; navigate(`/vendor-bills/${bill.id}/pay`);
  };

  if (!bill) return <div className="p-4 text-sm text-gray-600">Loading Vendor Bill...</div>;

  return (
    <div className="space-y-6">
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => navigate('/vendor-bills/new')}>New</Button>
          <Button size="sm" variant="primary" disabled={bill.status !== 'draft'} onClick={onConfirm}>Confirm</Button>
          <Button size="sm" variant="secondary" disabled>Print</Button>
          <Button size="sm" variant="secondary" disabled>Send</Button>
          <Button size="sm" variant="secondary" disabled={bill.status !== 'draft'}>Cancel</Button>
          {bill.status === 'posted' && remaining > 0 && (
            <Button size="sm" variant="primary" onClick={goPay}>Pay</Button>
          )}
          <div className="ml-auto flex gap-2 text-xs">
            <span className={`px-2 py-1 rounded border ${bill.status==='draft'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Draft</span>
            <span className={`px-2 py-1 rounded border ${bill.status==='posted'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Confirm</span>
            <span className={`px-2 py-1 rounded border ${bill.status==='cancelled'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Cancelled</span>
          </div>
          <div className="ml-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/vendor-bills')}>Back</Button>
          </div>
        </div>
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Vendor Bill No.</label>
            <div className="text-sm font-medium">{bill.number}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">auto generate Bill Number + 1 of last Bill</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Bill Date</label>
            <div className="text-sm font-medium">{bill.date}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Date</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Vendor Name</label>
            <input aria-label="Vendor Name" className="text-sm font-medium w-full bg-transparent border-b border-purple-300 focus:outline-none" value={bill.vendor} onChange={e=>updateVendorBill(bill.id,{ vendor: e.target.value } as any)} />
            <div className="text-[10px] text-gray-500 mt-0.5">From Contact Master - Many to one</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Bill Reference</label>
            <div className="text-sm font-medium">{bill.reference}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Alpha numeric ( text )</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Due Date</label>
            <div className="text-sm font-medium">{bill.dueDate}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Date</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">PO Ref</label>
            <div className="text-sm font-medium">{bill.poId || '-'}</div>
          </div>
        </div>
        {/* Lines */}
        <BillLineItemsTable lines={bill.lines} onChange={(ls)=>setVendorBillLines(bill.id, ls)} readOnly={bill.status !== 'draft'} />
        {/* Totals & Payment summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div />
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Paid Via Cash</span><span>{bill.paidAmount ? formatCurrency(bill.paidAmount) : '0'}</span></div>
            <div className="flex justify-between"><span>Paid Via Bank</span><span>0</span></div>
            <div className="flex justify-between text-purple-800 font-semibold"><span>Amount Due</span><span>{remaining <= 0 ? '0' : formatCurrency(remaining)}</span></div>
            <div className="text-[10px] text-gray-500">(Total - Payment)</div>
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
