import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    setMessage('Invitation functionality requires email service setup. For now, share your household name with family members so they can register.');
    setEmail('');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold">Settings</h2>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold">Your Account</h3>
        <p className="text-sm text-gray-600">Name: {user?.name}</p>
        <p className="text-sm text-gray-600">Email: {user?.email}</p>
        <p className="text-sm text-gray-600">Household ID: {user?.householdId}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold">Invite Family Members</h3>
        <p className="text-sm text-gray-500">
          Share your household by asking family members to register with the same household name.
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            placeholder="Email to invite"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Send Invite
          </button>
        </form>
        {message && <p className="text-sm text-blue-600">{message}</p>}
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold">Currency</h3>
        <p className="text-sm text-gray-600">British Pound (£) — GBP</p>
        <p className="text-xs text-gray-400">All amounts are displayed and stored in GBP.</p>
      </div>
    </div>
  );
}
