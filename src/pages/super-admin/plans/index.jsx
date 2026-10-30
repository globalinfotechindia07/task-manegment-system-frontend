import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const PlansManager = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 999,
    billingCycle: 'Monthly',
    maxEmployees: 15,
    durationDays: 30,
    features: '',
    description: '',
    isActive: true
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plansList'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data;
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/plans', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Subscription plan created successfully!');
      queryClient.invalidateQueries({ queryKey: ['plansList'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create plan');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/plans/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Subscription plan updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['plansList'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update plan');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/plans/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Plan deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['plansList'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  });

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 999,
      billingCycle: 'Monthly',
      maxEmployees: 15,
      durationDays: 30,
      features: '',
      description: '',
      isActive: true
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle || 'Monthly',
      maxEmployees: plan.maxEmployees,
      durationDays: plan.durationDays || 30,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      description: plan.description || '',
      isActive: plan.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      features: formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (plan) => {
    if (window.confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) {
      deleteMutation.mutate(plan._id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans & Tiers</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure software packages, pricing models, employee quota caps, and included platform features.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Plan
        </button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : plans?.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">No subscription plans found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <div
              key={plan._id}
              className={`glass-panel rounded-2xl p-6 border transition-all flex flex-col justify-between relative overflow-hidden ${
                plan.isActive
                  ? 'border-slate-800 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5'
                  : 'border-slate-800/50 opacity-60'
              }`}
            >
              {plan.name.includes('Pro') && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      plan.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 min-h-[32px]">{plan.description || 'Full-featured enterprise plan.'}</p>

                {/* Price Display */}
                <div className="mt-4 mb-4 pb-4 border-b border-slate-800 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹{plan.price?.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {plan.billingCycle?.toLowerCase() || 'month'}</span>
                </div>

                {/* Quota Highlights */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700/40">
                    <span className="text-slate-400 font-medium">Employee Limit</span>
                    <span className="font-semibold text-white">{plan.maxEmployees} Employees</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700/40">
                    <span className="text-slate-400 font-medium">Duration Validity</span>
                    <span className="font-semibold text-white">{plan.durationDays || 30} Days</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Features Included</p>
                  <ul className="space-y-1.5">
                    {plan.features?.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Edit Plan
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors border border-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Scale Tier"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Employee Quota *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxEmployees}
                    onChange={(e) => setFormData({ ...formData, maxEmployees: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Validity (Days) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 30 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Brief Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Best suited for high-growth mid-sized tech companies."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Features (One feature per line)
                </label>
                <textarea
                  rows={4}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Task & Project Tracking&#10;Geofenced Mobile Attendance&#10;Payroll & Salary Slips&#10;Unlimited Video Meetings"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-slate-300">
                  Plan is Active and available for new subscriptions
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManager;
