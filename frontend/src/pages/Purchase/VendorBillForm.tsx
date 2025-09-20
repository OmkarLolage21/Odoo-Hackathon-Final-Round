import React from 'react';
import Card from '../../components/UI/Card';
import ActionBar from '../../components/UI/ActionBar';
import { useNavigate, useParams } from 'react-router-dom';

export default function VendorBillForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{isEdit ? 'Edit' : 'New'} Vendor Bill</h1>
  <ActionBar onNew={()=>navigate('/vendor-bills/new')} onConfirm={()=>navigate('/vendor-bills')} onBack={()=>navigate('/vendor-bills')} onArchiveChange={()=>{}} />
      <Card>
        <p className="text-sm text-gray-600">Placeholder Vendor Bill form (PO import, line items, taxes, totals) – implement later.</p>
      </Card>
    </div>
  );
}
