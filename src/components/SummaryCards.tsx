import { formatCurrency } from "@/src/lib/utils";
import { Card, CardContent } from "./ui/Card";
import { ArrowDownIcon, ArrowUpIcon, Wallet } from "lucide-react";

interface SummaryProps {
  income: number;
  expense: number;
  balance: number;
}

export function SummaryCards({ income, expense, balance }: SummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="p-6">
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Total Balance</p>
        <h3 className="text-2xl font-bold tracking-tight text-white">{formatCurrency(balance)}</h3>
      </Card>

      <Card className="p-6">
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Total Income</p>
        <h3 className="text-2xl font-bold tracking-tight text-white">{formatCurrency(income)}</h3>
        <div className="w-full bg-slate-800 h-1 mt-4 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-[80%]"></div>
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Total Expense</p>
        <h3 className="text-2xl font-bold tracking-tight text-white">{formatCurrency(expense)}</h3>
        <div className="w-full bg-slate-800 h-1 mt-4 rounded-full overflow-hidden">
          <div className="bg-orange-500 h-full w-[45%]"></div>
        </div>
      </Card>
    </div>
  );
}
