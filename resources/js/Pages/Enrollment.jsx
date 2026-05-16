import AppLayout from '@/Layouts/AppLayout';
import React, { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { createPageUrl } from "../utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";
import {
  Users, BookOpen, Layers, ArrowRight, Plus, Edit2, Trash2, Search, Loader2, UserPlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "../components/shared/StatCard";
import PageHeader from "../components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusBadge = (s) => {
  const m = {
    enrolled: "bg-emerald-100 text-emerald-700",
    transferred_in: "bg-blue-100 text-blue-700",
    transferred_out: "bg-amber-100 text-amber-700",
    transferred: "bg-amber-100 text-amber-700",
    dropped: "bg-red-100 text-red-700",
    completed: "bg-purple-100 text-purple-700",
    graduated: "bg-purple-100 text-purple-700",
  };
  return m[s] || "bg-slate-100 text-slate-600";
};

const emptyEnrollmentForm = {
  student_id: "",
  school_year_id: "",
  grade_level_id: "",
  section_id: "",
  class_session: "",
  enrollment_date: new Date().toISOString().slice(0, 10),
  enrollment_type: "new",
  status: "enrolled",
};

export default function Enrollment() {
  const queryClient = useQueryClient();
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [closingForm, setClosingForm] = useState(false);
  const [form, setForm] = useState(emptyEnrollmentForm);
  const [studentSearch, setStudentSearch] = useState("");
  const [lrnLookup, setLrnLookup] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["schoolYears"],
    queryFn: () => base44.entities.SchoolYear.list("-created_date"),
  });

  const activeYear = schoolYears.find((y) => y.is_active);
  const selectedYearId =
    Number(schoolYearFilter) ||
    Number(activeYear?.id) ||
    (schoolYears[0]?.id ?? "");

  const { data: students = [], isFetching: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 600),
  });

  const { data: hubSections = [] } = useQuery({
    queryKey: ["sections", "hub"],
    queryFn: () => base44.entities.Section.list(),
  });
  const { data: hubSubjects = [] } = useQuery({
    queryKey: ["subjects", "hub"],
    queryFn: () => base44.entities.Subject.list(),
  });

  const { data: gradeLevels = [] } = useQuery({
    queryKey: ["gradeLevels"],
    queryFn: () => base44.entities.GradeLevel.list(),
  });

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ["enrollments", selectedYearId, search],
    queryFn: () =>
      base44.entities.Enrollment.filter({
        school_year_id: selectedYearId,
        search: search.trim() || undefined,
      }),
    enabled: !!selectedYearId,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["sections", selectedYearId, form.grade_level_id, form.class_session],
    queryFn: () =>
      base44.entities.Section.filter({
        school_year_id: selectedYearId,
        grade_level_id: form.grade_level_id || undefined,
      }),
    enabled: !!selectedYearId && !!form.grade_level_id,
  });

  const selectedGrade = useMemo(
    () => gradeLevels.find((g) => String(g.id) === String(form.grade_level_id)),
    [gradeLevels, form.grade_level_id],
  );

  const gradeNeedsSession = useMemo(() => {
    if (!selectedGrade) return false;
    if (selectedGrade.has_session) return true;
    const n = (selectedGrade.name || "").toLowerCase();
    return n === "kindergarten 1" || n === "kindergarten 2";
  }, [selectedGrade]);

  const sectionsForForm = useMemo(() => {
    if (!gradeNeedsSession || !form.class_session) return sections;
    return sections.filter((s) => s.session === form.class_session);
  }, [sections, gradeNeedsSession, form.class_session]);

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.Enrollment.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setFormOpen(false);
      resetForm();
      toast.success("Enrollment saved");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Enrollment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setFormOpen(false);
      setEditing(null);
      resetForm();
      toast.success("Enrollment updated");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Enrollment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setDeleteId(null);
      toast.success("Enrollment removed");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const resetForm = () => {
    setForm({
      ...emptyEnrollmentForm,
      school_year_id: selectedYearId || "",
      enrollment_date: new Date().toISOString().slice(0, 10),
    });
    setEditing(null);
    setStudentSearch("");
    setLrnLookup("");
  };

  const formBusy = createMutation.isPending || updateMutation.isPending || closingForm;

  const closeForm = () => {
    if (formBusy) return;
    setClosingForm(true);
    window.setTimeout(() => {
      setFormOpen(false);
      resetForm();
      setClosingForm(false);
      toast.message("Enrollment form closed");
    }, 150);
  };

  const openCreate = () => {
    resetForm();
    setForm((f) => ({ ...f, school_year_id: selectedYearId || "" }));
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const sid = row.section_id ?? row.section?.id ?? "";
    setForm({
      student_id: String(row.student_id ?? row.student?.id ?? ""),
      school_year_id: String(row.school_year_id ?? ""),
      grade_level_id: String(row.grade_level_id ?? row.grade_level?.id ?? ""),
      section_id: sid ? String(sid) : "",
      class_session: row.class_session || "",
      enrollment_date: (row.enrollment_date || "").toString().slice(0, 10),
      enrollment_type: row.enrollment_type ?? "new",
      status: row.status ?? "enrolled",
    });
    setFormOpen(true);
  };

  const submitForm = () => {
    const payload = {
      student_id: Number(form.student_id),
      school_year_id: Number(form.school_year_id || selectedYearId),
      grade_level_id: Number(form.grade_level_id),
      enrollment_date: form.enrollment_date,
      enrollment_type: form.enrollment_type || null,
      status: form.status || "enrolled",
    };
    if (form.section_id) payload.section_id = Number(form.section_id);
    else payload.section_id = null;

    if (gradeNeedsSession) {
      if (!form.class_session) {
        toast.error("Select morning or afternoon schedule for Kindergarten 1 / 2.");
        return;
      }
      payload.class_session = form.class_session;
    } else {
      payload.class_session = null;
    }

    if (!payload.student_id || !payload.school_year_id || !payload.grade_level_id || !payload.enrollment_date) {
      toast.error("Student, school year, grade, and enrollment date are required.");
      return;
    }

    if (editing?.id) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const runLrnLookup = async () => {
    const digits = String(lrnLookup || "").trim();
    if (digits.length !== 12 || !/^\d{12}$/.test(digits)) {
      toast.error("LRN must be exactly 12 digits.");
      return;
    }
    setLookupLoading(true);
    try {
      const data = await base44.students.lookup(digits);
      if (!data?.id) {
        toast.message("LRN not found", { description: "Create the student record first under Students." });
        return;
      }
      setForm((f) => ({ ...f, student_id: String(data.id), enrollment_type: "continuing" }));
      toast.success(`Loaded ${data.first_name} ${data.last_name}`);
    } catch (e) {
      if (e?.response?.status === 404) toast.error("LRN not found.");
      else toast.error(extractApiError(e));
    } finally {
      setLookupLoading(false);
    }
  };

  const studentOptions = useMemo(() => {
    const t = studentSearch.trim().toLowerCase();
    if (!t) return students.slice(0, 80);
    return students
      .filter((s) => {
        const blob = `${s.first_name} ${s.last_name} ${s.lrn}`.toLowerCase();
        return blob.includes(t);
      })
      .slice(0, 80);
  }, [students, studentSearch]);

  const enrolled = students.filter((s) => s.status === "enrolled").length;
  const uniqueParents = new Set(students.filter((s) => s.parent_name).map((s) => s.parent_name.trim().toLowerCase())).size;

  const links = [
    { title: "Students", description: "Master list, SF1 CSV, bulk Excel import", icon: Users, page: "Students", count: students.length },
    { title: "Sections", description: "Class sections per grade level", icon: Layers, page: "Sections", count: hubSections.length },
    { title: "Subjects", description: "Subjects & grade linkage", icon: BookOpen, page: "Subjects", count: hubSubjects.length },
  ];

  return (
    <div>
      <PageHeader
        title="Enrollment"
        description="Section cards, enrolment ledger, continuing LRN lookup"
        action={
          <Button onClick={openCreate} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]" disabled={!selectedYearId}>
            <Plus className="w-4 h-4 mr-2" /> Add enrollment
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total enrolled" value={enrolled} icon={Users} color="blue" />
        <StatCard title="Total students" value={students.length} icon={UserPlus} color="green" />
        <StatCard title="This year rows" value={enrollments.length} icon={Layers} color="purple" />
        <StatCard title="PTA households" value={uniqueParents} icon={Users} color="amber" subtitle="Unique names" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {links.map((link) => (
          <Link key={link.page} href={createPageUrl(link.page)}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/10 flex items-center justify-center mb-3">
                    <link.icon className="w-5 h-5 text-[var(--theme-primary)]" />
                  </div>
                  <h3 className="font-bold text-slate-800">{link.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{link.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-[var(--theme-primary)]">{link.count}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[var(--theme-primary)] group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-slate-500">School year</Label>
            <Select
              value={String(selectedYearId || "")}
              onValueChange={(v) => setSchoolYearFilter(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="School year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {(y.label || y.name)}{y.is_active ? " (active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-[2]">
            <Search className="absolute left-3 top-9 w-4 h-4 text-slate-400" />
            <Label className="text-xs text-slate-500 block mb-1.5">Search learner</Label>
            <Input
              className="pl-9"
              placeholder="Name or LRN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">LRN</TableHead>
                <TableHead className="text-xs">Grade</TableHead>
                <TableHead className="text-xs">Section</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingEnrollments ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    Loading enrollments…
                  </TableCell>
                </TableRow>
              ) : enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    No enrolment rows for this school year.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((row) => {
                  const stu = row.student || {};
                  const gl = row.grade_level || {};
                  const sec = row.section || {};
                  const name =
                    `${stu.last_name ?? ""}, ${stu.first_name ?? ""} ${stu.middle_name ?? ""}`.trim();
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          href={`/StudentProfile/${stu.id ?? row.student_id}`}
                          className="text-sm font-medium text-[var(--theme-primary)] hover:underline"
                        >
                          {name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{stu.lrn}</TableCell>
                      <TableCell className="text-sm">{gl.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{sec.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal capitalize">
                          {(row.enrollment_type || "").replace(/_/g, " ") || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge(row.status)}>{row.status?.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(row)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(row.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) {
            closeForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit enrollment" : "New enrollment"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <p className="text-sm text-slate-600 -mt-1 mb-2">
              Learner:{" "}
              <span className="font-medium">
                {(editing.student?.last_name ?? "")}, {editing.student?.first_name ?? ""}{" "}
                <span className="text-slate-400 font-mono text-xs">({editing.student?.lrn})</span>
              </span>
            </p>
          )}
          {!editing && (
            <>
              <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <Label className="text-xs uppercase text-slate-500">Continuing student — lookup by LRN</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="12-digit LRN"
                    value={lrnLookup}
                    onChange={(e) => setLrnLookup(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" isLoading={lookupLoading} loadingText="Looking..." onClick={runLrnLookup}>
                    Lookup
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Pick student manually</Label>
                <Input
                  placeholder="Filter list…"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="mb-2"
                />
                <Select value={String(form.student_id || "")} onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingStudents ? "Loading students…" : "Select learner"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {studentOptions.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        [{s.lrn}] {s.last_name}, {s.first_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-3">
            <div>
              <Label>School year</Label>
              <Select
                value={String(form.school_year_id || "")}
                onValueChange={(v) => setForm((f) => ({ ...f, school_year_id: v }))}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.label || y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade level</Label>
              <Select
                value={String(form.grade_level_id || "")}
                onValueChange={(v) =>
                  setForm((f) => {
                    const g = gradeLevels.find((x) => String(x.id) === v);
                    const needs =
                      g &&
                      (g.has_session ||
                        ["kindergarten 1", "kindergarten 2"].includes((g.name || "").toLowerCase()));
                    return {
                      ...f,
                      grade_level_id: v,
                      section_id: "",
                      class_session: needs ? f.class_session || "AM" : "",
                    };
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {gradeNeedsSession && (
              <div>
                <Label>Learner schedule (Kinder 1 / 2)</Label>
                <Select
                  value={form.class_session || "AM"}
                  onValueChange={(v) => setForm((f) => ({ ...f, class_session: v, section_id: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">Morning (AM)</SelectItem>
                    <SelectItem value="PM">Afternoon (PM)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sections list only shows classes that match this schedule.
                </p>
              </div>
            )}
            <div>
              <Label>Section (optional)</Label>
              <Select
                value={form.section_id ? String(form.section_id) : "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, section_id: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {sectionsForForm.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                      {s.session && s.session !== "whole_day" ? ` (${s.session})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Enrollment date</Label>
              <Input type="date" value={form.enrollment_date} onChange={(e) => setForm((f) => ({ ...f, enrollment_date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.enrollment_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, enrollment_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="continuing">Continuing</SelectItem>
                    <SelectItem value="transfer_in">Transfer in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="transferred_in">Transferred in</SelectItem>
                    <SelectItem value="transferred_out">Transferred out</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeForm}
              isLoading={closingForm}
              loadingText="Closing..."
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={submitForm}
              isLoading={createMutation.isPending || updateMutation.isPending}
              loadingText={editing ? "Updating..." : "Saving..."}
              disabled={closingForm}
              className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
            >
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => { if (!deleteMutation.isPending) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove enrollment?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes this school-year placement only — the learner record stays in Students unless you delete it there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

Enrollment.layout = (page) => <AppLayout currentPageName="Enrollment">{page}</AppLayout>;
