import React from 'react';
import Card from '../../components/UI/Card';
import ActionBar from '../../components/UI/ActionBar';
import { useNavigate } from 'react-router-dom';

export default function BillPaymentForm() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bill Payment</h1>
  <ActionBar onNew={()=>navigate('/bill-payments/new')} onConfirm={()=>navigate('/bill-payments')} onBack={()=>navigate('/bill-payments')} onArchiveChange={()=>{}} />
      <Card>
        <p className="text-sm text-gray-600">Placeholder Bill Payment form (select vendor bill(s), payment method, amount). Add ledger updates later.</p>
      </Card>
    </div>
  );
}
