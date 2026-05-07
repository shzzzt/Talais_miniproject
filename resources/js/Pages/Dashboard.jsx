import AppLayout from '@/Layouts/AppLayout';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@inertiajs/react';
import { http } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import {
  Users,
  BookOpen,
  Database,
  HardDrive,
  Clock,
  UserCheck,
  ClipboardCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/shared/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isSchoolAdmin = user?.role === 'school_admin';

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await http.get('/dashboard/summary');
      return data?.data ?? data;
    },
  });

  const { data: adminSummary } = useQuery({
    queryKey: ['dashboard-admin-summary'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await http.get('/dashboard/admin-summary');
      return data?.data ?? data;
    },
  });

  const activeYear = summary?.school_year;

  const health = adminSummary?.system_health ?? {};
  const txDaily = adminSummary?.transactions?.daily ?? [];
  const txWeekly = adminSummary?.transactions?.weekly ?? [];
  const txMonthly = adminSummary?.transactions?.monthly ?? [];
  const quick = adminSummary?.quick_actions ?? [];
  const recent = adminSummary?.recent_activities ?? [];
  const perf = adminSummary?.performance_metrics ?? {};
  const userStats = adminSummary?.user_statistics ?? {};
  const userChart = userStats?.chart ?? [];
  const schoolTotals = summary?.totals ?? {};
  const attendance = summary?.today_attendance ?? {};
  const gradeLevels = summary?.by_grade_level ?? [];
  const genderBreakdown = Object.entries(summary?.by_gender ?? {}).map(([label, value]) => ({
    label: label || 'Unknown',
    count: Number(value) || 0,
  }));
  const schoolQuickActions = [
    { label: 'Students', href: '/Students' },
    { label: 'Sections', href: '/Sections' },
    { label: 'Subjects', href: '/Subjects' },
    { label: 'Enroll Students', href: '/Enrollment' },
    { label: 'Scheduling', href: '/Scheduling' },
    { label: 'Violations', href: '/Violations' },
    { label: 'Form 137', href: '/Form137' },
    { label: 'Reports', href: '/Reports' },
    { label: 'Analytics', href: '/Analytics' },
    { label: 'School Year Settings', href: '/SchoolYears' },
    { label: 'User Management', href: '/UserManagement' },
    { label: 'System Management', href: '/AdminSettings' },
  ];

  return (
    <div className="space-y-6">
      {activeYear && (
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                Active School Year
              </p>
              <h2 className="text-2xl font-bold mt-1">{activeYear.label}</h2>
              <p className="text-white/60 text-sm mt-1">Musuan Integrated School</p>
            </div>
            <Badge className="bg-amber-400 text-[#1e3a5f] hover:bg-amber-300 font-semibold">
              {activeYear.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      )}

      {isSchoolAdmin && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Enrolled Students" value={schoolTotals.enrolled ?? 0} icon={Users} color="blue" subtitle="Current school year" />
            <StatCard title="Sections" value={schoolTotals.sections ?? 0} icon={BookOpen} color="purple" subtitle="Active class sections" />
            <StatCard title="Parents / Guardians" value={schoolTotals.parents ?? 0} icon={UserCheck} color="green" subtitle="Registered guardians" />
            <StatCard title="Feeding Program" value={schoolTotals.feeding_program ?? 0} icon={ClipboardCheck} color="amber" subtitle="Student health records" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Enrollment by Grade Level</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeLevels}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="grade_level" tick={{ fontSize: 11 }} hide={gradeLevels.length > 12} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2c5282" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Today&apos;s Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PerfRow label="Total records" value={attendance.total ?? 0} />
                <PerfRow label="Present" value={attendance.present ?? 0} />
                <PerfRow label="Absent" value={attendance.absent ?? 0} />
                <PerfRow label="Late" value={attendance.late ?? 0} />
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Gender Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1e3a5f" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                {schoolQuickActions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block text-sm p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {isAdmin && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Server Uptime" value={formatUptime(health.uptime_seconds)} icon={Clock} color="blue" subtitle="App runtime" />
            <StatCard title="Database Size" value={`${health.database_size_mb ?? 0} MB`} icon={Database} color="purple" subtitle="Current DB footprint" />
            <StatCard title="Storage Usage" value={`${health.storage_usage_mb ?? 0} MB`} icon={HardDrive} color="amber" subtitle="storage/ total" />
            <StatCard title="Users Active Now" value={userStats.active_now ?? 0} icon={UserCheck} color="green" subtitle="Last 15 minutes" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Transaction Overview (Daily)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={txDaily}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} hide={txDaily.length > 16} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <Mini label="Total users" value={userStats.total_users ?? 0} />
                  <Mini label="Active now" value={userStats.active_now ?? 0} />
                  <Mini label="New (30d)" value={userStats.new_registrations_30d ?? 0} />
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} hide={userChart.length > 16} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#2c5282" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quick.map((q) => (
                  <Link key={q.href} href={q.href} className="block text-sm p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700">
                    {q.label}
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                {recent.length === 0 ? (
                  <p className="text-sm text-slate-400">No recent activities.</p>
                ) : (
                  recent.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-700">{r.description}</p>
                        <Badge variant="secondary" className="text-[10px]">{r.event || r.log_name || 'log'}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {r.causer?.name ?? 'System'} • {r.causer?.role ?? 'n/a'}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PerfRow label="Transactions today" value={perf.transactions_today ?? 0} />
                <PerfRow label="Avg. daily tx (30d)" value={perf.avg_daily_transactions_30d ?? 0} />
                <PerfRow label="Backup success rate (30d)" value={`${perf.backup_success_rate_30d ?? 0}%`} />
                <PerfRow label="Error count today" value={perf.error_count_today ?? 0} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Transaction Overview (Weekly / Monthly)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={txWeekly}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={txMonthly}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#2c5282" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!isAdmin && !isSchoolAdmin && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Dashboard widgets are available to system administrators.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PerfRow({ label, value }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="p-2.5 bg-slate-50 rounded-xl text-center">
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function formatUptime(totalSeconds) {
  const sec = Number(totalSeconds || 0);
  const days = Math.floor(sec / 86400);
  const hrs = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

Dashboard.layout = (page) => <AppLayout currentPageName="Dashboard">{page}</AppLayout>;
