import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, X, Eye, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { usePageReveal, SectionCard, InfoField, DetailGrid, EmptyState, subtleBtn } from '../../components/customer/ui';
import { WorkspaceHeader, SearchInput, FilterTabs, TableCard, TableHead, Th } from '../../components/insurer/ui';
import { AdminStatusBadge } from '../../components/admin/ui';

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export const AdminInsurersPage = () => {
  const navigate = useNavigate();
  const [insurers, setInsurers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Insurer for Detail Modal
  const [selectedInsurer, setSelectedInsurer] = useState(null);

  // Reject / Suspend Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null, // 'REJECT' | 'SUSPEND'
    insurerId: null,
    companyName: '',
    reason: '',
  });

  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchInsurers = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'ALL' ? '/admin/insurers' : `/admin/insurers?status=${statusFilter}`;
      const res = await api.get(url);
      setInsurers(res.data);
    } catch (err) {
      console.error('Failed to fetch insurers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsurers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleApprove = async (id, companyName) => {
    try {
      setProcessing(true);
      await api.patch(`/admin/insurers/${id}/approve`);
      showToast(`Insurer "${companyName}" approved successfully.`);
      fetchInsurers();
    } catch (err) {
      console.error('Failed to approve insurer:', err);
      alert('Failed to approve insurer.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReinstate = async (id, companyName) => {
    try {
      setProcessing(true);
      await api.patch(`/admin/insurers/${id}/reinstate`);
      showToast(`Insurer "${companyName}" reinstated to APPROVED status.`);
      fetchInsurers();
    } catch (err) {
      console.error('Failed to reinstate insurer:', err);
      alert('Failed to reinstate insurer.');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (type, id, companyName) => {
    setActionModal({ isOpen: true, type, insurerId: id, companyName, reason: '' });
  };

  const closeActionModal = () =>
    setActionModal({ isOpen: false, type: null, insurerId: null, companyName: '', reason: '' });

  const handleConfirmActionModal = async (e) => {
    e.preventDefault();
    if (!actionModal.reason.trim()) {
      alert('Please provide a valid reason.');
      return;
    }
    setProcessing(true);
    try {
      if (actionModal.type === 'REJECT') {
        await api.patch(`/admin/insurers/${actionModal.insurerId}/reject`, {
          rejection_reason: actionModal.reason.trim(),
        });
        showToast(`Insurer "${actionModal.companyName}" rejected.`);
      } else if (actionModal.type === 'SUSPEND') {
        await api.patch(`/admin/insurers/${actionModal.insurerId}/suspend`, {
          suspension_reason: actionModal.reason.trim(),
        });
        showToast(`Insurer "${actionModal.companyName}" suspended.`);
      }
      closeActionModal();
      fetchInsurers();
    } catch (err) {
      console.error('Action modal failed:', err);
      alert(err.response?.data?.detail || 'Action failed.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredInsurers = insurers.filter((ins) => {
    const q = searchTerm.toLowerCase();
    return (
      ins.company_name.toLowerCase().includes(q) ||
      ins.license_number.toLowerCase().includes(q) ||
      ins.email.toLowerCase().includes(q) ||
      ins.full_name.toLowerCase().includes(q)
    );
  });

  const { scope } = usePageReveal([loading]);

  const actionBtn =
    'rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer';

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      <WorkspaceHeader
        title="Insurer verification"
        subtitle="Review vendor registrations, approve licenses, and manage account status."
      >
        {toastMsg && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {toastMsg}
          </div>
        )}
      </WorkspaceHeader>

      {/* Toolbar */}
      <div className="lp-reveal-d flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search company, license, email…"
          className="sm:flex-1"
        />
        <FilterTabs value={statusFilter} onChange={setStatusFilter} options={FILTER_OPTIONS} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : filteredInsurers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No insurers found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No vendors match your filter criteria.'
              : 'No insurer vendors have registered yet.'
          }
        />
      ) : (
        <TableCard>
          <TableHead>
            <tr>
              <Th>Company</Th>
              <Th>Representative</Th>
              <Th>License</Th>
              <Th>Status</Th>
              <Th>Location</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredInsurers.map((ins) => (
              <tr key={ins.id} className="transition-colors hover:bg-slate-50/80">
                <td className="max-w-[220px] px-4 py-3.5">
                  <p className="truncate font-semibold text-slate-900">{ins.company_name}</p>
                  {ins.rejection_reason && (
                    <p className="mt-0.5 truncate text-[10px] italic text-rose-600" title={ins.rejection_reason}>
                      Reason: {ins.rejection_reason}
                    </p>
                  )}
                </td>
                <td className="max-w-[200px] px-4 py-3.5">
                  <p className="truncate text-slate-800">{ins.full_name}</p>
                  <p className="truncate text-[11px] text-slate-500">{ins.email}</p>
                </td>
                <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">{ins.license_number}</td>
                <td className="px-4 py-3.5">
                  <AdminStatusBadge status={ins.verification_status} />
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {ins.city || 'N/A'}{ins.state ? `, ${ins.state}` : ''}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedInsurer(ins)}
                      className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 cursor-pointer"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {ins.verification_status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(ins.user_id, ins.company_name)}
                          disabled={processing}
                          className={`${actionBtn} bg-emerald-600 hover:bg-emerald-700`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openActionModal('REJECT', ins.user_id, ins.company_name)}
                          disabled={processing}
                          className={`${actionBtn} bg-rose-600 hover:bg-rose-700`}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {ins.verification_status === 'APPROVED' && (
                      <button
                        onClick={() => openActionModal('SUSPEND', ins.user_id, ins.company_name)}
                        disabled={processing}
                        className={`${actionBtn} bg-amber-600 hover:bg-amber-700`}
                      >
                        Suspend
                      </button>
                    )}

                    {(ins.verification_status === 'REJECTED' || ins.verification_status === 'SUSPENDED') && (
                      <button
                        onClick={() => handleReinstate(ins.user_id, ins.company_name)}
                        disabled={processing}
                        className={`${actionBtn} bg-blue-600 hover:bg-blue-700`}
                      >
                        Reinstate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {/* Reject / Suspend Reason Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {actionModal.type === 'REJECT' ? 'Reject insurer application' : 'Suspend insurer account'}
              </h3>
              <button onClick={closeActionModal} className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Provide a clear reason for {actionModal.type === 'REJECT' ? 'rejecting' : 'suspending'} vendor{' '}
              <strong className="text-slate-900">"{actionModal.companyName}"</strong>.
            </p>
            <form onSubmit={handleConfirmActionModal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionModal.reason}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  placeholder="Enter reason…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeActionModal} className={subtleBtn}>Cancel</button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`${actionBtn} px-4 py-2.5 ${
                    actionModal.type === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirm {actionModal.type === 'REJECT' ? 'rejection' : 'suspension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedInsurer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Building2 className="h-5 w-5 text-blue-600" /> Insurer vendor record
              </h3>
              <button onClick={() => setSelectedInsurer(null)} className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-900">{selectedInsurer.company_name}</p>
                <p className="font-mono text-xs text-slate-500">{selectedInsurer.license_number}</p>
              </div>
              <AdminStatusBadge status={selectedInsurer.verification_status} size="lg" />
            </div>

            <DetailGrid cols={2}>
              <InfoField label="Representative" value={selectedInsurer.full_name} />
              <InfoField label="Account email" value={selectedInsurer.email} />
              <InfoField label="Phone" value={selectedInsurer.phone || 'N/A'} />
              <InfoField
                label="Location"
                value={`${selectedInsurer.city || 'N/A'}${selectedInsurer.state ? `, ${selectedInsurer.state}` : ''}`}
              />
            </DetailGrid>

            {selectedInsurer.description && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Description</p>
                <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">{selectedInsurer.description}</p>
              </div>
            )}

            {selectedInsurer.rejection_reason && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-800">
                <span className="font-semibold">Rejection / suspension reason:</span>
                <p className="mt-1">{selectedInsurer.rejection_reason}</p>
              </div>
            )}

            <div className="flex justify-between gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  const id = selectedInsurer.user_id;
                  setSelectedInsurer(null);
                  navigate(`/admin/insurers/${id}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" /> Open full record
              </button>
              <button onClick={() => setSelectedInsurer(null)} className={subtleBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInsurersPage;
