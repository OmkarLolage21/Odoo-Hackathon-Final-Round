import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePurchase } from '../../contexts/PurchaseContext';
import productService from '../../services/productService';
import accountService from '../../services/accountService';

interface Props {
  lines: import('../../contexts/PurchaseContext').PurchaseLine[];
  onChange(lines: import('../../contexts/PurchaseContext').PurchaseLine[]): void;
  readOnly?: boolean;
}

// Utility dotted cell style
const cell = 'py-2 px-2 align-top border-r border-dotted border-gray-300 text-xs';
const headerCell = 'py-2 px-2 border-r border-dotted border-gray-300 text-[11px] text-purple-800 font-semibold';

export default function BillLineItemsTable({ lines, onChange, readOnly }: Props) {
  const { computeLineAmounts, formatCurrency } = usePurchase();
  const [productOptions, setProductOptions] = useState<{ value: string; label: string; hsn?: string; tax?: number }[]>([]);
  const [accountOptions, setAccountOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    // Load products and accounts once for dropdowns
    (async () => {
      try {
        const role = localStorage.getItem('user_role') || undefined;
        const products = await productService.list(role);
        setProductOptions(products.map((p: any) => ({ value: p.name, label: p.name, hsn: p.hsnCode, tax: p.purchaseTaxPercent })));
        const accounts = await accountService.list(role);
        setAccountOptions(accounts.map((a: any) => ({ value: a.name, label: a.name })));
      } catch { /* ignore for now */ }
    })();
  }, []);

  const updateLine = (id: string, patch: Partial<import('../../contexts/PurchaseContext').PurchaseLine>) => {
    onChange(lines.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  const addLine = () => onChange([...lines, { id: uuidv4(), product: '', quantity: 1, unitPrice: 0, taxPercent: 0, hsn: '', accountName: '' }]);
  const removeLine = (id: string) => onChange(lines.filter(l => l.id !== id));

  const totals = lines.reduce((acc, l) => {
    const a = computeLineAmounts(l); acc.untaxed += a.untaxed; acc.tax += a.tax; acc.total += a.total; return acc;
  }, { untaxed: 0, tax: 0, total: 0 });

  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-full border-t border-b border-gray-300">
        <thead>
          <tr className="border-b border-gray-300">
            <th className={headerCell}>Sr. No.</th>
            <th className={headerCell}>Product<br/><span className="text-[10px] font-normal text-gray-500">(From Product Master - Many to one)</span></th>
            <th className={headerCell}>HSN No.<br/><span className="text-[10px] font-normal text-gray-500">Auto Fill from Product</span></th>
            <th className={headerCell}>Account Name<br/><span className="text-[10px] font-normal text-gray-500">( Static From COA Master )</span></th>
            <th className={headerCell}>1<br/>Qty<br/><span className="text-[10px] font-normal text-gray-500">Number</span></th>
            <th className={headerCell}>2<br/>Unit Price<br/><span className="text-[10px] font-normal text-gray-500">Monetery</span></th>
            <th className={headerCell}>3<br/>Untaxed Amount<br/><span className="text-[10px] font-normal text-blue-600">( 3 = 1 x 2 )</span></th>
            <th className={headerCell}>4<br/>Tax %</th>
            <th className={headerCell}>5<br/>Tax Amount<br/><span className="text-[10px] font-normal text-blue-600">( 5 = 3 x 4 )</span></th>
            <th className={headerCell}>6<br/>Total<br/><span className="text-[10px] font-normal text-blue-600">( 6 = 3 + 5 )</span></th>
            {!readOnly && <th className={headerCell}></th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => {
            const a = computeLineAmounts(l);
            return (
              <tr key={l.id} className="border-b border-dotted border-gray-300 last:border-0">
                <td className={cell}>{i+1}</td>
                <td className={cell}>
                  {readOnly ? (
                    <div className="text-xs">{l.product}</div>
                  ) : (
                    <select
                      className="w-full bg-transparent border-b border-purple-300 focus:outline-none text-xs"
                      value={l.product}
                      onChange={(e) => {
                        const val = e.target.value;
                        const prod = productOptions.find(p => p.value === val);
                        updateLine(l.id, {
                          product: val,
                          hsn: prod?.hsn || '',
                          taxPercent: prod?.tax ?? l.taxPercent,
                        });
                      }}
                    >
                      <option value="">Select product</option>
                      {productOptions.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className={cell}>
                  <input className="w-full bg-transparent border-b border-purple-300 focus:outline-none text-xs" disabled value={l.hsn||''} placeholder="HSN" />
                </td>
                <td className={cell}>
                  {readOnly ? (
                    <div className="text-xs">{l.accountName || ''}</div>
                  ) : (
                    <select
                      className="w-full bg-transparent border-b border-purple-300 focus:outline-none text-xs"
                      value={l.accountName || ''}
                      onChange={(e)=>updateLine(l.id,{accountName:e.target.value})}
                    >
                      <option value="">Select account</option>
                      {accountOptions.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className={cell}>
                  <input type="number" className="w-16 bg-transparent border-b border-purple-300 focus:outline-none text-right" disabled={readOnly} value={l.quantity} onChange={e=>updateLine(l.id,{quantity:Number(e.target.value)})} />
                </td>
                <td className={cell}>
                  <input type="number" className="w-20 bg-transparent border-b border-purple-300 focus:outline-none text-right" disabled={readOnly} value={l.unitPrice} onChange={e=>updateLine(l.id,{unitPrice:Number(e.target.value)})} />
                </td>
                <td className={cell + ' text-right'}>
                  <div>{formatCurrency(a.untaxed)}</div>
                  <div className="text-[10px] text-blue-600">({l.quantity} x {l.unitPrice})</div>
                </td>
                <td className={cell}>
                  <input type="number" className="w-14 bg-transparent border-b border-purple-300 focus:outline-none text-right" disabled={readOnly} value={l.taxPercent} onChange={e=>updateLine(l.id,{taxPercent:Number(e.target.value)})} />
                </td>
                <td className={cell + ' text-right'}>
                  <div>{formatCurrency(a.tax)}</div>
                  <div className="text-[10px] text-blue-600">({formatCurrency(a.untaxed)} x {l.taxPercent}%)</div>
                </td>
                <td className={cell + ' text-right'}>
                  <div>{formatCurrency(a.total)}</div>
                  <div className="text-[10px] text-blue-600">({formatCurrency(a.untaxed)} + {formatCurrency(a.tax)})</div>
                </td>
                {!readOnly && (
                  <td className={cell + ' text-center'}>
                    <button type="button" onClick={()=>removeLine(l.id)} className="text-red-500 text-[11px]">Del</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className={cell + ' font-semibold text-purple-700'} colSpan={6}>Total</td>
            <td className={cell + ' text-right font-semibold text-purple-700'}>{formatCurrency(totals.untaxed)}</td>
            <td className={cell}></td>
            <td className={cell + ' text-right font-semibold text-purple-700'}>{formatCurrency(totals.tax)}</td>
            <td className={cell + ' text-right font-bold text-purple-800 bg-purple-50'}>{formatCurrency(totals.total)}</td>
            {!readOnly && <td className={cell}></td>}
          </tr>
        </tfoot>
      </table>
      {!readOnly && (
        <div className="mt-4">
          <button type="button" onClick={addLine} className="text-xs px-3 py-1 rounded border border-purple-300 text-purple-700 hover:bg-purple-50">Add Line</button>
        </div>
      )}
    </div>
  );
}
