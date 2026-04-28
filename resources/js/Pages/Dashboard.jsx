import AppLayout from '@/Layouts/AppLayout';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/api';
import {
  Users,
  UserPlus,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/shared/StatCard';

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await http.get('/dashboard/summary');
      return data?.data ?? data;
    },
  });

  const totals = summary?.totals ?? {};
  const byGrade = summary?.by_grade_level ?? [];
  const attendance = summary?.today_attendance ?? {};
  const activeYear = summary?.school_year;
  const max = Math.max(...byGrade.map((g) => g.count), 1);

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrolled"
          value={totals.enrolled ?? (isLoading ? '…' : 0)}
          icon={Users}
          color="blue"
          subtitle="Active students"
        />
        <StatCard
          title="Sections"
          value={totals.sections ?? 0}
          icon={UserPlus}
          color="green"
          subtitle="Open this year"
        />
        <StatCard
          title="Parents"
          value={totals.parents ?? 0}
          icon={Users}
          color="purple"
          subtitle="In registry"
        />
        <StatCard
          title="Feeding Program"
          value={totals.feeding_program ?? 0}
          icon={HeartPulse}
          color="amber"
          subtitle="Flagged students"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Enrollment by Grade Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byGrade.map((row) => (
                <div key={row.grade_level_id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20 shrink-0">
                    {row.grade_level}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] rounded-full flex items-center justify-end px-2 transition-all duration-500"
                      style={{
                        width: `${Math.max((row.count / max) * 100, row.count > 0 ? 10 : 0)}%`,
                      }}
                    >
                      {row.count > 0 && (
                        <span className="text-[10px] font-bold text-white">
                          {row.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {byGrade.length === 0 && (
                <p className="text-sm text-slate-400 italic">No enrollments yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Today&apos;s Attendance
            </CardTitle>
            <span className="text-xs text-slate-400">{attendance.date}</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Row icon={ClipboardList} tone="bg-emerald-100 text-emerald-600" label="Present" value={attendance.present ?? 0} />
              <Row icon={AlertTriangle} tone="bg-red-100 text-red-600" label="Absent" value={attendance.absent ?? 0} />
              <Row icon={TrendingUp} tone="bg-amber-100 text-amber-600" label="Late" value={attendance.late ?? 0} />
              <Row icon={Users} tone="bg-slate-100 text-slate-500" label="Records (AM+PM)" value={attendance.total ?? 0} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, tone, label, value }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${tone} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

Dashboard.layout = (page) => <AppLayout currentPageName="Dashboard">{page}</AppLayout>;
