import { FaBell } from 'react-icons/fa';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  Loader2,
  LogOut,
  ShieldCheck,
  UsersRound,
  XCircle,
  Trash2,
  RotateCcw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config.js';

const statusStyles = {
  Pending: {
    label: 'Pending',
    icon: Clock3,
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  Tech_Round: {
    label: 'Tech Round',
    icon: ShieldCheck,
    className: 'bg-sky-50 text-sky-800 ring-sky-200',
  },
  Interview: {
    label: 'Interview',
    icon: UsersRound,
    className: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  },
  Voting: {
    label: 'Voting',
    icon: BadgeCheck,
    className: 'bg-violet-50 text-violet-800 ring-violet-200',
  },
  Approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  Rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-rose-50 text-rose-800 ring-rose-200',
  },
};

const formatNumber = new Intl.NumberFormat('en-IN');

const normalizeOrganization = (organization) => ({
  id: organization._id || organization.id,
  name: organization.name,
  type: organization.type,
  maxCapacity: Number(organization.max_capacity || organization.maxCapacity || 0),
  acceptedMembers: Number(organization.accepted_members || organization.acceptedMembers || 0),
  facultyCoordinator: organization.faculty_coordinator || organization.facultyCoordinator || '',
  studentHead: organization.student_head || organization.studentHead || null,
});

const normalizeApplication = (application) => ({
  id: application._id || application.id,
  organizationId:
    application.organization?._id || application.organization?.id || application.organization,
  organizationName: application.organization?.name || application.organization_name || 'Committee/Club',
  applicantName: application.user?.full_name || application.student?.full_name || application.full_name || 'Student Applicant',
  applicantRollNumber: application.user?.Roll_Number || application.student?.Roll_Number || application.Roll_Number || 'N/A',
  applicantRole: application.user?.role || application.student?.role || application.role || 'Student',
  status: application.status || 'Pending',
  remarks: application.remarks || '',
  updatedAt: application.updatedAt,
});

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <motion.article variants={itemVariants} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal text-institute-ink">
            {value}
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-institute-blue">
          <Icon aria-hidden="true" size={24} />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{detail}</p>
    </motion.article>
  );
}

function StatusPill({ status, count }) {
  const config = statusStyles[status] || statusStyles.Pending;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ${config.className}`}
    >
      <Icon aria-hidden="true" size={16} />
      <span>{config.label}</span>
      <span>{formatNumber.format(count)}</span>
    </div>
  );
}

function CommitteeClubCard({ organization, application, onApply, isApplying, canApply }) {
  const filledPercentage =
    organization.maxCapacity > 0
      ? Math.min(100, Math.round((organization.acceptedMembers / organization.maxCapacity) * 100))
      : 0;
  const isFull =
    organization.maxCapacity > 0 && organization.acceptedMembers >= organization.maxCapacity;
  const statusConfig = application ? statusStyles[application.status] : null;
  const StatusIcon = statusConfig?.icon;
  const headName =
    typeof organization.studentHead === 'object' && organization.studentHead
      ? organization.studentHead.full_name
      : 'Student council review';

  return (
    <motion.article variants={itemVariants} className="flex min-h-[300px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-institute-blue hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-normal ${
              organization.type === 'Committee'
                ? 'bg-cardinal-50 text-cardinal-700'
                : 'bg-blue-50 text-institute-blue'
            }`}
          >
            {organization.type}
          </span>
          <h3 className="mt-4 text-xl font-bold leading-7 tracking-normal text-institute-ink">
            {organization.name}
          </h3>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
          {organization.type === 'Committee' ? (
            <ShieldCheck aria-hidden="true" size={24} />
          ) : (
            <GraduationCap aria-hidden="true" size={24} />
          )}
        </span>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Faculty Coordinator</dt>
          <dd className="text-right font-medium text-slate-700">
            {organization.facultyCoordinator}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Student Head</dt>
          <dd className="text-right font-medium text-slate-700">{headName}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
          <span className="font-medium text-slate-600">Seat Capacity</span>
          <span className="font-semibold text-institute-ink">
            {formatNumber.format(organization.acceptedMembers)}/
            {formatNumber.format(organization.maxCapacity)} Seats Filled
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${filledPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isFull ? 'bg-cardinal-600' : 'bg-institute-blue'
            }`}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        {application && statusConfig ? (
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ring-1 w-full justify-center ${statusConfig.className}`}
          >
            <StatusIcon aria-hidden="true" size={16} />
            {statusConfig.label} Status
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => onApply(organization.id)}
          disabled={!canApply || Boolean(application) || isFull || isApplying}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-institute-navy px-4 text-sm font-semibold text-white transition-all hover:bg-institute-blue focus:outline-none focus:ring-2 focus:ring-institute-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          aria-label={`Apply for ${organization.name}`}
        >
          {isApplying ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : null}
          <span>
            {!canApply
              ? 'Review Access Only'
              : isApplying
                ? 'Submitting Application'
                : 'Apply for Selection Process'}
          </span>
          {!isApplying ? <ArrowUpRight aria-hidden="true" size={17} /> : null}
        </button>
      </div>
    </motion.article>
  );
}

function ReviewPanel({ applications, onStatusChange, onDeleteApplication, loadingActionId }) {
  const actions = ['Tech_Round', 'Interview', 'Voting', 'Approved', 'Rejected'];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-normal text-institute-ink">
            Applicant Review
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Head and faculty workflow for selection rounds.
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-institute-blue">
          <ClipboardList aria-hidden="true" size={24} />
        </span>
      </div>

      {applications.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="whitespace-nowrap px-3 py-3 font-semibold">Applicant</th>
                <th className="whitespace-nowrap px-3 py-3 font-semibold">Committee / Club</th>
                <th className="whitespace-nowrap px-3 py-3 font-semibold">Status</th>
                <th className="whitespace-nowrap px-3 py-3 font-semibold">Action & Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((application) => {
                const config = statusStyles[application.status] || statusStyles.Pending;
                const StatusIcon = config.icon;

                return (
                  <tr key={application.id} className="align-top hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-institute-ink">
                        {application.applicantName}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {application.applicantRollNumber}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-700">
                        {application.organizationName}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ${config.className}`}
                      >
                        <StatusIcon aria-hidden="true" size={14} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {actions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            disabled={
                              loadingActionId === application.id ||
                              application.status === 'Approved' ||
                              application.status === action
                            }
                            onClick={() => onStatusChange(application.id, action)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-institute-blue hover:text-institute-blue disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 shadow-sm"
                          >
                            {statusStyles[action]?.label || action}
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={loadingActionId === application.id}
                          onClick={() => onDeleteApplication(application.id)}
                          className="p-2 ml-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:text-cardinal-600 hover:bg-cardinal-50 hover:border-cardinal-200 transition-all shadow-sm"
                          title="Delete Application"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center bg-slate-50">
          <p className="font-semibold text-institute-ink">No applications submitted</p>
          <p className="mt-2 text-sm text-slate-500">Applicant records will appear here.</p>
        </div>
      )}
    </motion.section>
  );
}

function Dashboard({ session, onLogout, onSessionUpdate }) {
  const [organizations, setOrganizations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reviewApplications, setReviewApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingOrganizationId, setApplyingOrganizationId] = useState(null);
  const [reviewActionId, setReviewActionId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [reports, setReports] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNoticeIds, setReadNoticeIds] = useState([]);

  // Undo Delete States for Applications
  const [lastDeletedApp, setLastDeletedApp] = useState(null);
  const [showAppUndoBanner, setShowAppUndoBanner] = useState(false);

  const token = session?.token;
  const user = session?.user;
  const userRef = useRef(user);
  userRef.current = user;
  
  const isModerator = user?.organizationMemberships?.some((m) => m.canModerate === true);
  const canReview = user?.role === 'Head' || isModerator;
  const canApply = ['Student', 'Head'].includes(user?.role);

  const unreadCount = useMemo(() => {
    return announcements.filter(item => !readNoticeIds.includes(item._id)).length;
  }, [announcements, readNoticeIds]);

  useEffect(() => {
    if (!showProfile && !showNotifications) return;
    
    const handleGlobalClickDismissal = (e) => {
      if (!e.target.closest('.profile-menu-container') && !e.target.closest('.notif-menu-container')) {
        setShowProfile(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleGlobalClickDismissal);
    return () => document.removeEventListener('mousedown', handleGlobalClickDismissal);
  }, [showProfile, showNotifications]);

  const request = useCallback(
    async (path, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || 'Request failed');
      }

      return payload;
    },
    [token]
  );
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let liveUser = userRef.current;

      if (token) {
        const meResponse = await request('/auth/me');
        liveUser = meResponse.data?.user || userRef.current;
        if (liveUser && onSessionUpdate) {
          onSessionUpdate(liveUser);
        }
      }

      const liveCanReview =
        liveUser?.role === 'Head' ||
        Boolean(liveUser?.organizationMemberships?.some((m) => m.canModerate === true));

      const organizationsResponse = await request('/organizations');
      setOrganizations((organizationsResponse.data || []).map(normalizeOrganization));
      const announcementsResponse = await request('/announcements');
      setAnnouncements(announcementsResponse.data || []);
      const reportsResponse = await request('/reports');
      setReports(reportsResponse.data || []);

      if (token) {
        const applicationsResponse = await request('/applications/me');
        setApplications((applicationsResponse.data || []).map(normalizeApplication));

        if (liveCanReview) {
          const reviewApplicationsResponse = await request('/applications');
          const parsedApps = (reviewApplicationsResponse.data || []).map(normalizeApplication);
          setReviewApplications(parsedApps);
        } else {
          setReviewApplications([]);
        }
      } else {
        setApplications([]);
        setReviewApplications([]);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [onSessionUpdate, request, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const applicationByOrganization = useMemo(() => {
    return applications.reduce((map, application) => {
      map.set(String(application.organizationId), application);
      return map;
    }, new Map());
  }, [applications]);

  const statusCounts = useMemo(() => {
    return applications.reduce((counts, application) => {
      counts[application.status] = (counts[application.status] || 0) + 1;
      return counts;
    }, {});
  }, [applications]);

  const stats = useMemo(() => {
    const committees = organizations.filter((organization) => organization.type === 'Committee');
    const clubs = organizations.filter((organization) => organization.type === 'Club');
    const filledSeats = organizations.reduce(
      (total, organization) => total + organization.acceptedMembers,
      0
    );
    const totalSeats = organizations.reduce(
      (total, organization) => total + organization.maxCapacity,
      0
    );

    return {
      totalOrganizations: organizations.length,
      clubs: clubs.length,
      committees: committees.length,
      filledSeats,
      totalSeats,
      activeApplications: applications.filter((application) =>
        ['Pending', 'Tech_Round', 'Interview', 'Voting'].includes(application.status)
      ).length,
    };
  }, [applications, organizations]);

  const handleApply = async (organizationId) => {
    setNotice('');
    setError('');

    if (!token) {
      setError('Sign in with a student account before applying for a selection process.');
      return;
    }

    if (!canApply) {
      setError('Faculty accounts review applications and cannot submit student applications.');
      return;
    }

    setApplyingOrganizationId(organizationId);

    try {
      const response = await request('/applications', {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      });

      setApplications((current) => [normalizeApplication(response.data), ...current]);
      setNotice(response.message || 'Application submitted for the selection process.');
    } catch (applyError) {
      setError(applyError.message);
    } finally {
      setApplyingOrganizationId(null);
    }
  };

  const handleReviewStatus = async (applicationId, status) => {
    setNotice('');
    setError('');
    setReviewActionId(applicationId);

    try {
      const path =
        status === 'Approved'
          ? `/applications/${applicationId}/approve`
          : `/applications/${applicationId}/status`;
      const response = await request(path, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      const updatedApplication = normalizeApplication(response.data);

      setReviewApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? updatedApplication : application
        )
      );
      setNotice(response.message || 'Application updated.');
      await loadDashboard();
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setReviewActionId(null);
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to remove this application record?')) return;
    setNotice('');
    setError('');
    setReviewActionId(applicationId);

    try {
      const response = await request(`/applications/${applicationId}`, {
        method: 'DELETE',
      });

      const deletedItem = reviewApplications.find((app) => app.id === applicationId);
      if (deletedItem) {
        setLastDeletedApp(response.data);
        setShowAppUndoBanner(true);
        setTimeout(() => setShowAppUndoBanner(false), 10000);
      }

      setReviewApplications((current) =>
        current.filter((application) => application.id !== applicationId)
      );
      setNotice('Application deleted. You can undo this action if needed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewActionId(null);
    }
  };

  const handleUndoDeleteApplication = async () => {
    if (!lastDeletedApp) return;
    try {
      await request('/applications', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: lastDeletedApp.organization,
          remarks: lastDeletedApp.remarks || ''
        }),
      });

      setShowAppUndoBanner(false);
      setLastDeletedApp(null);
      await loadDashboard();
      setNotice('Application restored successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      const allIds = announcements.map(item => item._id);
      setReadNoticeIds(allIds);
    }
    setShowNotifications(!showNotifications);
  };

  return (
    <main className="min-h-screen bg-institute-mist font-sans relative">
      
      {/* --- UNDO TOAST BANNER --- */}
      {showAppUndoBanner && lastDeletedApp && (
        <div className="fixed top-6 right-6 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 border border-slate-700 max-w-sm">
          <div>
            <p className="text-sm font-semibold">Application Removed</p>
            <p className="text-xs text-slate-400 mt-0.5">Need it back? Revert this deletion instantly.</p>
          </div>
          <button 
            onClick={handleUndoDeleteApplication}
            className="bg-institute-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow"
          >
            <RotateCcw size={13} />
            Undo Action
          </button>
          <button onClick={() => setShowAppUndoBanner(false)} className="text-slate-400 hover:text-white transition pl-1">
            <X size={16} />
          </button>
        </div>
      )}

      <header className="border-b border-slate-200 bg-white relative z-40 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-xs font-bold uppercase tracking-wider text-cardinal-700 mb-1">
              SIESCOMS Committees & Clubs
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-institute-ink sm:text-4xl">
              CampusConnect
            </h1>
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 max-w-md shadow-sm">
              <p className="text-sm font-semibold text-slate-800">
                {user?.role === 'Admin' && `System Administrator: ${user.full_name}`}
                {user?.role === 'Faculty' && `${user.full_name} (Faculty Coordinator)`}
                {user?.role === 'Head' && `${user.full_name} (Committee Head)`}
                {user?.role === 'Student' && isModerator && `${user.full_name} (${user.organizationMemberships.find(m => m.canModerate)?.title || 'Point of Contact'})`}
                {user?.role === 'Student' && !isModerator && `Welcome, ${user.full_name}`}
              </p>
              <p className="text-[11px] text-slate-500 font-bold tracking-wider mt-1 uppercase">
                Session ID: {user?.role === 'Admin' || user?.role === 'Faculty' ? 'CORE_ACCESS' : user?.Roll_Number}
              </p>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            
            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm text-slate-700 shadow-sm transition-all"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-institute-navy text-white font-bold shadow-sm">
                  {user?.full_name?.charAt(0)}
                </div>
                <span className="font-semibold">
                  {user?.full_name}
                </span>
                <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                  {user?.role}
                </span>
              </button>
              <AnimatePresence>
                {showProfile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl z-50"
                  >
                    <h3 className="font-bold text-institute-ink mb-4 border-b border-slate-100 pb-2">
                      My Profile
                    </h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p><strong className="text-institute-ink">Name:</strong> {user?.full_name}</p>
                      <p><strong className="text-institute-ink">Roll No:</strong> {user?.Roll_Number || 'N/A'}</p>
                      <p><strong className="text-institute-ink">Email:</strong> {user?.email}</p>
                      <p><strong className="text-institute-ink">Role:</strong> {user?.role}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative notif-menu-container">
              <button 
                onClick={handleToggleNotifications}
                className="relative p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
              >
                <FaBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-cardinal-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-5 z-50 max-h-96 overflow-y-auto"
                  >
                    <h3 className="font-bold text-institute-ink mb-3 border-b border-slate-100 pb-2">
                      Announcements
                    </h3>
                    {announcements.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-lg">No announcements published</p>
                    ) : (
                      announcements.map((item) => (
                        <div key={item._id} className="border-b border-slate-100 last:border-b-0 py-3">
                          <h4 className="font-bold text-institute-ink">{item.title}</h4>
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.content}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-cardinal-200 hover:bg-cardinal-50 hover:text-cardinal-700"
            >
              <LogOut aria-hidden="true" size={18} />
              Sign Out
            </button>
          </motion.div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <AnimatePresence>
          {notice && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }} 
              className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm"
            >
              {notice}
            </motion.div>
          )}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }} 
              className="mb-6 rounded-xl border border-cardinal-200 bg-cardinal-50 px-5 py-4 text-sm font-medium text-cardinal-700 shadow-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            icon={Building2}
            label="Total Active Committees/Clubs"
            value={formatNumber.format(stats.totalOrganizations)}
            detail={`${formatNumber.format(stats.clubs)} clubs and ${formatNumber.format(
              stats.committees
            )} committees available.`}
          />
          <StatCard
            icon={UsersRound}
            label="Seat Allocation"
            value={`${formatNumber.format(stats.filledSeats)}/${formatNumber.format(
              stats.totalSeats
            )}`}
            detail="Approved memberships recorded across active committees."
          />
          <StatCard
            icon={Clock3}
            label="Active Applications"
            value={formatNumber.format(stats.activeApplications)}
            detail="Applications currently moving through selection rounds."
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved Applications"
            value={formatNumber.format(statusCounts.Approved || 0)}
            detail="Final approvals reflected in student profiles."
          />
        </motion.div>
      
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-normal text-institute-ink">
                Application Status Tracker
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Selection progress across pending, review, and final decision stages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.keys(statusStyles).map((status) => (
                <StatusPill key={status} status={status} count={statusCounts[status] || 0} />
              ))}
            </div>
          </div>
        </motion.div>

        {canReview ? (
          <ReviewPanel
            applications={reviewApplications}
            onStatusChange={handleReviewStatus}
            onDeleteApplication={handleDeleteApplication}
            loadingActionId={reviewActionId}
          />
        ) : null}
        
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-institute-ink mb-6">
            Reports & Documents
          </h2>
          {reports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center bg-slate-50">
              <p className="text-sm font-medium text-slate-500">No reports uploaded to the repository.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="border border-slate-200 rounded-xl p-5 flex justify-between items-center bg-slate-50 hover:bg-white hover:border-institute-blue transition-all shadow-sm"
                >
                  <div>
                    <h3 className="font-bold text-institute-ink">
                      {report.title}
                    </h3>
                    <p className="text-sm font-semibold text-institute-blue mt-1">
                      {report.organization?.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Uploaded by: <span className="font-medium text-slate-700">{report.uploadedBy?.full_name}</span>
                    </p>
                  </div>
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-institute-navy text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-institute-blue hover:shadow transition-all"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <section className="mt-12">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-institute-ink">
                Available Committees & Clubs
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Apply into the formal selection workflow and track each round from one unified portal.
              </p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-institute-blue hover:text-institute-blue"
            >
              Refresh Directory
            </button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[300px] animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex justify-between">
                    <div className="h-6 w-20 rounded-md bg-slate-100" />
                    <div className="h-12 w-12 rounded-xl bg-slate-100" />
                  </div>
                  <div className="mt-4 h-8 w-3/4 rounded-lg bg-slate-100" />
                  <div className="mt-8 space-y-4">
                    <div className="h-4 w-full rounded bg-slate-100" />
                    <div className="h-4 w-full rounded bg-slate-100" />
                    <div className="h-2 w-full rounded-full bg-slate-100 mt-6" />
                  </div>
                </div>
              ))}
            </div>
          ) : organizations.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {organizations.map((organization) => (
                <CommitteeClubCard
                  key={organization.id}
                  organization={organization}
                  application={applicationByOrganization.get(String(organization.id))}
                  onApply={handleApply}
                  isApplying={applyingOrganizationId === organization.id}
                  canApply={canApply}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm"
            >
              <Building2 aria-hidden="true" className="mx-auto text-slate-400" size={48} />
              <h3 className="mt-5 text-xl font-bold text-institute-ink">
                No active committees/clubs found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Administrators must provision committees in the database to open the selection workflow.
              </p>
            </motion.div>
          )}
        </section>
      </section>
    </main>
  );
}

export default Dashboard;