import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  ShieldCheck,
  UsersRound,
  XCircle,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('campusconnect_token');
};

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
  organizationName: application.organization?.name || 'Organization',
  status: application.status,
  updatedAt: application.updatedAt,
});

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal text-institute-ink">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-institute-navy text-white">
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{detail}</p>
    </article>
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

function OrganizationCard({ organization, application, onApply, isApplying }) {
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
    <article className="flex min-h-[292px] flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift">
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
          <h3 className="mt-4 text-xl font-semibold leading-7 tracking-normal text-institute-ink">
            {organization.name}
          </h3>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-institute-blue">
          {organization.type === 'Committee' ? (
            <ShieldCheck aria-hidden="true" size={20} />
          ) : (
            <GraduationCap aria-hidden="true" size={20} />
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
          <div
            className={`h-full rounded-full ${
              isFull ? 'bg-cardinal-600' : 'bg-institute-blue'
            }`}
            style={{ width: `${filledPercentage}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        {application && statusConfig ? (
          <div
            className={`mb-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ${statusConfig.className}`}
          >
            <StatusIcon aria-hidden="true" size={16} />
            {statusConfig.label}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => onApply(organization.id)}
          disabled={Boolean(application) || isFull || isApplying}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-institute-navy px-4 text-sm font-semibold text-white transition hover:bg-institute-blue focus:outline-none focus:ring-2 focus:ring-institute-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          aria-label={`Apply for ${organization.name}`}
        >
          {isApplying ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : null}
          <span>{isApplying ? 'Submitting Application' : 'Apply for Selection Process'}</span>
          {!isApplying ? <ArrowUpRight aria-hidden="true" size={17} /> : null}
        </button>
      </div>
    </article>
  );
}

function Dashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingOrganizationId, setApplyingOrganizationId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const token = getAuthToken();

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
      const organizationsResponse = await request('/organizations');
      setOrganizations((organizationsResponse.data || []).map(normalizeOrganization));

      if (token) {
        const applicationsResponse = await request('/applications/me');
        setApplications((applicationsResponse.data || []).map(normalizeApplication));
      } else {
        setApplications([]);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [request, token]);

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

  return (
    <main className="min-h-screen bg-institute-mist">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-cardinal-700">
              SIESCOMS Committees & Clubs
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-institute-ink sm:text-4xl">
              CampusConnect
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Building2 aria-hidden="true" size={18} className="text-institute-blue" />
            <span className="font-medium">Academic Year 2026</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        {notice ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mb-6 rounded-lg border border-cardinal-600/20 bg-cardinal-50 px-4 py-3 text-sm font-medium text-cardinal-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Total Active Organizations"
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
            detail="Approved memberships recorded across active organizations."
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
        </div>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-institute-ink">
                Application Status Tracker
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Selection progress across pending, review, and final decision stages.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(statusStyles).map((status) => (
                <StatusPill key={status} status={status} count={statusCounts[status] || 0} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal text-institute-ink">
                Available Clubs & Committees
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Apply into the formal selection workflow and track each round from one portal.
              </p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-institute-blue hover:text-institute-blue focus:outline-none focus:ring-2 focus:ring-institute-blue focus:ring-offset-2"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[292px] animate-pulse rounded-lg border border-slate-200 bg-white p-5"
                >
                  <div className="h-5 w-24 rounded bg-slate-100" />
                  <div className="mt-5 h-7 w-3/4 rounded bg-slate-100" />
                  <div className="mt-8 space-y-3">
                    <div className="h-4 rounded bg-slate-100" />
                    <div className="h-4 rounded bg-slate-100" />
                    <div className="h-2 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : organizations.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {organizations.map((organization) => (
                <OrganizationCard
                  key={organization.id}
                  organization={organization}
                  application={applicationByOrganization.get(String(organization.id))}
                  onApply={handleApply}
                  isApplying={applyingOrganizationId === organization.id}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Building2 aria-hidden="true" className="mx-auto text-slate-400" size={34} />
              <h3 className="mt-4 text-lg font-semibold text-institute-ink">
                No active organizations found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Add clubs and committees in MongoDB to open the selection workflow.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default Dashboard;
