import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PAYMENT_LABELS = { Cash: 'Cash', DebitCard: 'Debit Card', CreditCard: 'Credit Card', DirectDebit: 'Direct Debit', StandingOrder: 'Standing Order', BankTransfer: 'Bank Transfer' };

export default function Transactions() {
  const { API } = useAuth();
  const now = new Date();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await API.get('/categories');
      setCategories(data);
    } catch (err) { console.error(err); }
  }, [API]);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = { page, limit: 20, month, year, sortBy, sortOrder };
      if (categoryFilter) params.categoryId = categoryFilter;
      const { data } = await API.get('/transactions', { params });
      setTransactions(data.transactions);
      setTotal(data.total);
      setTotalAmount(data.totalAmount);
      setPages(data.pages);
    } catch (err) { console.error(err); }
  }, [API, page, month, year, categoryFilter, sortBy, sortOrder]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await API.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) { console.error(err); }
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const catMap = {};
  for (const c of categories) catMap[c.id] = c;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Transactions</h2>
        <Link to="/transactions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add</Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select value={month} onChange={e => { setMonth(parseInt(e.target.value)); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => { setYear(parseInt(e.target.value)); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex justify-between items-center text-sm">
        <span className="text-gray-600">{total} transaction{total !== 1 ? 's' : ''}</span>
        <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="hidden md:grid grid-cols-6 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
          <button onClick={() => handleSort('date')} className="text-left">Date {sortBy === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</button>
          <button onClick={() => handleSort('description')} className="text-left">Description {sortBy === 'description' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</button>
          <span>Category</span>
          <button onClick={() => handleSort('amount')} className="text-right">Amount {sortBy === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</button>
          <span>Payment</span>
          <span>Actions</span>
        </div>
        <div className="divide-y">
          {transactions.map((t) => {
            const cat = catMap[t.categoryId] || t.category;
            const overBudget = cat && cat.monthlyBudget > 0 && (t.amount > cat.monthlyBudget * 100);
            return (
              <div key={t.id} className={`grid grid-cols-1 md:grid-cols-6 gap-1 px-4 py-3 text-sm items-center ${overBudget ? 'bg-red-50' : ''}`}>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs text-gray-400">Date</span>
                  <span>{new Date(t.date).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs text-gray-400">Description</span>
                  <span>{t.description}</span>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs text-gray-400">Category</span>
                  <span>{cat?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between md:block md:text-right">
                  <span className="md:hidden text-xs text-gray-400">Amount</span>
                  <span className={`font-semibold ${overBudget ? 'text-red-600' : ''}`}>{formatCurrency(t.amount)}</span>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs text-gray-400">Payment</span>
                  <span className="text-xs">{PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod}</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <Link to={`/transactions/${t.id}/edit`} className="text-blue-600 text-xs hover:underline">Edit</Link>
                  <button onClick={() => handleDelete(t.id)} className="text-red-600 text-xs hover:underline">Delete</button>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && <p className="text-center py-8 text-gray-400">No transactions</p>}
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded text-sm ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
