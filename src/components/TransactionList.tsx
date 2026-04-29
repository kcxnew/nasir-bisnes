import { Transaction } from "@/src/types";
import { formatCurrency } from "@/src/lib/utils";
import { format } from "date-fns";
import { Trash2, ChevronUp, ChevronDown, ArrowUpDown, Edit2 } from "lucide-react";
import { Button } from "./ui/Button";
import { useState } from "react";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

type SortField = 'date' | 'amount' | 'category' | 'description';
type SortDirection = 'asc' | 'desc';

export function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
        <p className="text-slate-400 font-medium">No transactions found.</p>
        <p className="text-sm text-slate-500 mt-1">Add your first income or expense safely.</p>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // default to descending when changing fields
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        // If dates are identical, fallback to createdAt for stable sorting
        if (a.date === b.date) {
            comparison = a.createdAt - b.createdAt;
        } else {
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        break;
      case 'amount':
        // For amounts, we might want to compare actual cashflow impact or absolute values. 
        // We'll use actual values here (income is positive, expense is negative or we can just sort by raw amount)
        // Let's sort by raw amount for simplicity, or apply negative for expense.
        // Actually, amount in our data is always positive, and type defines it.
        // Let's sort by absolute amount.
        comparison = a.amount - b.amount;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'description':
        comparison = (a.note || '').localeCompare(b.note || '');
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300 inline" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-3 h-3 ml-1 text-blue-600 inline" /> : 
      <ChevronDown className="w-3 h-3 ml-1 text-blue-600 inline" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-950 border-b border-slate-800 hidden sm:table-header-group">
          <tr>
            <th 
              className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell cursor-pointer hover:bg-slate-800 transition-colors"
               onClick={() => handleSort('description')}
            >
              Description <SortIcon field="description" />
            </th>
            <th 
              className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-colors"
               onClick={() => handleSort('category')}
            >
              Category <SortIcon field="category" />
            </th>
            <th 
              className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-colors"
              onClick={() => handleSort('date')}
            >
              Date <SortIcon field="date" />
            </th>
            <th 
              className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-800 transition-colors"
               onClick={() => handleSort('amount')}
            >
              <div className="flex items-center justify-end">
                Amount <SortIcon field="amount" />
              </div>
            </th>
            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-12"></th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sortedTransactions.map((t) => (
            <tr key={t.id} className="border-b border-slate-800/50 group hover:bg-slate-800/50 transition-colors flex flex-col sm:table-row">
              <td className="p-4 sm:font-medium text-slate-200 hidden sm:table-cell align-middle">
                {t.note || 'No description'}
              </td>
              <td className="p-4 align-middle flex justify-between sm:table-cell">
                <span className="sm:hidden text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-4">Category:</span>
                <div className="flex gap-2 items-center">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-sm uppercase tracking-widest ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {t.type}
                  </span>
                  <span className="text-sm text-slate-400">{t.category}</span>
                </div>
              </td>
              <td className="p-4 text-slate-400 align-middle hidden sm:table-cell">
                {format(new Date(t.date), 'dd MMM yyyy')}
              </td>
              <td className={`p-4 text-right font-bold text-base align-middle flex justify-between sm:table-cell ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                <span className="sm:hidden text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-4">Amount:</span>
                <div>
                  {t.type === 'income' ? '+ ' : '- '}
                  {formatCurrency(t.amount)}
                </div>
              </td>
              <td className="p-4 align-middle text-right hidden sm:table-cell">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit(t)}
                    className="text-slate-500 hover:text-blue-400 h-8 w-8"
                    title="Edit transaction"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(t.id)}
                    className="text-slate-500 hover:text-orange-400 h-8 w-8"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
              {/* Mobile delete button row */}
              <td className="sm:hidden px-4 pb-4 flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(t)}
                  className="text-slate-400 hover:text-blue-400 h-8 uppercase tracking-widest text-[10px]"
                >
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(t.id)}
                  className="text-slate-400 hover:text-orange-400 h-8 uppercase tracking-widest text-[10px]"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
