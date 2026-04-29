import { Transaction } from "@/src/types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { format, parseISO, subDays } from "date-fns";

interface DashboardChartsProps {
  transactions: Transaction[];
}

export function DashboardCharts({ transactions }: DashboardChartsProps) {
  // Process data for the last 7 days bar chart
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    return format(d, 'yyyy-MM-dd');
  });

  const barData = last7Days.map(date => {
    const dailyTxs = transactions.filter(t => t.date === date);
    const inc = dailyTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = dailyTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      name: format(parseISO(date), 'EEE'),
      fullDate: format(parseISO(date), 'dd MMM yyyy'),
      Income: inc,
      Expense: exp
    };
  });

  // Process data for Expense Categories Pie Chart
  const expTxs = transactions.filter(t => t.type === 'expense');
  const totalExpense = expTxs.reduce((sum, t) => sum + t.amount, 0);
  const catMap = expTxs.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  const COLORS = ['#f97316', '#eab308', '#3b82f6', '#10b981', '#6366f1', '#8b5cf6'];

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Always show both Income and Expense, using data object directly to guarantee both are shown
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-lg min-w-[150px]">
          <p className="font-bold text-white text-sm mb-3">{data.fullDate}</p>
          
          <div className="flex items-center justify-between gap-4 text-xs font-medium mb-2">
            <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Income
            </div>
            <span className="font-bold text-white border-l border-slate-700 pl-3">
              {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(data.Income)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Expense
            </div>
            <span className="font-bold text-white border-l border-slate-700 pl-3">
              {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(data.Expense)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const data = item.payload;
      const percentage = totalExpense > 0 ? ((data.value / totalExpense) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-lg min-w-[160px]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.fill || '#64748b' }}></span>
            <p className="font-bold text-slate-300 text-[10px] uppercase tracking-widest">{data.name}</p>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs font-medium mb-2">
            <span className="text-slate-400 uppercase tracking-wider font-bold">Amount</span>
            <span className="font-bold text-white border-l border-slate-700 pl-3">
              {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(data.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs font-medium">
            <span className="text-slate-400 uppercase tracking-wider font-bold">Share</span>
            <span className="font-bold text-slate-300 border-l border-slate-700 pl-3">
              {percentage}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-sm font-bold text-white">Flow Visualization</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Income</div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-slate-500"></span> Expense</div>
          </div>
        </div>
        <div className="h-[250px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }} dy={10} />
              <Tooltip 
                content={<CustomBarTooltip />}
                cursor={{ fill: '#1e293b' }}
              />
              <Bar dataKey="Income" fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Expense" fill="#475569" radius={[2, 2, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
        <h4 className="text-sm font-bold text-white mb-6">Top Expenses</h4>
        {pieData.length > 0 ? (
           <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomPieTooltip />}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
            Not enough data to generate chart.
          </div>
        )}
      </div>
    </div>
  );
}
