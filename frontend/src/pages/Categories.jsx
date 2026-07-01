import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';

export default function Categories() {
  const { API } = useAuth();
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editBudget, setEditBudget] = useState('');
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await API.get('/categories');
      setCategories(data);
    } catch (err) { console.error(err); }
  }, [API]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditBudget((cat.monthlyBudget).toFixed(2));
  };

  const saveBudget = async (id) => {
    try {
      const budget = parseFloat(editBudget);
      if (isNaN(budget) || budget < 0) { setError('Invalid budget'); return; }
      await API.put(`/categories/${id}`, { monthlyBudget: budget });
      setEditingId(null);
      setError('');
      fetchCategories();
    } catch (err) { setError(err.response?.data?.error || 'Save failed'); }
  };

  const handleAdd = async () => {
    try {
      if (!newName) { setError('Name required'); return; }
      const budget = parseFloat(newBudget) || 0;
      await API.post('/categories', { name: newName, monthlyBudget: budget });
      setNewName('');
      setNewBudget('');
      setError('');
      fetchCategories();
    } catch (err) { setError(err.response?.data?.error || 'Add failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this custom category?')) return;
    try {
      await API.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) { setError(err.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Categories & Budgets</h2>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
          <span>Category</span>
          <span className="text-right">Monthly Budget</span>
          <span></span>
        </div>
        <div className="divide-y">
          {categories.map((cat) => (
            <div key={cat.id} className="grid grid-cols-3 gap-2 px-4 py-3 text-sm items-center">
              <span>{cat.name} {cat.isDefault && <span className="text-xs text-gray-400">(default)</span>}</span>
              <div className="text-right">
                {editingId === cat.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs">£</span>
                    <input type="number" step="0.01" min="0" value={editBudget} onChange={e => setEditBudget(e.target.value)}
                      className="w-24 border rounded px-2 py-1 text-right text-sm" />
                    <button onClick={() => saveBudget(cat.id)} className="text-blue-600 text-xs hover:underline">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs hover:underline">Cancel</button>
                  </div>
                ) : (
                  <span>{formatCurrency(cat.monthlyBudget * 100)}</span>
                )}
              </div>
              <div className="text-right">
                {editingId !== cat.id && (
                  <button onClick={() => startEdit(cat)} className="text-blue-600 text-xs hover:underline mr-2">Edit</button>
                )}
                {!cat.isDefault && (
                  <button onClick={() => handleDelete(cat.id)} className="text-red-600 text-xs hover:underline">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-3">Add Custom Category</h3>
        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" />
          <div className="flex items-center gap-1">
            <span className="text-sm">£</span>
            <input type="number" step="0.01" min="0" placeholder="Budget" value={newBudget} onChange={e => setNewBudget(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-28" />
          </div>
          <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Add</button>
        </div>
      </div>
    </div>
  );
}
