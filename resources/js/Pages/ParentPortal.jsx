import AppLayout from '@/Layouts/AppLayout';
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { ClipboardCheck, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const gradeColor = (g) => {
  if (g == null) return "text-slate-400";
  if (g >= 90) return "text-emerald-600 font-bold";
  if (g >= 85) return "text-blue-600 font-bold";
  if (g >= 75) return "text-slate-700 font-semibold";
  return "text-red-600 font-bold";
};

export default function ParentPortal() {
  const [selectedChildId, setSelectedChildId] = useState("");

  const { data: portal, isLoading, error } = useQuery({
    queryKey: ['parent-portal'],
    queryFn: async () => {
      const { data } = await http.get('/parent-portal');
      return data?.data ?? data;
    },
  });

  const children = portal?.children ?? [];
  const schoolYear = portal?.school_year;

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(String(children[0].student.id));
    }
  }, [children, selectedChildId]);

  const child = children.find(c => String(c.student.id) === String(selectedChildId)) || children[0];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Parent Portal" description="Loading your child's information..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Parent Portal" description="An error occurred." />
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load portal"
          description={error?.message || 'Please try again later.'}
        />
      </div>
    );
  }

  if (!children.length) {
    return (
      <div>
        <PageHeader title="Parent Portal" description="No linked children found." />
        <EmptyState
          icon={AlertTriangle}
          title="No children linked"
          description="Please contact the school registrar to link your account to your child's record."
        />
      </div>
    );
  }

  if (!child) return null;

  const grades = child.grades ?? [];
  const attendance = child.attendance_summary ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  const violations = child.violations ?? [];

  const finals = grades.map(g => g.final).filter(v => v != null);
  const genAvg = finals.length ? Math.round(finals.reduce((a, b) => a + b, 0) / finals.length) : null;

  return (
    <div>
      <PageHeader
        title="Parent Portal"
        description={schoolYear?.label ? `Active SY: ${schoolYear.label}` : "Monitor your child's academic progress"}
      />

      {children.length > 1 && (
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-xs text-slate-500">Viewing child:</span>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-64 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {children.map(c => (
                  <SelectItem key={c.student.id} value={String(c.student.id)}>
                    {c.student.name} {c.enrollment?.grade_level ? `– ${c.enrollment.grade_level}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--theme-primary)] flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-white">{(child.student.first_name || '?')[0]}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">{child.student.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                <span>LRN: {child.student.lrn}</span>
                {child.enrollment && (
                  <>
                    <span>•</span>
                    <span>{child.enrollment.grade_level} – {child.enrollment.section || 'Unassigned'}</span>
                    {child.enrollment.adviser && (<><span>•</span><span>Adviser: {child.enrollment.adviser}</span></>)}
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <div className={`text-3xl font-black ${gradeColor(genAvg)}`}>{genAvg ?? '—'}</div>
                <div className="text-xs text-slate-400">General Avg</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm p-4 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800">{genAvg ?? '—'}</p>
          <p className="text-xs text-slate-400">General Average</p>
        </Card>
        <Card className="border-0 shadow-sm p-4 text-center">
          <ClipboardCheck className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800">{attendance.absent ?? 0}</p>
          <p className="text-xs text-slate-400">Total Absences</p>
        </Card>
        <Card className="border-0 shadow-sm p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800">{violations.length}</p>
          <p className="text-xs text-slate-400">Violations</p>
        </Card>
      </div>

      <Tabs defaultValue="grades">
        <TabsList className="mb-5">
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-3 px-5">
              <CardTitle className="text-sm">{child.enrollment?.grade_level || 'Current'} – Report Card Preview</CardTitle>
            </CardHeader>
            {grades.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No grades posted yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs text-center">Q1</TableHead>
                    <TableHead className="text-xs text-center">Q2</TableHead>
                    <TableHead className="text-xs text-center">Q3</TableHead>
                    <TableHead className="text-xs text-center">Q4</TableHead>
                    <TableHead className="text-xs text-center">Final</TableHead>
                    <TableHead className="text-xs">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map(g => (
                    <TableRow key={g.subject}>
                      <TableCell className="font-medium text-sm">{g.subject}</TableCell>
                      {['Q1','Q2','Q3','Q4'].map(q => (
                        <TableCell key={q} className={`text-center text-sm ${gradeColor(g[q])}`}>{g[q] ?? '—'}</TableCell>
                      ))}
                      <TableCell className={`text-center text-sm font-bold ${gradeColor(g.final)}`}>{g.final ?? '—'}</TableCell>
                      <TableCell>
                        {g.final != null && (
                          <Badge className={g.final >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                            {g.final >= 75 ? "Passed" : "Failed"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {genAvg != null && (
                    <TableRow className="bg-slate-50">
                      <TableCell className="font-bold text-sm">General Average</TableCell>
                      <TableCell colSpan={4} />
                      <TableCell className={`text-center font-black text-base ${gradeColor(genAvg)}`}>{genAvg}</TableCell>
                      <TableCell>
                        <Badge className={genAvg >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                          {genAvg >= 75 ? "Passed" : "Failed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-3 px-5">
              <CardTitle className="text-sm">Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800">{attendance.total ?? 0}</p>
                <p className="text-xs text-slate-400">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{attendance.present ?? 0}</p>
                <p className="text-xs text-slate-400">Present</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{attendance.absent ?? 0}</p>
                <p className="text-xs text-slate-400">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{attendance.late ?? 0}</p>
                <p className="text-xs text-slate-400">Late</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{attendance.excused ?? 0}</p>
                <p className="text-xs text-slate-400">Excused</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          {violations.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">No violations recorded for your child.</div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Action Taken</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">{v.date_of_incident}</TableCell>
                      <TableCell className="text-sm">{v.violation_type}</TableCell>
                      <TableCell>
                        <Badge className={v.severity === "minor" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                          {v.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{v.description}</TableCell>
                      <TableCell className="text-sm text-slate-600">{v.action_taken}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

ParentPortal.layout = (page) => <AppLayout currentPageName="ParentPortal">{page}</AppLayout>;
