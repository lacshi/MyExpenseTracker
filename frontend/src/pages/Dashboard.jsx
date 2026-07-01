import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '../utils/format';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#06b6d4','#a855f7','#e11d48','#0ea5e9','#d946ef','#65a30d','#0891b2','#ca8a04','#4f46e5','#dc2626','#059669','#d97706'];

export default function Dashboard() {
  const { API } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dashboard, setDashboard] = useState(null);
  const [monthly, setMonthly] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, monthlyRes] = await Promise.all([
        API.get(`/summary/dashboard?year=${year}&month=${month}`),
        API.get(`/summary/monthly?year=${year}`),
      ]);
      setDashboard(dashRes.data);
      setMonthly(monthlyRes.data);
    } catch (err) {
      console.error(err);
    }
  }, [API, year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownload = async () => {
    try {
      const res = await API.get(`/export/monthly?year=${year}&month=${month}&format=csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${month}-${year}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  if (!dashboard) return <div className="text-center py-8">Loading...</div>;

  const pieData = dashboard.budgetVsActual.filter(d => d.spent > 0).map(d => ({ name: d.categoryName, value: d.spent }));
  const barData = dashboard.budgetVsActual.map(d => ({ name: d.categoryName.length > 18 ? d.categoryName.slice(0, 16) + '…' : d.categoryName, Budget: d.budget / 100, Spent: d.spent / 100 }));
  const lineData = monthly?.months.map(m => ({ month: MONTHS[m.month - 1], total: m.total / 100 })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={handleDownload} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 ml-auto">
          Download CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Budget</p>
          <p className="text-xl font-bold">{formatCurrency(dashboard.totalBudget)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Spent</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(dashboard.totalSpent)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Remaining</p>
          <p className={`text-xl font-bold ${dashboard.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(dashboard.remaining)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Used</p>
          <p className="text-xl font-bold">{dashboard.percentUsed.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">Spend by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">No spending this month</p>}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">Budget vs Actual</h3>
          {barData.some(d => d.Budget > 0 || d.Spent > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `£${v}`} />
                <Tooltip formatter={v => `£${v.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Budget" fill="#3b82f6" />
                <Bar dataKey="Spent" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">No data</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-2">Monthly Trend ({year})</h3>
        {lineData.some(d => d.total > 0) ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={v => `£${v}`} />
              <Tooltip formatter={v => `£${v.toFixed(2)}`} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-400 text-center py-8">No data for this year</p>}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <h3 className="font-semibold p-4 border-b">Category Breakdown</h3>
        <div className="divide-y">
          {dashboard.budgetVsActual.map(cat => (
            <div key={cat.categoryId} className={`flex justify-between items-center px-4 py-3 text-sm ${cat.budget > 0 && cat.spent > cat.budget ? 'bg-red-50' : ''}`}>
              <div>
                <span>{cat.categoryName}</span>
                {cat.budget > 0 && cat.spent > cat.budget && <span className="ml-2 text-red-600 text-xs font-bold">OVER BUDGET</span>}
              </div>
              <div className="text-right">
                <p>{formatCurrency(cat.spent)}</p>
                {cat.budget > 0 && <p className="text-xs text-gray-400">budget {formatCurrency(cat.budget)}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
