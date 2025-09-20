import React from 'react';
import Card from '../../components/UI/Card';
import ActionBar from '../../components/UI/ActionBar';
import { useNavigate, useParams } from 'react-router-dom';

export default function SalesOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{isEdit ? 'Edit' : 'New'} Sales Order</h1>
  <ActionBar onNew={()=>navigate('/sales-orders/new')} onConfirm={()=>navigate('/sales-orders')} onBack={()=>navigate('/sales-orders')} onArchiveChange={()=>{}} />
      <Card>
  <p className="text-sm text-gray-600">Placeholder Sales Order form (customer, lines, taxes, totals, confirm &rarr; invoice). Implement later.</p>
      </Card>
    </div>
  );
}
