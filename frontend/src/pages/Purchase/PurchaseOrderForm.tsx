import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import { useNavigate, useParams } from 'react-router-dom';
import { usePurchase } from '../../contexts/PurchaseContext';
import PoLineItemsTable from '../../components/Purchase/PoLineItemsTable';
import Button from '../../components/UI/Button';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { purchaseOrders, createPurchaseOrder, setPurchaseOrderLines, confirmPurchaseOrder, cancelPurchaseOrder, createBillFromPO } = usePurchase();
  const [poId, setPoId] = useState<string | null>(null);

  // Initialize new PO if creating
  useEffect(() => {
    if (!id && !poId) {
      const po = createPurchaseOrder();
      setPoId(po.id);
    } else if (id) {
      setPoId(id);
    }
  }, [id, poId, createPurchaseOrder]);

  const po = useMemo(() => purchaseOrders.find(p => p.id === poId) || null, [purchaseOrders, poId]);


  const onConfirm = () => {
    if (!po) return;
    confirmPurchaseOrder(po.id);
  };

  const cancelPO = () => { if (po && po.status === 'draft') cancelPurchaseOrder(po.id); };

  const createBill = () => {
    if (!po) return;
    const bill = createBillFromPO(po.id);
    if (bill) navigate(`/vendor-bills/${bill.id}/edit`);
  };

  if (!po) {
    return <div className="p-4 text-sm text-gray-600">Loading Purchase Order...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => navigate('/purchase-orders/new')}>New</Button>
          <Button size="sm" variant="primary" disabled={po.status !== 'draft'} onClick={onConfirm}>Confirm</Button>
          <Button size="sm" variant="secondary" disabled>Print</Button>
            <Button size="sm" variant="secondary" disabled>Send</Button>
          <Button size="sm" variant="secondary" disabled={po.status !== 'draft'} onClick={cancelPO}>Cancel</Button>
          <Button size="sm" variant="primary" disabled={po.status !== 'confirmed'} onClick={createBill}>Create Bill</Button>
          <div className="ml-auto flex gap-2 text-xs">
            <span className={`px-2 py-1 rounded border ${po.status==='draft'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Draft</span>
            <span className={`px-2 py-1 rounded border ${po.status==='confirmed'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Confirm</span>
            <span className={`px-2 py-1 rounded border ${po.status==='cancelled'?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-200 text-gray-400'}`}>Cancelled</span>
          </div>
          <div className="ml-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/purchase-orders')}>Back</Button>
          </div>
        </div>
        {/* Header fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">PO No.</label>
            <div className="text-sm font-medium">{po.number}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">auto generate PO Number + 1 of last order</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">PO Date</label>
            <div className="text-sm font-medium">{po.date}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Date</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Vendor Name</label>
            <div className="text-sm font-medium">{po.vendor}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">From Contact Master - Many to one</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">Reference</label>
            <div className="text-sm font-medium">{po.reference || '-'}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Alpha numeric ( auto )</div>
          </div>
        </div>
        <div className="relative">
          <PoLineItemsTable
            lines={po.lines}
            onChange={(ls) => setPurchaseOrderLines(po.id, ls)}
            readOnly={po.status !== 'draft'}
          />
        </div>
      </Card>
    </div>
  );
}
