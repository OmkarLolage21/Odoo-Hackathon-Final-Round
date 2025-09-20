import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import ActionBar from '../../components/UI/ActionBar';
import { useNavigate } from 'react-router-dom';

export default function ReceiptForm() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
  <ActionBar onBack={() => navigate(-1)} onConfirm={() => {/* placeholder */}} onArchiveChange={()=>{}} />
      <Card>
        <h1 className="text-xl font-semibold mb-6">Register Customer Payment</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <Input placeholder="Select customer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <Input type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <Input type="number" placeholder="0.00" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
            <Input placeholder="Bank" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Memo</label>
            <Input placeholder="Invoice / Reference" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button>Validate</Button>
        </div>
      </Card>
    </div>
  );
}
