import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlineBanknotes,
  HiOutlineFolder,
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineArrowPath,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineUserPlus,
  HiOutlinePaperAirplane,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCurrencyRupee,
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineClipboardDocumentCheck,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const formatCurrency = (amount = 0, currency = 'INR') => {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN')}`;
  }
  if (currency === 'USD') {
    return `$${num.toLocaleString('en-US')}`;
  }
  return `${currency} ${num.toLocaleString()}`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <HiOutlineCheckCircle className="w-3.5 h-3.5" />
          Paid
        </span>
      );
    case 'Partially Paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <HiOutlineClock className="w-3.5 h-3.5" />
          Partially Paid
        </span>
      );
    case 'Overdue':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
          Overdue
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <HiOutlineClock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
  }
};

const AdminClientPortal = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'projects' | 'milestones' | 'clients' | 'queries'
  const activeTab = searchParams.get('tab') || 'projects';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState({ project: null, milestone: null });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);

  // Billing form state
  const [billingForm, setBillingForm] = useState({
    budget: '',
    currency: 'INR',
    progress: 0,
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    liveUrl: '',
    stagingUrl: '',
    projectManagerId: '',
  });

  // Milestone create subform inside Billing Modal
  const [newMilestoneForm, setNewMilestoneForm] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    status: 'Pending',
    notes: '',
  });

  // Payment recording form state
  const [paymentForm, setPaymentForm] = useState({
    status: 'Paid',
    paidAmount: '',
    paidAt: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer / NEFT',
    paymentReference: '',
    notes: '',
  });

  // Create Client form state (with multi-project selection)
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    clientCompany: '',
    projectIds: [],
  });

  // Assign Multiple Projects to Client Modal state
  const [isAssignProjectsModalOpen, setIsAssignProjectsModalOpen] = useState(false);
  const [targetClientForProjects, setTargetClientForProjects] = useState(null);
  const [assignedProjectIdsSelection, setAssignedProjectIdsSelection] = useState([]);
  const [assignProjectSearch, setAssignProjectSearch] = useState('');

  // Reply Query form state
  const [replyForm, setReplyForm] = useState({
    response: '',
    status: 'Answered',
  });

  // Project-specific Client Registration Modal state
  const [isRegisterClientModalOpen, setIsRegisterClientModalOpen] = useState(false);
  const [targetProjectForClient, setTargetProjectForClient] = useState(null);
  const [registerClientForm, setRegisterClientForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    clientCompany: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Client Password Reset Modal state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '' });

  // Credentials Generated Popup (for quick copying & sharing with client)
  const [credentialsPopup, setCredentialsPopup] = useState(null);

  // Helper: Generate clean strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Client#';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Helper: Copy credentials to clipboard
  const copyCredentials = (cred) => {
    const origin = window.location.origin;
    const text = `=== CLIENT PORTAL LOGIN CREDENTIALS ===\nProject: ${cred.projectName}\nLogin URL: ${origin}/login\nEmail / User ID: ${cred.email}\nPassword: ${cred.password}\n=====================================\nYou can sign in at ${origin}/login to track your project live progress, deliverables, milestones, and billing.`;
    navigator.clipboard.writeText(text);
    toast.success('Login credentials copied to clipboard!');
  };

  // 1. Fetch Admin Client Portal Overview
  const { data: overviewData, isLoading, refetch } = useQuery({
    queryKey: ['adminClientPortalOverview'],
    queryFn: async () => {
      const { data } = await api.get('/client-portal/admin/overview');
      return data;
    },
    refetchInterval: 15000,
  });

  // 2. Fetch Users (for Project Manager & Client selection)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : data?.users || [];
    },
  });

  // 3. Fetch Client Queries
  const { data: queriesData, refetch: refetchQueries } = useQuery({
    queryKey: ['adminClientQueries'],
    queryFn: async () => {
      const { data } = await api.get('/client-portal/admin/queries');
      return data;
    },
    refetchInterval: 15000,
  });

  const summary = overviewData?.summary || {
    totalProjects: 0,
    projectsWithClients: 0,
    totalClients: 0,
    overallBudget: 0,
    overallPaid: 0,
    overallPending: 0,
    collectionRate: 0,
    openQueries: 0,
  };

  const projects = overviewData?.projects || [];
  const clients = overviewData?.clients || [];
  const clientQueries = queriesData?.queries || [];

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(term);
    const clientMatch = (p.clientName || p.client?.name || '').toLowerCase().includes(term);
    const emailMatch = (p.clientEmail || p.client?.email || '').toLowerCase().includes(term);
    return nameMatch || clientMatch || emailMatch;
  });

  // Flattened milestones list
  const allMilestones = [];
  projects.forEach((p) => {
    (p.billingMilestones || []).forEach((m) => {
      allMilestones.push({
        ...m,
        projectId: p._id,
        projectName: p.name,
        currency: p.currency || 'INR',
        clientName: p.clientName || p.client?.name || 'Unassigned',
      });
    });
  });

  // MUTATION: Update Project Billing & Client details
  const updateBillingMutation = useMutation({
    mutationFn: async ({ projectId, payload }) => {
      const { data } = await api.put(`/client-portal/admin/projects/${projectId}/billing`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Project billing updated successfully!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      setIsBillingModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update billing');
    },
  });

  // MUTATION: Add Milestone
  const addMilestoneMutation = useMutation({
    mutationFn: async ({ projectId, payload }) => {
      const { data } = await api.post(`/client-portal/admin/projects/${projectId}/milestones`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Milestone added successfully!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      // Refresh selectedProject
      if (selectedProject) {
        setSelectedProject((prev) => ({
          ...prev,
          billingMilestones: data.milestones,
          financials: data.financials,
        }));
      }
      setNewMilestoneForm({
        title: '',
        description: '',
        amount: '',
        dueDate: '',
        status: 'Pending',
        notes: '',
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add milestone');
    },
  });

  // MUTATION: Delete Milestone
  const deleteMilestoneMutation = useMutation({
    mutationFn: async ({ projectId, milestoneId }) => {
      const { data } = await api.delete(`/client-portal/admin/projects/${projectId}/milestones/${milestoneId}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Milestone removed successfully!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      if (selectedProject) {
        setSelectedProject((prev) => ({
          ...prev,
          billingMilestones: prev.billingMilestones.filter((m) => m._id !== data._id),
          financials: data.financials,
        }));
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove milestone');
    },
  });

  // MUTATION: Record / Update Payment
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ projectId, milestoneId, payload }) => {
      const { data } = await api.put(
        `/client-portal/admin/projects/${projectId}/milestones/${milestoneId}`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      setIsPaymentModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  // MUTATION: Create Client Account
  const createClientMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/client-portal/admin/clients', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Client account created successfully!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      queryClient.invalidateQueries(['usersList']);
      setIsClientModalOpen(false);
      setClientForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        clientCompany: '',
        projectIds: [],
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create client account');
    },
  });

  // MUTATION: Assign Multiple Projects to Client
  const assignProjectsMutation = useMutation({
    mutationFn: async ({ clientId, projectIds }) => {
      const { data } = await api.put(`/client-portal/admin/clients/${clientId}/projects`, {
        projectIds,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Projects successfully assigned to client!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      setIsAssignProjectsModalOpen(false);
      setTargetClientForProjects(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to assign projects');
    },
  });

  // MUTATION: Reply Query
  const replyQueryMutation = useMutation({
    mutationFn: async ({ queryId, payload }) => {
      const { data } = await api.put(`/client-portal/admin/queries/${queryId}/reply`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Reply sent to client successfully!');
      queryClient.invalidateQueries(['adminClientQueries']);
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      setIsReplyModalOpen(false);
      setReplyForm({ response: '', status: 'Answered' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    },
  });

  // MUTATION: Register Client for a Project
  const registerProjectClientMutation = useMutation({
    mutationFn: async ({ projectId, payload }) => {
      const { data } = await api.post(`/client-portal/admin/projects/${projectId}/client`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Client login registered & assigned successfully!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      setIsRegisterClientModalOpen(false);
      if (data.credentials) {
        setCredentialsPopup({
          ...data.credentials,
          name: data.client?.name,
          projectName: data.project?.name,
          loginUrl: `${window.location.origin}/login`,
        });
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register client');
    },
  });

  // MUTATION: Reset Client Password
  const resetClientPasswordMutation = useMutation({
    mutationFn: async ({ projectId, payload }) => {
      const { data } = await api.put(`/client-portal/admin/projects/${projectId}/client-password`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Client password updated successfully!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
      setIsResetPasswordModalOpen(false);
      if (data.credentials) {
        setCredentialsPopup({
          email: data.credentials.email,
          password: data.credentials.newPassword,
          name: targetProjectForClient?.clientName,
          projectName: targetProjectForClient?.name,
          loginUrl: `${window.location.origin}/login`,
        });
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    },
  });

  // MUTATION: Unlink Client from Project
  const unlinkClientMutation = useMutation({
    mutationFn: async (projectId) => {
      const { data } = await api.delete(`/client-portal/admin/projects/${projectId}/client`);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Client unlinked from project successfully!');
      queryClient.invalidateQueries(['adminClientPortalOverview']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unlink client');
    },
  });

  // Handlers
  const handleOpenRegisterClientModal = (project) => {
    setTargetProjectForClient(project);
    const pwd = generatePassword();
    setRegisterClientForm({
      name: project.clientName || '',
      email: project.clientEmail || '',
      password: pwd,
      phone: project.clientPhone || '',
      clientCompany: project.clientCompany || '',
    });
    setShowPassword(true);
    setIsRegisterClientModalOpen(true);
  };

  const handleOpenResetPasswordModal = (project) => {
    setTargetProjectForClient(project);
    const pwd = generatePassword();
    setResetPasswordForm({ newPassword: pwd });
    setShowPassword(true);
    setIsResetPasswordModalOpen(true);
  };

  const handleSaveRegisterClient = (e) => {
    e.preventDefault();
    if (!targetProjectForClient) return;
    if (!registerClientForm.name.trim() || !registerClientForm.email.trim() || !registerClientForm.password.trim()) {
      toast.error('Name, Email (Login ID), and Password are required');
      return;
    }
    registerProjectClientMutation.mutate({
      projectId: targetProjectForClient._id,
      payload: registerClientForm,
    });
  };

  const handleSaveResetPassword = (e) => {
    e.preventDefault();
    if (!targetProjectForClient) return;
    if (!resetPasswordForm.newPassword || resetPasswordForm.newPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    resetClientPasswordMutation.mutate({
      projectId: targetProjectForClient._id,
      payload: resetPasswordForm,
    });
  };

  const handleUnlinkClient = (project) => {
    if (window.confirm(`Are you sure you want to unlink client "${project.clientName || project.clientEmail}" from project "${project.name}"?`)) {
      unlinkClientMutation.mutate(project._id);
    }
  };

  const handleOpenBillingModal = (project) => {
    setSelectedProject(project);
    setBillingForm({
      budget: project.budget || '',
      currency: project.currency || 'INR',
      progress: project.progress || 0,
      clientId: project.client?._id || project.client || '',
      clientName: project.clientName || project.client?.name || '',
      clientEmail: project.clientEmail || project.client?.email || '',
      clientPhone: project.clientPhone || project.client?.phone || '',
      clientCompany: project.clientCompany || '',
      liveUrl: project.liveUrl || '',
      stagingUrl: project.stagingUrl || '',
      projectManagerId: project.projectManager?._id || project.projectManager || '',
    });
    setIsBillingModalOpen(true);
  };

  const handleSaveBillingDetails = (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    updateBillingMutation.mutate({
      projectId: selectedProject._id,
      payload: billingForm,
    });
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!newMilestoneForm.title || !newMilestoneForm.amount) {
      toast.error('Milestone title and amount are required');
      return;
    }
    addMilestoneMutation.mutate({
      projectId: selectedProject._id,
      payload: newMilestoneForm,
    });
  };

  const handleOpenPaymentModal = (project, milestone) => {
    setPaymentTarget({ project, milestone });
    setPaymentForm({
      status: 'Paid',
      paidAmount: milestone.paidAmount || milestone.amount,
      paidAt: milestone.paidAt
        ? new Date(milestone.paidAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      paymentMethod: milestone.paymentMethod || 'Bank Transfer / NEFT',
      paymentReference: milestone.paymentReference || '',
      notes: milestone.notes || '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentTarget.project || !paymentTarget.milestone) return;
    recordPaymentMutation.mutate({
      projectId: paymentTarget.project._id || paymentTarget.project,
      milestoneId: paymentTarget.milestone._id,
      payload: paymentForm,
    });
  };

  const handleCreateClientAccount = (e) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.email || !clientForm.password) {
      toast.error('Please enter client name, email, and password');
      return;
    }
    createClientMutation.mutate(clientForm);
  };

  const handleOpenAssignProjectsModal = (client) => {
    setTargetClientForProjects(client);
    // Find all project IDs currently assigned to this client
    const currentAssigned = (client.assignedProjects || []).map((p) => p._id);
    const allMatching = projects
      .filter(
        (p) =>
          (p.client && (p.client._id === client._id || p.client === client._id)) ||
          (p.clientEmail && p.clientEmail.toLowerCase() === client.email?.toLowerCase())
      )
      .map((p) => p._id);
    const combinedIds = Array.from(new Set([...currentAssigned, ...allMatching]));
    setAssignedProjectIdsSelection(combinedIds);
    setAssignProjectSearch('');
    setIsAssignProjectsModalOpen(true);
  };

  const handleSaveAssignedProjects = (e) => {
    e.preventDefault();
    if (!targetClientForProjects) return;
    assignProjectsMutation.mutate({
      clientId: targetClientForProjects._id,
      projectIds: assignedProjectIdsSelection,
    });
  };

  const handleOpenReplyModal = (query) => {
    setSelectedQuery(query);
    setReplyForm({
      response: query.response || '',
      status: query.status === 'Open' ? 'Answered' : query.status,
    });
    setIsReplyModalOpen(true);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!selectedQuery) return;
    if (!replyForm.response.trim()) {
      toast.error('Please enter a response message');
      return;
    }
    replyQueryMutation.mutate({
      queryId: selectedQuery._id,
      payload: replyForm,
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <HiOutlineBanknotes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Client Portal & Billings
              </h1>
              <p className="text-sm text-slate-500">
                Manage client access, project costs, billing milestones, and acknowledge client payments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setIsClientModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-200"
          >
            <HiOutlineUserPlus className="w-4 h-4" />
            Create Client Login
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Contract Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Contract Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HiOutlineCreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(summary.overallBudget)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all active client projects</div>
        </div>

        {/* Card 2: Total Paid Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Collections (Paid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiOutlineCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {formatCurrency(summary.overallPaid)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {summary.collectionRate}% Collected
            </span>
          </div>
        </div>

        {/* Card 3: Pending Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Balance Due
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiOutlineClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {formatCurrency(summary.overallPending)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Outstanding client receivables</div>
        </div>

        {/* Card 4: Registered Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Client Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HiOutlineUserGroup className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.totalClients}</div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.projectsWithClients} projects assigned
          </div>
        </div>

        {/* Card 5: Open Queries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Open Inquiries
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.openQueries}</div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.openQueries > 0 ? (
              <span className="text-rose-600 font-semibold">Action required</span>
            ) : (
              'All queries answered'
            )}
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineFolder className="w-4 h-4" />
              Projects & Billings ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'milestones'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineBanknotes className="w-4 h-4" />
              Invoices & Milestones ({allMilestones.length})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineUserGroup className="w-4 h-4" />
              Client Accounts ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'queries'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
              Client Inquiries
              {summary.openQueries > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white">
                  {summary.openQueries}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'projects' && (
            <div className="relative w-full sm:w-64">
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* 4. Tab Content */}
        <div className="p-4 md:p-6">
          {/* TAB 1: Projects & Billings */}
          {activeTab === 'projects' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <th className="pb-3 px-3">Project</th>
                    <th className="pb-3 px-3">Assigned Client & Login Access</th>
                    <th className="pb-3 px-3 text-right">Total Cost / Budget</th>
                    <th className="pb-3 px-3 text-right">Paid Amount</th>
                    <th className="pb-3 px-3 text-right">Pending Balance</th>
                    <th className="pb-3 px-3 text-center">Progress %</th>
                    <th className="pb-3 px-3 text-center">Milestones</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No projects found. Add or configure project billing to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => {
                      const fin = project.financials || {};
                      const clientName = project.clientName || project.client?.name;
                      const clientEmail = project.clientEmail || project.client?.email;
                      const milestones = project.billingMilestones || [];
                      const paidMilestones = milestones.filter((m) => m.status === 'Paid');

                      return (
                        <tr key={project._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-3 font-medium text-slate-900">
                            <div>
                              <div className="font-bold text-slate-900">{project.name}</div>
                              <div className="text-xs text-slate-500">{project.companyName || 'Workspace'}</div>
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            {clientName || clientEmail ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900">{clientName || 'Client'}</span>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <HiOutlineCheckCircle className="w-3 h-3" /> Login Active
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 font-mono">{clientEmail}</div>
                                <div className="flex items-center gap-2 pt-0.5">
                                  <button
                                    onClick={() => handleOpenResetPasswordModal(project)}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                    title="Reset client login password"
                                  >
                                    <HiOutlineKey className="w-3 h-3" /> Reset Password
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    onClick={() => handleUnlinkClient(project)}
                                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                                    title="Unlink client from project"
                                  >
                                    Unlink
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <button
                                  onClick={() => handleOpenRegisterClientModal(project)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                                >
                                  <HiOutlineUserPlus className="w-4 h-4" />
                                  Register Client Login
                                </button>
                                <div className="text-[10px] text-slate-400 mt-0.5">Create ID &amp; Password</div>
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(fin.totalCost, project.currency)}
                          </td>

                          <td className="py-4 px-3 text-right font-bold text-emerald-600">
                            {formatCurrency(fin.totalPaid, project.currency)}
                          </td>

                          <td className="py-4 px-3 text-right font-bold text-amber-600">
                            {formatCurrency(fin.totalPending, project.currency)}
                          </td>

                          <td className="py-4 px-3">
                            <div className="flex flex-col items-center">
                              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                                <div
                                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                  style={{ width: `${project.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-700">
                                {project.progress || 0}%
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {paidMilestones.length} / {milestones.length} Paid
                            </span>
                          </td>

                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {clientName || clientEmail ? (
                                <button
                                  onClick={() => handleOpenResetPasswordModal(project)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="View / Reset Login Credentials"
                                >
                                  <HiOutlineKey className="w-3.5 h-3.5" />
                                  Credentials
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenRegisterClientModal(project)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Create Client Account"
                                >
                                  <HiOutlineUserPlus className="w-3.5 h-3.5" />
                                  Create Login
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenBillingModal(project)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                              >
                                Milestones &amp; Billing
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Invoices & Milestones */}
          {activeTab === 'milestones' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <th className="pb-3 px-3">Invoice #</th>
                    <th className="pb-3 px-3">Project</th>
                    <th className="pb-3 px-3">Client</th>
                    <th className="pb-3 px-3">Milestone Title</th>
                    <th className="pb-3 px-3 text-right">Amount</th>
                    <th className="pb-3 px-3">Due Date</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allMilestones.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No milestone invoices created yet. Go to Projects & Billings tab and add milestones to projects.
                      </td>
                    </tr>
                  ) : (
                    allMilestones.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-3 font-mono font-bold text-slate-800">
                          {m.invoiceNumber || 'INV-SCHEDULED'}
                        </td>
                        <td className="py-4 px-3 font-semibold text-slate-900">{m.projectName}</td>
                        <td className="py-4 px-3 text-slate-600">{m.clientName}</td>
                        <td className="py-4 px-3 font-medium text-slate-800">{m.title}</td>
                        <td className="py-4 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(m.amount, m.currency)}
                        </td>
                        <td className="py-4 px-3 text-slate-600">
                          {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-3 text-center">{getStatusBadge(m.status)}</td>
                        <td className="py-4 px-3 text-right">
                          <button
                            onClick={() => handleOpenPaymentModal(m.projectId, m)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            Record Payment / Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Client Accounts & Multi-Project Assignment */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Client Accounts & Multi-Project Assignments
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clients sign in at <code>/login</code> and strictly see their assigned projects and bills. One client can be assigned to multiple projects simultaneously.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setClientForm({
                      name: '',
                      email: '',
                      password: generatePassword(),
                      phone: '',
                      clientCompany: '',
                      projectIds: [],
                    });
                    setIsClientModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs flex-shrink-0"
                >
                  <HiOutlineUserPlus className="w-4 h-4" />
                  Add Client Account
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Client Name & Org</th>
                      <th className="py-3 px-4">Login Email & Phone</th>
                      <th className="py-3 px-4">Assigned Projects</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          No client accounts created yet. Click "+ Add Client Account" to register one.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => {
                        const assignedList = client.assignedProjects || projects.filter(
                          (p) =>
                            (p.client && (p.client._id === client._id || p.client === client._id)) ||
                            (p.clientEmail && p.clientEmail.toLowerCase() === client.email?.toLowerCase())
                        );

                        return (
                          <tr key={client._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                                  {(client.name || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{client.name}</div>
                                  <div className="text-xs text-slate-500">{client.designation || 'Client'}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-medium text-slate-800">{client.email}</div>
                              <div className="text-xs text-slate-500 font-mono">{client.phone || 'No phone'}</div>
                            </td>

                            <td className="py-4 px-4 max-w-md">
                              {assignedList.length === 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  No Projects Assigned
                                </span>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {assignedList.map((p) => (
                                    <span
                                      key={p._id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                                    >
                                      <HiOutlineFolder className="w-3.5 h-3.5 text-indigo-500" />
                                      {p.name}
                                      <span className="text-[10px] text-indigo-500/80 font-mono">
                                        ({p.progress ?? 0}%)
                                      </span>
                                    </span>
                                  ))}
                                  <span className="text-[11px] font-bold text-slate-400 ml-1">
                                    ({assignedList.length} total)
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-4 text-slate-500 text-xs">
                              {new Date(client.createdAt).toLocaleDateString()}
                            </td>

                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleOpenAssignProjectsModal(client)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 shadow-2xs transition-colors"
                              >
                                <HiOutlineFolder className="w-3.5 h-3.5" />
                                Assign Projects ({assignedList.length})
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Client Inquiries */}
          {activeTab === 'queries' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <th className="pb-3 px-3">Project</th>
                    <th className="pb-3 px-3">Client</th>
                    <th className="pb-3 px-3">Category</th>
                    <th className="pb-3 px-3">Subject & Inquiry</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 px-3">Received On</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientQueries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No client inquiries found.
                      </td>
                    </tr>
                  ) : (
                    clientQueries.map((q) => (
                      <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-3 font-semibold text-slate-900">
                          {q.project?.name || 'General Project'}
                        </td>
                        <td className="py-4 px-3">
                          <div className="font-medium text-slate-800">{q.clientName || q.client?.name}</div>
                          <div className="text-xs text-slate-500">{q.clientEmail || q.client?.email}</div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                            {q.category}
                          </span>
                        </td>
                        <td className="py-4 px-3 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">{q.subject}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{q.message}</div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          {q.status === 'Answered' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                              Answered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <HiOutlineClock className="w-3.5 h-3.5" />
                              Open
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-slate-500">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <button
                            onClick={() => handleOpenReplyModal(q)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                          >
                            {q.status === 'Answered' ? 'View / Edit Reply' : 'Reply to Client'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Manage Project Billing & Milestones */}
      {/* ========================================================================= */}
      {isBillingModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Manage Project Billing & Milestones
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Project: <strong>{selectedProject.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsBillingModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            {/* Form for Project Budget & Client Linking */}
            <form onSubmit={handleSaveBillingDetails} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                1. Project Financial & Client Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Project Cost / Budget
                  </label>
                  <input
                    type="number"
                    value={billingForm.budget}
                    onChange={(e) => setBillingForm({ ...billingForm, budget: e.target.value })}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={billingForm.currency}
                    onChange={(e) => setBillingForm({ ...billingForm, currency: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={billingForm.progress}
                    onChange={(e) => setBillingForm({ ...billingForm, progress: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assign Existing Client Account
                  </label>
                  <select
                    value={billingForm.clientId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const cObj = clients.find((c) => c._id === cId);
                      setBillingForm({
                        ...billingForm,
                        clientId: cId,
                        clientName: cObj ? cObj.name : billingForm.clientName,
                        clientEmail: cObj ? cObj.email : billingForm.clientEmail,
                        clientPhone: cObj ? cObj.phone : billingForm.clientPhone,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Choose registered client --</option>
                    {clients.map((c) => {
                      const projCount = (c.assignedProjects || []).length;
                      return (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.email}) {projCount > 0 ? `• [${projCount} project(s) assigned]` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Manager
                  </label>
                  <select
                    value={billingForm.projectManagerId}
                    onChange={(e) =>
                      setBillingForm({ ...billingForm, projectManagerId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Assign Project Manager --</option>
                    {allUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Live URL</label>
                  <input
                    type="url"
                    value={billingForm.liveUrl}
                    onChange={(e) => setBillingForm({ ...billingForm, liveUrl: e.target.value })}
                    placeholder="https://clientproject.com"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staging URL</label>
                  <input
                    type="url"
                    value={billingForm.stagingUrl}
                    onChange={(e) => setBillingForm({ ...billingForm, stagingUrl: e.target.value })}
                    placeholder="https://staging.clientproject.com"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateBillingMutation.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  {updateBillingMutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>

            <hr className="border-slate-200" />

            {/* Milestones Schedule */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  2. Milestone-Based Invoicing Schedule
                </h3>
              </div>

              {/* Milestones Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Milestone Title</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedProject.billingMilestones || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No milestones added yet. Add one below.
                        </td>
                      </tr>
                    ) : (
                      selectedProject.billingMilestones.map((m, index) => (
                        <tr key={m._id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{m.title}</div>
                            {m.description && (
                              <div className="text-[11px] text-slate-500">{m.description}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(m.amount, selectedProject.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-center">{getStatusBadge(m.status)}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPaymentModal(selectedProject, m)}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px]"
                              >
                                Record Payment
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  deleteMilestoneMutation.mutate({
                                    projectId: selectedProject._id,
                                    milestoneId: m._id,
                                  })
                                }
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                              >
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add New Milestone Subform */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700">
                  + Add New Milestone Invoice
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Milestone Title (e.g. 50% Advance on UI Approval)"
                      value={newMilestoneForm.title}
                      onChange={(e) =>
                        setNewMilestoneForm({ ...newMilestoneForm, title: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newMilestoneForm.amount}
                      onChange={(e) =>
                        setNewMilestoneForm({ ...newMilestoneForm, amount: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={newMilestoneForm.dueDate}
                      onChange={(e) =>
                        setNewMilestoneForm({ ...newMilestoneForm, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    disabled={addMilestoneMutation.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    {addMilestoneMutation.isPending ? 'Adding...' : 'Add Milestone'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Record Payment Modal */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && paymentTarget.milestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Client Payment</h2>
                <p className="text-xs text-slate-500">
                  Milestone: <strong>{paymentTarget.milestone.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentForm.status}
                  onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Paid">Paid (Full Settlement)</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Received
                </label>
                <input
                  type="number"
                  value={paymentForm.paidAmount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paidAt}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                  <option value="UPI / QR Code">UPI / QR Code</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction / UTR Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789 or Cheque #987654"
                  value={paymentForm.paymentReference}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentReference: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                >
                  {recordPaymentMutation.isPending ? 'Saving...' : 'Acknowledge Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Create Client Account Modal */}
      {/* ========================================================================= */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Client Login</h2>
                <p className="text-xs text-slate-500">
                  Client can log in at <code>/login</code> to view progress and invoices.
                </p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClientAccount} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="client@company.com"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={clientForm.password}
                  onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={clientForm.clientCompany}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, clientCompany: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Assign Project(s) (Multiple Allowed)
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600">
                    {(clientForm.projectIds || []).length} project(s) selected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Select one or multiple projects this client should have access to.
                </p>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                  {projects.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">No projects created yet</p>
                  ) : (
                    projects.map((p) => {
                      const isChecked = (clientForm.projectIds || []).includes(p._id);
                      return (
                        <label
                          key={p._id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = clientForm.projectIds || [];
                                if (e.target.checked) {
                                  setClientForm({ ...clientForm, projectIds: [...current, p._id] });
                                } else {
                                  setClientForm({
                                    ...clientForm,
                                    projectIds: current.filter((id) => id !== p._id),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span>{p.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                            {p.status || 'Active'}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClientMutation.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                >
                  {createClientMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Reply to Client Query Modal */}
      {/* ========================================================================= */}
      {isReplyModalOpen && selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reply to Client Inquiry</h2>
                <p className="text-xs text-slate-500">
                  From: <strong>{selectedQuery.clientName || selectedQuery.client?.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-800">Subject: {selectedQuery.subject}</div>
              <p className="text-slate-600 whitespace-pre-wrap">{selectedQuery.message}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Response *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your official update or answer to the client..."
                  value={replyForm.response}
                  onChange={(e) => setReplyForm({ ...replyForm, response: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={replyForm.status}
                  onChange={(e) => setReplyForm({ ...replyForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Answered">Answered</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed / Resolved</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replyQueryMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                  {replyQueryMutation.isPending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Register Client Login for Specific Project */}
      {/* ========================================================================= */}
      {isRegisterClientModalOpen && targetProjectForClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register Client Account &amp; Login</h2>
                <p className="text-xs text-slate-500">
                  Assign to Project: <strong className="text-indigo-600">{targetProjectForClient.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsRegisterClientModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
              <HiOutlineShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                This client will log in at <code>/login</code> and will <strong>strictly see only this project</strong>, its deliverables, progress, and billing milestones.
              </span>
            </div>

            <form onSubmit={handleSaveRegisterClient} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={registerClientForm.name}
                  onChange={(e) => setRegisterClientForm({ ...registerClientForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client Email Address (Login ID) *</label>
                <input
                  type="email"
                  required
                  placeholder="client@company.com"
                  value={registerClientForm.email}
                  onChange={(e) => setRegisterClientForm({ ...registerClientForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Client Login Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generatePassword();
                      setRegisterClientForm({ ...registerClientForm, password: p });
                      setShowPassword(true);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={registerClientForm.password}
                    onChange={(e) => setRegisterClientForm({ ...registerClientForm, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={registerClientForm.phone}
                    onChange={(e) => setRegisterClientForm({ ...registerClientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="Client's Business"
                    value={registerClientForm.clientCompany}
                    onChange={(e) => setRegisterClientForm({ ...registerClientForm, clientCompany: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerProjectClientMutation.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                >
                  {registerProjectClientMutation.isPending ? 'Activating...' : 'Activate Client Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Reset Client Password */}
      {/* ========================================================================= */}
      {isResetPasswordModalOpen && targetProjectForClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reset Client Password</h2>
                <p className="text-xs text-slate-500">
                  Client: <strong>{targetProjectForClient.clientName || 'Client'}</strong> ({targetProjectForClient.clientEmail})
                </p>
              </div>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-3 text-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Enter New Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generatePassword();
                      setResetPasswordForm({ newPassword: p });
                      setShowPassword(true);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm({ newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetClientPasswordMutation.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                >
                  {resetClientPasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: Credentials Activated & Copy Card */}
      {/* ========================================================================= */}
      {credentialsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Client Login Ready!</h2>
                  <p className="text-[11px] text-slate-500">Project: {credentialsPopup.projectName}</p>
                </div>
              </div>
              <button
                onClick={() => setCredentialsPopup(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Portal Login URL:</span>
                <span className="font-mono font-bold text-indigo-700">{window.location.origin}/login</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Client Login ID (Email):</span>
                <span className="font-mono font-bold text-slate-900">{credentialsPopup.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Login Password:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {credentialsPopup.password}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                The client can now sign in at <strong>/login</strong>. They will <strong>strictly see only "{credentialsPopup.projectName}"</strong>, its progress, milestones, live links, and billing records.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => copyCredentials(credentialsPopup)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
              >
                <HiOutlineClipboardDocumentCheck className="w-5 h-5" />
                Copy Credentials to Share
              </button>
              <button
                onClick={() => setCredentialsPopup(null)}
                className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Assign Multiple Projects to Client */}
      {/* ========================================================================= */}
      {isAssignProjectsModalOpen && targetClientForProjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HiOutlineFolder className="w-5 h-5 text-indigo-600" />
                  Assign Multiple Projects to Client
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client: <strong>{targetClientForProjects.name}</strong> ({targetClientForProjects.email})
                </p>
              </div>
              <button
                onClick={() => setIsAssignProjectsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Select which projects this client should have access to in their portal. They will be able to track live progress, deliverables, invoices, and billing for all selected projects.
              </p>

              {/* Search & Bulk Selection Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                <div className="relative w-full sm:w-64">
                  <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={assignProjectSearch}
                    onChange={(e) => setAssignProjectSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = projects.map((p) => p._id);
                      setAssignedProjectIdsSelection(allIds);
                    }}
                    className="text-indigo-600 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setAssignedProjectIdsSelection([])}
                    className="text-slate-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Projects Checkbox List */}
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                {projects.length === 0 ? (
                  <p className="text-xs text-slate-400 p-6 text-center">No projects found.</p>
                ) : (
                  projects
                    .filter((p) =>
                      (p.name || '').toLowerCase().includes(assignProjectSearch.toLowerCase())
                    )
                    .map((p) => {
                      const isSelected = assignedProjectIdsSelection.includes(p._id);
                      const isAssignedToOther =
                        p.client &&
                        p.client._id !== targetClientForProjects._id &&
                        p.client !== targetClientForProjects._id;

                      return (
                        <label
                          key={p._id}
                          className={`flex items-start justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50/70'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignedProjectIdsSelection((prev) => [...prev, p._id]);
                                } else {
                                  setAssignedProjectIdsSelection((prev) =>
                                    prev.filter((id) => id !== p._id)
                                  );
                                }
                              }}
                              className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                {p.name}
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  {p.status || 'Active'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Contract Budget: {formatCurrency(p.budget, p.currency)} • Progress: {p.progress || 0}%
                              </div>
                              {isAssignedToOther && (
                                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                  Currently linked to: {p.clientName || 'Another client'} (will be reassigned)
                                </p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isSelected ? 'Assigned' : 'Unassigned'}
                          </span>
                        </label>
                      );
                    })
                )}
              </div>

              {/* Summary Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">
                  Total Projects Selected for this Client:
                </span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {assignedProjectIdsSelection.length} Project(s)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAssignProjectsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignedProjects}
                disabled={assignProjectsMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50"
              >
                {assignProjectsMutation.isPending ? 'Saving Assignments...' : 'Save Assigned Projects'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClientPortal;
