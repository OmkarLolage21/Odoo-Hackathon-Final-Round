import React from 'react';
import Button from '../UI/Button';
import { v4 as uuidv4 } from 'uuid';
import { usePurchase } from '../../contexts/PurchaseContext';

interface Props {
  lines: import('../../contexts/PurchaseContext').PurchaseLine[];
  onChange(lines: import('../../contexts/PurchaseContext').PurchaseLine[]): void;
  readOnly?: boolean;
}

export default function LineItemsTable({ lines, onChange, readOnly }: Props) {
  const { computeLineAmounts, formatCurrency } = usePurchase();

  const updateLine = (id: string, patch: Partial<import('../../contexts/PurchaseContext').PurchaseLine>) => {
    onChange(lines.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const removeLine = (id: string) => {
    onChange(lines.filter(l => l.id !== id));
  };

  const addLine = () => {
    onChange([...lines, { id: uuidv4(), product: '', quantity: 1, unitPrice: 0, taxPercent: 18 }]);
  };

  const totals = lines.reduce((acc, l) => {
    const a = computeLineAmounts(l);
    acc.untaxed += a.untaxed; acc.tax += a.tax; acc.total += a.total; return acc;
  }, { untaxed: 0, tax: 0, total: 0 });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left w-8">#</th>
            <th className="py-2 text-left">Product</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Untaxed</th>
            <th className="py-2 text-right">Tax %</th>
            <th className="py-2 text-right">Tax Amt</th>
            <th className="py-2 text-right">Total</th>
            {!readOnly && <th className="py-2" />}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => {
            const a = computeLineAmounts(line);
            return (
              <tr key={line.id} className="border-b last:border-none">
                <td className="py-2 pr-2 text-xs text-gray-500">{idx + 1}</td>
                <td className="py-2 pr-2">
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={line.product}
                    disabled={readOnly}
                    onChange={e => updateLine(line.id, { product: e.target.value })}
                    placeholder="Product name"
                  />
                </td>
                <td className="py-2 text-right">
                  <input type="number" className="w-20 border rounded px-2 py-1 text-right" value={line.quantity}
                    disabled={readOnly}
                    onChange={e => updateLine(line.id, { quantity: Number(e.target.value) })} />
                </td>
                <td className="py-2 text-right">
                  <input type="number" className="w-24 border rounded px-2 py-1 text-right" value={line.unitPrice}
                    disabled={readOnly}
                    onChange={e => updateLine(line.id, { unitPrice: Number(e.target.value) })} />
                </td>
                <td className="py-2 text-right font-medium">{formatCurrency(a.untaxed)}</td>
                <td className="py-2 text-right">
                  <input type="number" className="w-16 border rounded px-2 py-1 text-right" value={line.taxPercent}
                    disabled={readOnly}
                    onChange={e => updateLine(line.id, { taxPercent: Number(e.target.value) })} />
                </td>
                <td className="py-2 text-right">{formatCurrency(a.tax)}</td>
                <td className="py-2 text-right font-semibold">{formatCurrency(a.total)}</td>
                {!readOnly && (
                  <td className="py-2 text-center">
                    <button type="button" onClick={() => removeLine(line.id)} className="text-red-500 hover:text-red-600 text-xs font-medium">Del</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} />
            <td className="py-2 text-right font-semibold">{formatCurrency(totals.untaxed)}</td>
            <td />
            <td className="py-2 text-right font-semibold">{formatCurrency(totals.tax)}</td>
            <td className="py-2 text-right font-bold">{formatCurrency(totals.total)}</td>
            {!readOnly && <td />}
          </tr>
        </tfoot>
      </table>
      {!readOnly && (
        <div className="mt-4">
          <Button size="sm" variant="secondary" type="button" onClick={addLine}>Add Line</Button>
        </div>
      )}
    </div>
  );
}
