import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";
import { Link, router, usePage } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, BookOpen, ClipboardCheck, HeartPulse, AlertTriangle, Pencil, Trash2, GraduationCap } from "lucide-react";
import StudentForm from "../components/enrollment/StudentForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function useStudentIdFromRoute() {
  const { props, url } = usePage();
  if (props?.id) return String(props.id);
  if (props?.student?.id) return String(props.student.id);
  const match = (url || (typeof window !== "undefined" ? window.location.pathname : "")).match(
    /StudentProfile\/(\d+)/i
  );
  return match ? match[1] : null;
}

const statusColors = {
  enrolled: "bg-emerald-100 text-emerald-700",
  transferred_in: "bg-blue-100 text-blue-700",
  transferred_out: "bg-amber-100 text-amber-700",
  dropped: "bg-red-100 text-red-700",
  graduated: "bg-purple-100 text-purple-700",
  alumni: "bg-slate-100 text-slate-600",
};

const bmiColors = {
  "Severely Wasted": "bg-red-100 text-red-700",
  "Wasted": "bg-orange-100 text-orange-700",
  "Normal": "bg-green-100 text-green-700",
  "Overweight": "bg-amber-100 text-amber-700",
  "Obese": "bg-red-100 text-red-700",
};

const gradeColor = (g) => {
  if (!g) return "";
  if (g >= 90) return "text-emerald-600 font-semibold";
  if (g >= 85) return "text-blue-600 font-semibold";
  if (g >= 75) return "text-slate-700";
  return "text-red-600 font-semibold";
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function StudentProfile() {
  const id = useStudentIdFromRoute();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteStudent, setShowDeleteStudent] = useState(false);

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["schoolYears"],
    queryFn: () => base44.entities.SchoolYear.list("-created_date"),
  });
  const activeYear = schoolYears.find((y) => y.is_active);

  const { data: sections = [] } = useQuery({
    queryKey: ["sections", activeYear?.id],
    queryFn: () =>
      activeYear?.id ? base44.entities.Section.filter({ school_year_id: activeYear.id }) : base44.entities.Section.list(),
  });

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: () => base44.entities.Student.get(id),
    enabled: !!id,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", "student", id],
    queryFn: () => base44.entities.Enrollment.filter({ student_id: id, limit: 100 }),
    enabled: !!id,
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ sid, data }) => base44.entities.Student.update(sid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      setShowEditForm(false);
      toast.success("Student updated");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (sid) => base44.entities.Student.delete(sid),
    onSuccess: () => {
      toast.success("Student removed");
      router.visit("/Students");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["grades", id],
    queryFn: () => base44.entities.Grade.filter({ student_id: id }),
    enabled: !!id,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", id],
    queryFn: () => base44.entities.Attendance.filter({ student_id: id }),
    enabled: !!id,
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ["health", id],
    queryFn: () => base44.entities.HealthRecord.filter({ student_id: id }),
    enabled: !!id,
  });

  const { data: violations = [] } = useQuery({
    queryKey: ["violations_student", id],
    queryFn: () => base44.entities.Violation
      ? base44.entities.Violation.filter({ student_id: id })
      : Promise.resolve([]),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--theme-primary)] rounded-full animate-spin" />
    </div>
  );

  if (!student) return (
    <div className="text-center py-24 text-slate-400">Student not found.</div>
  );

  // Group grades by subject
  const subjectMap = {};
  grades.forEach(g => {
    if (!subjectMap[g.subject_name]) subjectMap[g.subject_name] = {};
    subjectMap[g.subject_name][g.quarter] = g.quarterly_grade;
  });

  // Attendance summary
  const attSummary = { present: 0, absent: 0, late: 0, excused: 0, half_day: 0 };
  attendance.forEach(a => {
    if (attSummary[a.status] !== undefined) attSummary[a.status]++;
  });
  const totalDays = attendance.length;
  const absenceRate = totalDays ? Math.round((attSummary.absent / totalDays) * 100) : 0;

  // Latest health record
  const latestHealth = healthRecords.sort((a, b) => new Date(b.date_recorded) - new Date(a.date_recorded))[0];

  const fullName = `${student.last_name}, ${student.first_name}${student.middle_name ? " " + student.middle_name : ""}${student.suffix ? " " + student.suffix : ""}`;
  const age = student.birthday
    ? Math.floor((new Date() - new Date(student.birthday)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-700 -ml-2">
          <Link href="/Students">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Students
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowEditForm(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setShowDeleteStudent(true)}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-[var(--theme-primary)] flex items-center justify-center shrink-0">
              {student.photo_url
                ? <img src={student.photo_url} className="w-16 h-16 rounded-2xl object-cover" alt="photo" />
                : <span className="text-2xl font-bold text-white">{student.first_name?.[0]}{student.last_name?.[0]}</span>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-slate-800">{fullName}</h1>
                <Badge className={statusColors[student.status] || "bg-slate-100 text-slate-600"}>
                  {student.status?.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono mb-3">LRN: {student.lrn}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-xs text-slate-400 block">Grade & Section</span><span className="text-slate-700 font-medium">{student.current_grade_level} {student.current_section_name && `- ${student.current_section_name}`}</span></div>
                <div><span className="text-xs text-slate-400 block">Gender</span><span className="text-slate-700">{student.gender}</span></div>
                {age !== null && <div><span className="text-xs text-slate-400 block">Age</span><span className="text-slate-700">{age} yrs old</span></div>}
                <div><span className="text-xs text-slate-400 block">Birthday</span><span className="text-slate-700">{student.birthday}</span></div>
                <div className="col-span-2"><span className="text-xs text-slate-400 block">Address</span><span className="text-slate-700">{student.address || "—"}</span></div>
                <div><span className="text-xs text-slate-400 block">Contact</span><span className="text-slate-700">{student.contact_number || "—"}</span></div>
              </div>
            </div>

            {/* Parent info */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm min-w-[180px]">
              <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">Parent / Guardian</p>
              <p className="font-medium text-slate-700">{student.parent_name || "—"}</p>
              <p className="text-xs text-slate-500">{student.parent_relationship}</p>
              <p className="text-xs text-slate-500 mt-1">{student.parent_contact}</p>
              <p className="text-xs text-slate-400 mt-0.5">{student.parent_occupation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><BookOpen className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-lg font-bold text-slate-800">{Object.keys(subjectMap).length}</p><p className="text-xs text-slate-400">Subjects</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-red-500" /></div>
            <div><p className="text-lg font-bold text-slate-800">{attSummary.absent}</p><p className="text-xs text-slate-400">Total Absences</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
            <div><p className="text-lg font-bold text-slate-800">{violations.length}</p><p className="text-xs text-slate-400">Violations</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center"><HeartPulse className="w-4 h-4 text-emerald-500" /></div>
            <div>
              <p className="text-lg font-bold text-slate-800">{latestHealth?.bmi?.toFixed(1) || "—"}</p>
              <p className="text-xs text-slate-400">BMI {latestHealth?.bmi_category || ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="grades">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="grades"><BookOpen className="w-3.5 h-3.5 mr-1" />Grades</TabsTrigger>
          <TabsTrigger value="enrollments"><GraduationCap className="w-3.5 h-3.5 mr-1" />Enrollments</TabsTrigger>
          <TabsTrigger value="attendance"><ClipboardCheck className="w-3.5 h-3.5 mr-1" />Attendance</TabsTrigger>
          <TabsTrigger value="health"><HeartPulse className="w-3.5 h-3.5 mr-1" />Health</TabsTrigger>
          <TabsTrigger value="violations"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Violations</TabsTrigger>
        </TabsList>

        {/* Grades */}
        <TabsContent value="grades">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Quarterly Grades</CardTitle></CardHeader>
            <CardContent className="p-0">
              {Object.keys(subjectMap).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No grades recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Subject</TableHead>
                        {QUARTERS.map(q => <TableHead key={q} className="text-xs text-center">{q}</TableHead>)}
                        <TableHead className="text-xs text-center">Average</TableHead>
                        <TableHead className="text-xs text-center">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(subjectMap).map(([subject, qGrades]) => {
                        const vals = QUARTERS.map(q => qGrades[q]).filter(v => v != null);
                        const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
                        return (
                          <TableRow key={subject}>
                            <TableCell className="text-sm font-medium text-slate-700">{subject}</TableCell>
                            {QUARTERS.map(q => (
                              <TableCell key={q} className={`text-sm text-center ${gradeColor(qGrades[q])}`}>
                                {qGrades[q] ?? "—"}
                              </TableCell>
                            ))}
                            <TableCell className={`text-sm text-center font-bold ${gradeColor(avg)}`}>{avg ?? "—"}</TableCell>
                            <TableCell className="text-center">
                              {avg != null && (
                                <Badge className={avg >= 75 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                  {avg >= 75 ? "Passed" : "Failed"}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm">School-year enrollment records</CardTitle></CardHeader>
            <CardContent className="p-0">
              {enrollments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No enrollment rows.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">School year</TableHead>
                        <TableHead className="text-xs">Grade</TableHead>
                        <TableHead className="text-xs">Section</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...enrollments].sort((a, b) => String(b.enrollment_date).localeCompare(String(a.enrollment_date))).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs font-medium">{e.school_year?.label ?? e.school_year_id}</TableCell>
                          <TableCell className="text-xs">{e.grade_level?.name ?? "—"}</TableCell>
                          <TableCell className="text-xs">{e.section?.name ?? "—"}</TableCell>
                          <TableCell className="text-xs capitalize">{(e.enrollment_type ?? "").replace(/_/g, " ") || "—"}</TableCell>
                          <TableCell><Badge className={statusColors[e.status] || "bg-slate-100 text-slate-600"}>{e.status}</Badge></TableCell>
                          <TableCell className="text-xs">{e.enrollment_date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="px-4 py-3 border-t bg-slate-50/80">
                <Button variant="link" className="text-[var(--theme-primary)] h-auto p-0" asChild>
                  <Link href="/Enrollment">Manage enrollments →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Present", value: attSummary.present, color: "text-green-600" },
              { label: "Absent", value: attSummary.absent, color: "text-red-600" },
              { label: "Late", value: attSummary.late, color: "text-amber-600" },
              { label: "Excused", value: attSummary.excused, color: "text-blue-600" },
            ].map(item => (
              <Card key={item.label} className="border-0 shadow-sm">
                <CardContent className="pt-3 pb-3 text-center">
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-slate-400">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {absenceRate > 0 && (
            <div className={`mb-4 p-3 rounded-xl text-xs font-medium ${absenceRate >= 20 ? "bg-red-50 text-red-700" : absenceRate >= 15 ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"}`}>
              Absence rate: {absenceRate}% {absenceRate >= 20 ? "⚠️ Exceeds 20% threshold – at risk of failing" : absenceRate >= 15 ? "⚠️ Approaching absence threshold" : ""}
            </div>
          )}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {attendance.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No attendance records yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Section</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...attendance].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50).map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs text-slate-600">{a.date}</TableCell>
                          <TableCell>
                            <Badge className={
                              a.status === "present" ? "bg-green-100 text-green-700" :
                              a.status === "absent" ? "bg-red-100 text-red-700" :
                              a.status === "late" ? "bg-amber-100 text-amber-700" :
                              "bg-blue-100 text-blue-700"
                            }>{a.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{a.section_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health */}
        <TabsContent value="health">
          {latestHealth && (
            <Card className="border-0 shadow-sm mb-4">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-slate-400 mb-3 font-semibold uppercase">Latest Reading — {latestHealth.date_recorded}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-2xl font-bold text-slate-800">{latestHealth.height_cm}</p>
                    <p className="text-xs text-slate-400">Height (cm)</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-2xl font-bold text-slate-800">{latestHealth.weight_kg}</p>
                    <p className="text-xs text-slate-400">Weight (kg)</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-2xl font-bold text-slate-800">{latestHealth.bmi?.toFixed(1)}</p>
                    <p className="text-xs text-slate-400">BMI</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <Badge className={`text-sm ${bmiColors[latestHealth.bmi_category] || "bg-slate-100 text-slate-600"}`}>
                      {latestHealth.bmi_category}
                    </Badge>
                    <p className="text-xs text-slate-400 mt-1">Classification</p>
                  </div>
                </div>
                {latestHealth.feeding_program && (
                  <div className="mt-3 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium">
                    ⚠️ Flagged for Feeding Program
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Health History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {healthRecords.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No health records yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Height (cm)</TableHead>
                        <TableHead className="text-xs">Weight (kg)</TableHead>
                        <TableHead className="text-xs">BMI</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Feeding Program</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...healthRecords].sort((a, b) => new Date(b.date_recorded) - new Date(a.date_recorded)).map(h => (
                        <TableRow key={h.id}>
                          <TableCell className="text-xs text-slate-600">{h.date_recorded}</TableCell>
                          <TableCell className="text-sm">{h.height_cm}</TableCell>
                          <TableCell className="text-sm">{h.weight_kg}</TableCell>
                          <TableCell className="text-sm font-medium">{h.bmi?.toFixed(1)}</TableCell>
                          <TableCell><Badge className={`text-xs ${bmiColors[h.bmi_category] || "bg-slate-100 text-slate-600"}`}>{h.bmi_category}</Badge></TableCell>
                          <TableCell>{h.feeding_program ? <Badge className="bg-red-100 text-red-700 text-xs">Yes</Badge> : <span className="text-xs text-slate-400">No</span>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations */}
        <TabsContent value="violations">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Violation Records</CardTitle></CardHeader>
            <CardContent className="p-0">
              {violations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No violations on record.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs">Action Taken</TableHead>
                        <TableHead className="text-xs">Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {violations.map(v => (
                        <TableRow key={v.id}>
                          <TableCell className="text-xs text-slate-600 whitespace-nowrap">{v.date}</TableCell>
                          <TableCell>
                            <Badge className={v.type === "Major" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                              {v.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 max-w-xs">{v.description}</TableCell>
                          <TableCell className="text-xs text-slate-600">{v.action_taken || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-500">{v.recorded_by || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StudentForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={(payload) => updateStudentMutation.mutate({ sid: student.id, data: payload })}
        student={student}
        sections={sections}
      />

      <AlertDialog open={showDeleteStudent} onOpenChange={setShowDeleteStudent}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              This archives the learner profile and related access. Enrollment rows may need cleanup separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteStudentMutation.mutate(student.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

StudentProfile.layout = (page) => <AppLayout currentPageName="StudentProfile">{page}</AppLayout>;
