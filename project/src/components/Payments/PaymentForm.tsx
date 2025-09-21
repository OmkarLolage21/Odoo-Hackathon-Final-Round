import React, { useState } from 'react';
import { PaymentCreateInput } from '../../types';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';

interface Props {
  mode: 'vendor' | 'customer';
  sourceId: string; // vendor bill id or customer invoice id
  defaultName?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  role: string; // user role header
  createPayment: (payload: PaymentCreateInput, role: string) => Promise<any>;
}

const PaymentForm: React.FC<Props> = ({ mode, sourceId, defaultName, onSuccess, onCancel, role, createPayment }) => {
  const [partnerName, setPartnerName] = useState<string | ''>(defaultName || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createPayment({
        partnerType: mode,
        partnerName: partnerName || undefined,
        paymentMethod,
        amount: Number(amount),
        vendorBillId: mode === 'vendor' ? sourceId : undefined,
        customerInvoiceId: mode === 'customer' ? sourceId : undefined,
      }, role);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Record Payment ({mode === 'vendor' ? 'Vendor Bill' : 'Customer Invoice'})</h3>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Input label="Partner Name" value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Optional override" />
      <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'cash' | 'bank')}>
        <option value="cash">Cash</option>
        <option value="bank">Bank</option>
      </Select>
      <Input label="Amount" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} min={0} step={0.01} required />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" disabled={loading || amount <= 0}>{loading ? 'Saving...' : 'Record Payment'}</Button>
      </div>
    </form>
  );
};

export default PaymentForm;
