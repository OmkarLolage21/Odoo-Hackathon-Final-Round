import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

export default function Payments() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments (Placeholder)</h1>
      <Card>
        <p className="text-sm text-gray-600 mb-4">This section will list outgoing and incoming payments with filters and reconciliation tools.</p>
        <Button variant="secondary" size="sm">Create Payment</Button>
      </Card>
    </div>
  );
}
