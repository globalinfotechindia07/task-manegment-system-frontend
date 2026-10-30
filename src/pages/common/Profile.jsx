import { useState, useRef } from 'react';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineCamera } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('personal'); // personal, security

  // Personal Info State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(
    user?.profilePicture ? `${API_BASE_URL}${user.profilePicture}` : null
  );
  const [savingPersonal, setSavingPersonal] = useState(false);
  const fileInputRef = useRef(null);

  // Security State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setSavingPersonal(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const { data } = await api.put('/auth/profile', formData);

      updateUser(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSavingSecurity(true);
    try {
      const { data } = await api.put('/auth/profile', {
        oldPassword,
        password: newPassword,
      });

      updateUser(data);
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingSecurity(false);
    }
  };

  // Reusable tokens
  const inputBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
  const labelBase = 'block text-[11px] font-semibold text-slate-700 mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal information and security.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">

        {/* ===================== SIDEBAR TABS ===================== */}
        <div className="w-full md:w-64 bg-slate-50 p-3 sm:p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'personal'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
            >
              <HiOutlineUser className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Personal Info</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'security'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
            >
              <HiOutlineLockClosed className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Security</span>
            </button>
          </div>
        </div>

        {/* ===================== CONTENT AREA ===================== */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 min-w-0">
          {activeTab === 'personal' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-5 sm:mb-6 border-b border-slate-200 pb-3">
                Personal Information
              </h2>

              <form onSubmit={handlePersonalSubmit} className="space-y-4 sm:space-y-5 max-w-lg">

                {/* Profile Picture */}
                <div className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center gap-4 sm:gap-6 mb-2">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 border-2 border-indigo-200 overflow-hidden flex items-center justify-center">
                      {preview ? (
                        <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                      ) : user?.profilePicture ? (
                        <img
                          src={`${API_BASE_URL}${user.profilePicture}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl sm:text-3xl text-indigo-600 font-bold">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white border-2 border-white transition-colors shadow-sm cursor-pointer"
                      title="Upload photo"
                      aria-label="Upload photo"
                    >
                      <HiOutlineCamera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-slate-900 font-semibold text-sm">Profile Picture</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Upload a new avatar. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputBase}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className={labelBase}>
                    Email Address{' '}
                    <span className="text-slate-400 text-[10px] font-normal normal-case">
                      (read-only)
                    </span>
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-500 text-sm outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className={labelBase}>Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputBase}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPersonal}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {savingPersonal && (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>{savingPersonal ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-5 sm:mb-6 border-b border-slate-200 pb-3">
                Security Settings
              </h2>

              <form onSubmit={handleSecuritySubmit} className="space-y-4 max-w-lg">
                <div>
                  <label className={labelBase}>Current Password *</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={inputBase}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className={labelBase}>New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputBase}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className={labelBase}>Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputBase}
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSecurity}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {savingSecurity && (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>{savingSecurity ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;