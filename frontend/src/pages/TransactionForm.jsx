import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'DebitCard', label: 'Debit Card' },
  { value: 'CreditCard', label: 'Credit Card' },
  { value: 'DirectDebit', label: 'Direct Debit' },
  { value: 'StandingOrder', label: 'Standing Order' },
  { value: 'BankTransfer', label: 'Bank Transfer' },
];

export default function TransactionForm() {
  const { API } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    paymentMethod: 'DebitCard',
    notes: '',
  });
  const [error, setError] = useState('');
  const [monthTotal, setMonthTotal] = useState(null);

  useEffect(() => {
    API.get('/categories').then(({ data }) => setCategories(data)).catch(console.error);
    const now = new Date();
    API.get(`/transactions?month=${now.getMonth() + 1}&year=${now.getFullYear()}&limit=1`)
      .then(({ data }) => setMonthTotal(data.totalAmount))
      .catch(() => {});
    if (isEdit) {
      API.get(`/transactions?limit=100`).then(({ data }) => {
        const t = data.transactions.find(tx => tx.id === parseInt(id));
        if (t) {
          setForm({
            categoryId: t.categoryId,
            date: new Date(t.date).toISOString().split('T')[0],
            description: t.description,
            amount: (t.amount / 100).toFixed(2),
            paymentMethod: t.paymentMethod,
            notes: t.notes || '',
          });
        }
      }).catch(console.error);
    }
  }, [API, id, isEdit]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.categoryId || !form.description || !form.amount || !form.paymentMethod) {
      setError('Please fill all required fields');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) {
      setError('Amount can have at most 2 decimal places');
      return;
    }
    try {
      const payload = { ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) };
      if (isEdit) {
        await API.put(`/transactions/${id}`, payload);
      } else {
        await API.post('/transactions', payload);
      }
      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
      {monthTotal !== null && !isEdit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex justify-between items-center text-sm">
          <span className="text-gray-600">Month total so far</span>
          <span className="font-bold">{formatCurrency(monthTotal)}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <input type="text" name="description" value={form.description} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount (£) *</label>
          <input type="number" name="amount" value={form.amount} onChange={handleChange} step="0.01" min="0.01" className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Method *</label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required>
            {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" rows={3} />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            {isEdit ? 'Update' : 'Add Transaction'}
          </button>
          <button type="button" onClick={() => navigate('/transactions')} className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
