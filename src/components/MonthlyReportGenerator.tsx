import React, { useRef, useState } from 'react';
import { Transaction, SavingsGoal } from '../types';
import { Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MonthlyReportGeneratorProps {
  transactions: Transaction[];
  budgets: Record<string, number>;
  savingsGoals: SavingsGoal[];
}

export function MonthlyReportGenerator({ transactions, budgets, savingsGoals }: MonthlyReportGeneratorProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const thisMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = thisMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = thisMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = income - expenses;

  // Category breakdown
  const expensesByCategory = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      // Temporarily make it visible for html2canvas to work properly if it's display: none
      const element = reportRef.current;
      element.style.display = 'block';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      element.style.display = 'none';

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const doc = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`Financial_Report_${monthName.replace(' ', '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-md transition-colors border border-slate-700 disabled:opacity-50 w-full sm:w-auto"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download Monthly Report
          </>
        )}
      </button>

      {/* Hidden Report Template */}
      <div style={{ display: 'none' }}>
        <div 
          ref={reportRef} 
          className="bg-white text-slate-900 p-10 font-sans"
          style={{ width: '800px', minHeight: '1122px' }} // Approx A4 ratio
        >
          {/* Header */}
          <div className="flex justify-between items-end border-b-2 border-slate-200 pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-sm"></div>
                Nasir.Finance
              </h1>
              <p className="text-slate-500 mt-1 uppercase tracking-widest text-sm font-semibold">Monthly Financial Report</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800">{monthName}</p>
              <p className="text-slate-500 text-sm">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Overview Section */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">1. Executive Summary</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600">RM {income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-rose-600">RM {expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Net Savings</p>
                <p className={`text-2xl font-bold ${netSavings >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  {netSavings >= 0 ? '+' : ''}RM {netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">2. Expense Breakdown vs Budget</h2>
            {Object.keys(expensesByCategory).length > 0 ? (
              <table className="w-full text-sm mt-4 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="py-3 px-4 text-left font-bold border-b border-slate-200">Category</th>
                    <th className="py-3 px-4 text-right font-bold border-b border-slate-200">Budget (RM)</th>
                    <th className="py-3 px-4 text-right font-bold border-b border-slate-200">Spent (RM)</th>
                    <th className="py-3 px-4 text-right font-bold border-b border-slate-200">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(expensesByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, spent]) => {
                      const budget = budgets[category] || 0;
                      const hasBudget = budget > 0;
                      const variance = budget - spent;
                      const isOver = spent > budget && hasBudget;

                      return (
                        <tr key={category} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 px-4 text-slate-800 font-medium">{category}</td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            {hasBudget ? budget.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-800 font-medium">
                            {spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${isOver ? 'text-rose-600' : (hasBudget ? 'text-emerald-600' : 'text-slate-400')}`}>
                            {hasBudget ? (
                              variance >= 0 ? `+${variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : variance.toLocaleString(undefined, { minimumFractionDigits: 2 })
                            ) : '-'}
                          </td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic py-4">No expenses recorded for this month.</p>
            )}
          </div>

          {/* Savings Progress */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">3. Savings Goals Progress</h2>
            {savingsGoals.length > 0 ? (
              <div className="space-y-6 mt-4">
                {savingsGoals.map(sg => {
                  const pct = Math.min((sg.currentAmount / sg.targetAmount) * 100, 100);
                  return (
                    <div key={sg.id} className="whitespace-normal">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-slate-800">{sg.name}</span>
                        <span className="text-slate-600 font-medium">
                          RM {sg.currentAmount.toLocaleString()} / RM {sg.targetAmount.toLocaleString()} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%`, backgroundColor: sg.color || '#3b82f6' }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 italic py-4">No savings goals set.</p>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
            <p>This report is auto-generated by Nasir.Finance and is for personal tracking purposes only.</p>
          </div>
        </div>
      </div>
    </>
  );
}
