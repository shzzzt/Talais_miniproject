import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { User, BookOpen, ClipboardCheck, AlertTriangle, Calendar, TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "../components/shared/PageHeader";

// Simulated child data for parent
const CHILD = {
  name: "Juan Dela Cruz",
  lrn: "100100100001",
  grade: "Grade 1",
  section: "Rizal",
  adviser: "Mrs. Maria Santos",
  birthday: "2017-03-15",
  gender: "Male",
  address: "Musuan, Maramag, Bukidnon",
};

const GRADES = [
  { subject: "Filipino", q1: 88, q2: 85, q3: 90, q4: 87, final: 88 },
  { subject: "English", q1: 82, q2: 80, q3: 84, q4: 83, final: 82 },
  { subject: "Mathematics", q1: 91, q2: 88, q3: 93, q4: 90, final: 91 },
  { subject: "Reading & Literacy", q1: 85, q2: 83, q3: 87, q4: 86, final: 85 },
  { subject: "Makabansa", q1: 90, q2: 89, q3: 91, q4: 88, final: 90 },
  { subject: "GMRC", q1: 95, q2: 94, q3: 96, q4: 95, final: 95 },
  { subject: "Language", q1: 87, q2: 85, q3: 88, q4: 86, final: 87 },
];

const ATTENDANCE = [
  { month: "June", school_days: 20, present: 20, absent: 0, tardy: 0 },
  { month: "July", school_days: 22, present: 21, absent: 1, tardy: 1 },
  { month: "August", school_days: 21, present: 20, absent: 1, tardy: 0 },
  { month: "September", school_days: 20, present: 19, absent: 1, tardy: 2 },
  { month: "October", school_days: 23, present: 22, absent: 1, tardy: 0 },
  { month: "November", school_days: 18, present: 17, absent: 1, tardy: 1 },
];

const VIOLATIONS = [
  { date: "2025-09-15", type: "Tardiness", severity: "minor", description: "Arrived 30 minutes late.", action: "Verbal warning" },
];

const SCHEDULE = [
  { day: "Monday", subject: "Filipino", time: "7:00 – 7:45 AM", teacher: "Mrs. Santos" },
  { day: "Monday", subject: "Mathematics", time: "7:45 – 8:30 AM", teacher: "Mr. Reyes" },
  { day: "Monday", subject: "English", time: "8:30 – 9:15 AM", teacher: "Mrs. Cruz" },
  { day: "Tuesday", subject: "Science", time: "7:00 – 7:45 AM", teacher: "Mrs. Garcia" },
  { day: "Tuesday", subject: "MAPEH", time: "7:45 – 8:30 AM", teacher: "Mr. Torres" },
  { day: "Wednesday", subject: "Makabansa", time: "7:00 – 7:45 AM", teacher: "Mrs. Santos" },
  { day: "Thursday", subject: "Reading & Literacy", time: "7:00 – 7:45 AM", teacher: "Mrs. Santos" },
  { day: "Friday", subject: "GMRC", time: "7:00 – 7:45 AM", teacher: "Mrs. Santos" },
];

export default function ParentPortal() {
  const genAvg = Math.round(GRADES.reduce((sum, g) => sum + g.final, 0) / GRADES.length);
  const totalAbsent = ATTENDANCE.reduce((sum, a) => sum + a.absent, 0);
  const totalTardy = ATTENDANCE.reduce((sum, a) => sum + a.tardy, 0);

  const gradeColor = (g) => {
    if (g >= 90) return "text-emerald-600 font-bold";
    if (g >= 85) return "text-blue-600 font-bold";
    if (g >= 75) return "text-slate-700 font-semibold";
    return "text-red-600 font-bold";
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div>
      <PageHeader title="Parent Portal" description="Monitor your child's academic progress" />

      {/* Child Profile */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1e3a5f] flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-white">{CHILD.name[0]}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">{CHILD.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                <span>LRN: {CHILD.lrn}</span>
                <span>•</span>
                <span>{CHILD.grade} – {CHILD.section}</span>
                <span>•</span>
                <span>Adviser: {CHILD.adviser}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <div className={`text-3xl font-black ${gradeColor(genAvg)}`}>{genAvg}</div>
                <div className="text-xs text-slate-400">General Avg</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm p-4 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800">{genAvg}</p>
          <p className="text-xs text-slate-400">General Average</p>
        </Card>
        <Card className="border-0 shadow-sm p-4 text-center">
          <ClipboardCheck className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800">{totalAbsent}</p>
          <p className="text-xs text-slate-400">Total Absences</p>
        </Card>
        <Card className="border-0 shadow-sm p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800">{VIOLATIONS.length}</p>
          <p className="text-xs text-slate-400">Violations</p>
        </Card>
      </div>

      <Tabs defaultValue="grades">
        <TabsList className="mb-5">
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        {/* Grades */}
        <TabsContent value="grades">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-3 px-5">
              <CardTitle className="text-sm">{CHILD.grade} – Report Card Preview</CardTitle>
            </CardHeader>
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
                {GRADES.map(g => (
                  <TableRow key={g.subject}>
                    <TableCell className="font-medium text-sm">{g.subject}</TableCell>
                    {[g.q1, g.q2, g.q3, g.q4].map((q, i) => (
                      <TableCell key={i} className={`text-center text-sm ${gradeColor(q)}`}>{q}</TableCell>
                    ))}
                    <TableCell className={`text-center text-sm font-bold ${gradeColor(g.final)}`}>{g.final}</TableCell>
                    <TableCell>
                      <Badge className={g.final >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                        {g.final >= 75 ? "Passed" : "Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-50">
                  <TableCell className="font-bold text-sm">General Average</TableCell>
                  <TableCell colSpan={4} />
                  <TableCell className={`text-center font-black text-base ${gradeColor(genAvg)}`}>{genAvg}</TableCell>
                  <TableCell><Badge className="bg-emerald-100 text-emerald-700">Promoted</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance">
          <Card className="border-0 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Month</TableHead>
                  <TableHead className="text-xs text-center">School Days</TableHead>
                  <TableHead className="text-xs text-center">Present</TableHead>
                  <TableHead className="text-xs text-center">Absent</TableHead>
                  <TableHead className="text-xs text-center">Tardy</TableHead>
                  <TableHead className="text-xs text-center">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ATTENDANCE.map(a => (
                  <TableRow key={a.month}>
                    <TableCell className="font-medium text-sm">{a.month}</TableCell>
                    <TableCell className="text-center text-sm">{a.school_days}</TableCell>
                    <TableCell className="text-center text-sm text-emerald-600 font-semibold">{a.present}</TableCell>
                    <TableCell className="text-center text-sm text-red-600 font-semibold">{a.absent}</TableCell>
                    <TableCell className="text-center text-sm text-amber-600 font-semibold">{a.tardy}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-bold">{((a.present / a.school_days) * 100).toFixed(1)}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {days.map(day => (
              <Card key={day} className="border-0 shadow-sm">
                <CardHeader className="bg-[#1e3a5f] rounded-t-lg py-2 px-4">
                  <CardTitle className="text-xs text-white">{day}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {SCHEDULE.filter(s => s.day === day).map((s, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs font-bold text-slate-700">{s.subject}</p>
                      <p className="text-[10px] text-slate-400">{s.time}</p>
                      <p className="text-[10px] text-slate-400">{s.teacher}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Violations (read-only) */}
        <TabsContent value="violations">
          {VIOLATIONS.length === 0 ? (
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
                  {VIOLATIONS.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{v.date}</TableCell>
                      <TableCell className="text-sm">{v.type}</TableCell>
                      <TableCell><Badge className={v.severity === "minor" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>{v.severity}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-600">{v.description}</TableCell>
                      <TableCell className="text-sm text-slate-600">{v.action}</TableCell>
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