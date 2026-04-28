import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/components/shared/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, GraduationCap, Users, AlertTriangle } from 'lucide-react';

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await http.get('/dashboard/analytics');
      return data?.data ?? data;
    },
  });

  if (isLoading || !analytics) {
    return (
      <div>
        <PageHeader title="Analytics" description="Loading…" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const passFail = analytics.pass_fail || {};
  const gender = analytics.gender_enrollment || {};
  const gradeAverages = analytics.grade_averages || [];
  const attendanceByMonth = analytics.attendance_by_month || [];
  const passingRate = passFail.total > 0
    ? Math.round((passFail.passing / passFail.total) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Performance, attendance, and demographics for the active school year"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={GraduationCap}
          tone="bg-emerald-50 text-emerald-600"
          label="Passing Rate"
          value={`${passingRate}%`}
          subtitle={`${passFail.passing ?? 0} / ${passFail.total ?? 0} grade rows`}
        />
        <KpiCard
          icon={AlertTriangle}
          tone="bg-red-50 text-red-600"
          label="Failing"
          value={passFail.failing ?? 0}
          subtitle="Below 75 mark"
        />
        <KpiCard
          icon={Users}
          tone="bg-blue-50 text-blue-600"
          label="Male"
          value={gender.male ?? gender.M ?? 0}
        />
        <KpiCard
          icon={Users}
          tone="bg-pink-50 text-pink-600"
          label="Female"
          value={gender.female ?? gender.F ?? 0}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Average Grade by Grade Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradeAverages.map((row) => {
                const avg = Number(row.average_grade ?? 0);
                const pct = Math.min(Math.max((avg - 60) / 40, 0), 1) * 100;
                return (
                  <div key={row.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 shrink-0">{row.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end px-2 transition-all duration-500 ${
                          avg >= 75
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                            : 'bg-gradient-to-r from-amber-400 to-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{avg.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {gradeAverages.length === 0 && (
                <p className="text-sm text-slate-400 italic">No grade data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Absences per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceByMonth.map((row) => {
                const ratio = row.total > 0 ? row.absences / row.total : 0;
                return (
                  <div key={row.month} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 shrink-0">{row.month}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full flex items-center justify-end px-2"
                        style={{ width: `${Math.max(ratio * 100, row.absences > 0 ? 10 : 0)}%` }}
                      >
                        {row.absences > 0 && (
                          <span className="text-[10px] font-bold text-white">{row.absences}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {row.total} rec.
                    </Badge>
                  </div>
                );
              })}
              {attendanceByMonth.length === 0 && (
                <p className="text-sm text-slate-400 italic">No attendance recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, tone, label, value, subtitle }) {
  return (
    <Card className="p-5 bg-white border-0 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

Analytics.layout = (page) => <AppLayout currentPageName="Analytics">{page}</AppLayout>;
