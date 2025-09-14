import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const DEPARTMENTS = [
  'ICT', 'Legal', 'Finance', 'Registry', 'Administration', 'Mining', 'Chemicals', 'Geology', 'Petroleum', 'Energy', 'Water', 'Environment', 'Lands', 'Human Resources', 'Procurement', 'Planning'
];

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'officer', label: 'Officer' },
  { value: 'secretary', label: 'Secretary' }
];

const getPosition = (department: string, role: string) => {
  if (!department || !role) return '';
  if (role === 'admin') return `${department} Admin`;
  if (role === 'officer') return `${department} Officer`;
  if (role === 'secretary') return `${department} Secretary`;
  return '';
};

export default function RegisterUserModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    accessLevel: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  // Set default access level based on role
  React.useEffect(() => {
    if (form.role === 'admin') {
      setForm(f => ({ ...f, accessLevel: f.accessLevel === '0' ? '0' : '1' }));
    } else if (form.role === 'officer' || form.role === 'secretary') {
      setForm(f => ({ ...f, accessLevel: '2' }));
    } else {
      setForm(f => ({ ...f, accessLevel: '' }));
    }
  }, [form.role]);

  const position = getPosition(form.department, form.role);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.department || !form.role || !form.accessLevel || !form.password || !form.confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          department: form.department,
          role: form.role,
          position: getPosition(form.department, form.role),
          level: Number(form.accessLevel),
          password: form.password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');
      
      // Show success notification
      toast({
        title: "✅ User Created Successfully!",
        description: `${form.name} has been registered and added to the system.`,
        duration: 5000,
      });
      
      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Reset form and close modal
      setForm({
        name: '',
        email: '',
        department: '',
        role: '',
        accessLevel: '',
        password: '',
        confirmPassword: ''
      });
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create user';
      setError(errorMessage);
      
      // Show error notification
      toast({
        title: "❌ User Creation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 transition-colors duration-200" />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 border border-gray-200 dark:border-gray-700">
        <button className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Register New User</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" type="email" className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
          <select name="department" value={form.department} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required>
            <option value="">Select Department</option>
            {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </select>
          <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required>
            <option value="">Select Role</option>
            {ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
          {/* Access Level Dropdown */}
          {form.role === 'admin' && (
            <select name="accessLevel" value={form.accessLevel} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required>
              <option value="1">Level 1 (Department Admin)</option>
              <option value="0">Level 0 (System Admin)</option>
            </select>
          )}
          {(form.role === 'officer' || form.role === 'secretary') && (
            <input name="accessLevel" value="2" readOnly className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Access Level" />
          )}
          <input name="position" value={position} readOnly className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Position" />
          <input name="password" value={form.password} onChange={handleChange} placeholder="Password" type="password" className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
          <input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm Password" type="password" className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
          {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-2 rounded font-semibold transition">Register</button>
        </form>
      </div>
    </div>
  );
}
