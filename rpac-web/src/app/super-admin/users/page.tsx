'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter,
  ChevronLeft,
  UserCog,
  Shield,
  User,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
  Key,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  user_tier: string;
  license_type: string;
  license_expires_at: string | null;
  is_license_active: boolean;
  created_at: string;
  community_count: number;
  community_names: string | null;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newTier, setNewTier] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, tierFilter, users]);

  async function loadUsers() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.error('❌ No current user found');
        return;
      }

      console.log('🔍 Calling get_all_users for user:', currentUser.id);

      // Call RPC function to get all users
      const { data, error } = await supabase.rpc('get_all_users', {
        p_admin_user_id: currentUser.id,
        p_tier_filter: null,
        p_limit: 1000,
        p_offset: 0
      });

      if (error) {
        console.error('❌ RPC Error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Users loaded successfully:', data?.length || 0);
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(query) ||
        user.display_name?.toLowerCase().includes(query)
      );
    }

    // Apply tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(user => user.user_tier === tierFilter);
    }

    setFilteredUsers(filtered);
  }

  function openEditModal(user: UserProfile) {
    setSelectedUser(user);
    setNewTier(user.user_tier);
    setShowEditModal(true);
  }

  function openPasswordModal(user: UserProfile) {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  }

  function openResetModal(user: UserProfile) {
    setSelectedUser(user);
    setShowResetModal(true);
  }

  async function handleUpgradeTier() {
    if (!selectedUser || !newTier) return;

    setSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Call upgrade function
      const { error } = await supabase.rpc('upgrade_user_tier', {
        p_target_user_id: selectedUser.user_id,
        p_new_tier: newTier,
        p_admin_user_id: currentUser.id
      });

      if (error) throw error;

      // Reload users
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error upgrading user tier:', error);
      alert(error.message || t('admin.messages.upgrade_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!selectedUser || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      alert(t('admin.messages.password_mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      alert(t('admin.messages.password_too_short'));
      return;
    }

    setSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Use Supabase Admin API to update user password
      const { error } = await supabase.auth.admin.updateUserById(selectedUser.user_id, {
        password: newPassword
      });

      if (error) throw error;

      alert(t('admin.messages.password_changed'));
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || t('admin.messages.password_change_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedUser) return;

    setSaving(true);
    try {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      alert(t('admin.messages.password_reset_sent'));
      setShowResetModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(error.message || t('admin.messages.password_reset_error'));
    } finally {
      setSaving(false);
    }
  }

  function getTierBadge(tier: string) {
    switch (tier) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <Shield className="w-3 h-3" />
            {t('admin.user_tiers.super_admin')}
          </span>
        );
      case 'community_manager':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <UserCog className="w-3 h-3" />
            {t('admin.user_tiers.community_manager')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            <User className="w-3 h-3" />
            {t('admin.user_tiers.individual')}
          </span>
        );
    }
  }

  function getLicenseStatus(user: UserProfile) {
    if (!user.is_license_active) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
          <XCircle className="w-3 h-3" />
          Inaktiv
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="w-3 h-3" />
        Aktiv
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3D4A2B]/20 border-t-[#3D4A2B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{t('admin.user_management.loading_users')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2A331E] to-[#3D4A2B] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/super-admin" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ChevronLeft className="w-5 h-5" />
            {t('admin.actions.back')}
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-10 h-10" />
            <h1 className="text-3xl font-bold">{t('admin.user_management.title')}</h1>
          </div>
          <p className="text-white/80 text-lg">
            {t('admin.user_management.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.user_management.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
              />
            </div>

            {/* Tier Filter */}
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{t('admin.user_management.all_tiers')}</option>
                <option value="individual">{t('admin.user_tiers.individual')}</option>
                <option value="community_manager">{t('admin.user_tiers.community_manager')}</option>
                <option value="super_admin">{t('admin.user_tiers.super_admin')}</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Visar {filteredUsers.length} av {users.length} {t('admin.user_management.user_count')}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-1/4 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('admin.tables.email')}
                  </th>
                  <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('admin.tables.name')}
                  </th>
                  <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('admin.tables.tier')}
                  </th>
                  <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('admin.tables.license')}
                  </th>
                  <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('admin.tables.community')}
                  </th>
                  <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('admin.tables.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate" title={user.email}>
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 truncate" title={user.display_name || '-'}>
                        {user.display_name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getTierBadge(user.user_tier)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600 truncate" title={user.license_type}>
                          {user.license_type}
                        </span>
                        {getLicenseStatus(user)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium">{user.community_count} samhällen</span>
                          {user.community_names && (
                            <span className="text-xs text-gray-500 truncate" title={user.community_names}>
                              {user.community_names}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center justify-center w-8 h-8 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors flex-shrink-0"
                          title={t('admin.actions.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="inline-flex items-center justify-center w-8 h-8 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0"
                          title={t('admin.actions.change_password')}
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openResetModal(user)}
                          className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                          title={t('admin.actions.reset_password')}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{t('admin.user_management.no_users')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('admin.user_management.edit_user')}
            </h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">{t('admin.tables.email')}</p>
              <p className="text-lg font-medium text-gray-900">{selectedUser.email}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.tables.tier')}
              </label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
              >
                <option value="individual">{t('admin.user_tiers.individual')}</option>
                <option value="community_manager">{t('admin.user_tiers.community_manager')}</option>
                <option value="super_admin">{t('admin.user_tiers.super_admin')}</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {t(`admin.user_tiers.description.${newTier}`)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('admin.actions.cancel')}
              </button>
              <button
                onClick={handleUpgradeTier}
                disabled={saving || newTier === selectedUser.user_tier}
                className="flex-1 px-4 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('admin.messages.loading') : t('admin.actions.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('admin.password.change_title')}
            </h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">{t('admin.tables.email')}</p>
              <p className="text-lg font-medium text-gray-900">{selectedUser.email}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.password.new_password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent pr-10"
                  placeholder={t('admin.password.enter_new_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.password.confirm_password')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent pr-10"
                  placeholder={t('admin.password.confirm_new_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('admin.actions.cancel')}
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('admin.messages.loading') : t('admin.actions.change_password')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('admin.password.reset_title')}
            </h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">{t('admin.tables.email')}</p>
              <p className="text-lg font-medium text-gray-900">{selectedUser.email}</p>
            </div>

            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {t('admin.password.reset_warning')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('admin.actions.cancel')}
              </button>
              <button
                onClick={handleResetPassword}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('admin.messages.loading') : t('admin.actions.reset_password')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

