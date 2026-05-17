import AppLayout from '@/Layouts/AppLayout';
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44, http } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { extractApiError } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const GRADE_LEVELS = [
  "Kindergarten 1",
  "Kindergarten 2",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

function gradeUsesSessionScheduling(gradeName, gradeLevels = []) {
  const g = gradeLevels.find((x) => x.name === gradeName);
  if (!g) {
    return /^Kindergarten\s*1$/i.test(gradeName) || /^Kindergarten\s*2$/i.test(gradeName);
  }
  return !!g.has_session || /^Kindergarten\s*1$/i.test(g.name) || /^Kindergarten\s*2$/i.test(g.name);
}

const ENROLLMENT_ACTIVE = new Set(["enrolled", "pending"]);
const NONE_ADVISER = "__none__";

function facultyDisplayName(f) {
  return [f.last_name, f.first_name, f.middle_name].filter(Boolean).join(", ") || f.user?.name || "Unnamed teacher";
}

function enrollmentDisplayName(e) {
  const s = e?.student;
  if (!s) return "—";
  const parts = [s.last_name, s.first_name, s.middle_name].filter(Boolean);
  return parts.join(", ") || "—";
}
const GRADE_LEVELS = ["Kindergarten","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6"];

export default function Sections() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [manageSection, setManageSection] = useState(null);
  const [manageSearch, setManageSearch] = useState("");
  const [closingSectionForm, setClosingSectionForm] = useState(false);
  const [closingManageDialog, setClosingManageDialog] = useState(false);
  const [deletingSectionId, setDeletingSectionId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    grade_level: "",
    type: "regular",
    session: "whole_day",
    adviser_id: NONE_ADVISER,
    adviser_name: "",
    adviser_email: "",
    max_capacity: 50,
  });
  const queryClient = useQueryClient();

  const canAssignToSection =
    user &&
    (["admin", "school_admin"].includes(user.role) ||
      (user.role === "faculty" && user.is_grade_level_head));

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["schoolYears"],
    queryFn: () => base44.entities.SchoolYear.list("-created_date"),
  });
  const activeYear = schoolYears.find((y) => y.is_active);

  const { data: sections = [] } = useQuery({
    queryKey: ["sections", activeYear?.id],
    queryFn: () =>
      activeYear?.id
        ? base44.entities.Section.filter({ school_year_id: activeYear.id })
        : base44.entities.Section.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: gradeLevels = [] } = useQuery({
    queryKey: ["gradeLevels", "sections"],
    queryFn: () => base44.entities.GradeLevel.list(),
  });

  const { data: adviserOptions = [] } = useQuery({
    queryKey: ["faculty", "section-advisers"],
    queryFn: async () => {
      const rows = await base44.entities.Faculty.list(undefined, 500);
      return rows
        .filter((f) => f.user?.id && f.user?.status !== "inactive" && f.user?.status !== "suspended")
        .map((f) => ({
          id: f.user.id,
          name: facultyDisplayName(f),
          email: f.user.email,
        }));
    },
  });

  const { data: gradeEnrollments = [], isFetching: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments", "section-manage", activeYear?.id, manageSection?.id],
    queryFn: async () => {
      if (!activeYear?.id || !manageSection?.grade_level_id) return [];
      const { data } = await http.get("/enrollments", {
        params: {
          school_year_id: activeYear.id,
          grade_level_id: manageSection.grade_level_id,
          limit: 1000,
        },
      });
      const list = data?.data ?? [];
      return list.filter((e) => ENROLLMENT_ACTIVE.has(e.status));
    },
    enabled: !!activeYear?.id && !!manageSection?.grade_level_id,
  });

  const assignEnrollmentMutation = useMutation({
    mutationFn: async ({ enrollmentId, sectionId }) => {
      await http.put(`/enrollments/${enrollmentId}`, { section_id: sectionId });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", "section-manage"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      toast.success(vars.sectionId ? "Student assigned to section" : "Student removed from section");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Section.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      setShowForm(false);
      resetForm();
      toast.success("Section created");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Section.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      setShowForm(false);
      setEditing(null);
      resetForm();
      toast.success("Section updated");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Section.delete(id),
    onMutate: (id) => setDeletingSectionId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      toast.success("Section deleted");
    },
    onError: (e) => toast.error(extractApiError(e)),
    onSettled: () => setDeletingSectionId(null),
  });

  const resetForm = () =>
    setForm({
      name: "",
      grade_level: "",
      type: "regular",
      session: "whole_day",
      adviser_id: NONE_ADVISER,
      adviser_name: "",
      adviser_email: "",
      max_capacity: 50,
    });

  const handleSubmit = () => {
    const payload = {
      ...form,
      adviser_id: form.adviser_id === NONE_ADVISER ? null : Number(form.adviser_id),
    };
    if (gradeUsesSessionScheduling(form.grade_level, gradeLevels)) {
      payload.session = form.session === "PM" ? "PM" : "AM";
    } else {
      payload.session = form.session || "whole_day";
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const sectionFormBusy = createMutation.isPending || updateMutation.isPending || closingSectionForm;
  const sectionSaveText = editing ? "Updating..." : "Creating...";

  const closeSectionForm = () => {
    if (sectionFormBusy) return;
    setClosingSectionForm(true);
    window.setTimeout(() => {
      setShowForm(false);
      setEditing(null);
      resetForm();
      setClosingSectionForm(false);
      toast.message("Section form closed");
    }, 150);
  };

  const closeManageDialog = () => {
    if (closingManageDialog || assignEnrollmentMutation.isPending) return;
    setClosingManageDialog(true);
    window.setTimeout(() => {
      setManageSection(null);
      setManageSearch("");
      setClosingManageDialog(false);
      toast.message("Student manager closed");
    }, 150);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      grade_level: s.grade_level,
      type: s.type || "regular",
      session: s.session || "whole_day",
      adviser_id: s.adviser_id ? String(s.adviser_id) : NONE_ADVISER,
      adviser_name: s.adviser_name || "",
      adviser_email: s.adviser_email || "",
      max_capacity: s.max_capacity || 50,
    });
    setShowForm(true);
  };

  const getStudentCount = (sectionId) => students.filter(s => s.current_section_id === sectionId && s.status === "enrolled").length;

  // Group by grade level
  const grouped = {};
  sections.forEach(s => {
    if (!grouped[s.grade_level]) grouped[s.grade_level] = [];
    grouped[s.grade_level].push(s);
  });

  const manageEligible = useMemo(() => {
    if (!manageSection) return [];
    const split = !!manageSection.grade_uses_session_scheduling;
    return gradeEnrollments.filter((e) => {
      const sid = e.section_id;
      if (sid == null || sid === "") {
        if (split) {
          return e.class_session == null || e.class_session === manageSection.session;
        }
        return true;
      }
      return Number(sid) === Number(manageSection.id);
    });
  }, [gradeEnrollments, manageSection]);

  const manageFiltered = useMemo(() => {
    if (!manageSection) return [];
    const q = manageSearch.trim().toLowerCase();
    let list = manageEligible;
    if (q) {
      list = list.filter((e) => {
        const name = enrollmentDisplayName(e).toLowerCase();
        const lrn = String(e.student?.lrn ?? "").toLowerCase();
        return name.includes(q) || lrn.includes(q);
      });
    }
    return [...list].sort((a, b) => {
      const aHere = Number(a.section_id) === Number(manageSection.id) ? 0 : 1;
      const bHere = Number(b.section_id) === Number(manageSection.id) ? 0 : 1;
      if (aHere !== bHere) return aHere - bHere;
      return enrollmentDisplayName(a).localeCompare(enrollmentDisplayName(b));
    });
  }, [manageEligible, manageSearch, manageSection]);

  const inManageSectionCount = useMemo(() => {
    if (!manageSection) return 0;
    return gradeEnrollments.filter((e) => Number(e.section_id) === Number(manageSection.id)).length;
  }, [gradeEnrollments, manageSection]);

  const manageCapacity = manageSection ? (manageSection.max_capacity || 40) : 0;
  const manageFull = manageSection && inManageSectionCount >= manageCapacity;

  return (
    <div>
      <PageHeader
        title="Sections"
        description="Manage class sections per grade level"
        action={
          <Button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
            <Plus className="w-4 h-4 mr-2" /> Add Section
          </Button>
        }
      />

      {sections.length === 0 ? (
        <EmptyState icon={Users} title="No sections yet" description="Create sections to organize students" />
      ) : (
        <div className="space-y-6">
          {GRADE_LEVELS.filter(g => grouped[g]).map(grade => (
            <div key={grade}>
              <h3 className="text-sm font-semibold text-slate-500 mb-3">{grade}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[grade].map(s => {
                  const count = getStudentCount(s.id);
                  return (
                    <Card key={s.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-800">{s.name}</h4>
                              {s.type === "cream" ? (
                                <Badge className="bg-amber-100 text-amber-900 border-amber-200/80 gap-0.5 font-medium shrink-0">
                                  <Star className="w-3 h-3" /> Cream
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="font-medium text-slate-700 shrink-0">Regular</Badge>
                              )}
                              {(s.session === "AM" || s.session === "PM") && (
                                <Badge variant="outline" className="text-[10px] font-medium shrink-0 border-slate-300">
                                  {s.session === "AM" ? "Morning" : "Afternoon"}
                                </Badge>
                              )}
                            </div>
                            {s.adviser_name && <p className="text-xs text-slate-400 mt-0.5">Adviser: {s.adviser_name}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)} disabled={deleteMutation.isPending}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              isLoading={deletingSectionId === s.id}
                              onClick={() => deleteMutation.mutate(s.id)}
                              title="Delete section"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600">{count} / {s.max_capacity} students</span>
                        </div>
                        <div className="mt-2 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-[var(--theme-primary)] rounded-full transition-all"
                            style={{ width: `${Math.min((count / (s.max_capacity || 50)) * 100, 100)}%` }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full mt-3 border-slate-200"
                          disabled={!activeYear?.id}
                          onClick={() => {
                            setManageSearch("");
                            setManageSection(s);
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Manage students
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!manageSection}
        onOpenChange={(open) => {
          if (!open) closeManageDialog();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Manage students — {manageSection?.name}
              {manageSection?.grade_level && (
                <span className="block text-sm font-normal text-slate-500 mt-1">{manageSection.grade_level}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {!activeYear?.id ? (
            <p className="text-sm text-slate-500">Select an active school year to assign students.</p>
          ) : (
            <>
              {!canAssignToSection && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 shrink-0">
                  Only school administrators and grade-level heads can change section assignments.
                </p>
              )}
              <div className="space-y-2 shrink-0">
                <Label htmlFor="manage-students-search">Search</Label>
                <Input
                  id="manage-students-search"
                  placeholder="Name or LRN…"
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  className="bg-white"
                />
                <p className="text-xs text-slate-500">
                  Only learners <strong className="font-medium text-slate-600">in this section</strong> or{" "}
                  <strong className="font-medium text-slate-600">unassigned</strong> for this grade are listed. Students
                  placed in another section won&apos;t appear here.
                  {manageSection?.grade_uses_session_scheduling && (
                    <>
                      {" "}
                      For Kindergarten 1 / 2, only learners with the same <strong>morning or afternoon</strong> schedule
                      as this section (or no schedule yet) can be added.
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {inManageSectionCount} / {manageCapacity} in this section
                  {manageFull && " · Section is full — remove a learner or raise capacity to add more."}
                </p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto border rounded-md mt-2">
                {enrollmentsLoading ? (
                  <div className="p-8 text-center text-sm text-slate-500">Loading enrollments…</div>
                ) : manageFiltered.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 space-y-2 max-w-md mx-auto">
                    {manageEligible.length === 0 && !manageSearch.trim() ? (
                      <>
                        <p>No students to show for this section.</p>
                        <p className="text-xs text-slate-400">
                          Unassigned learners in this grade can be added here. To move someone from another section,
                          open that section and remove them first — then they will appear as unassigned here.
                        </p>
                      </>
                    ) : (
                      <p>No results match your search.</p>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="font-semibold">Student</TableHead>
                        <TableHead className="font-semibold">LRN</TableHead>
                        {manageSection?.grade_uses_session_scheduling && (
                          <TableHead className="font-semibold w-[100px]">Schedule</TableHead>
                        )}
                        <TableHead className="font-semibold">Current section</TableHead>
                        <TableHead className="w-[140px] font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manageFiltered.map((e) => {
                        const here = Number(e.section_id) === Number(manageSection?.id);
                        const otherName = e.section?.name;
                        const assignDisabled =
                          assignEnrollmentMutation.isPending ||
                          !canAssignToSection ||
                          (!here && manageFull);
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium text-slate-800">{enrollmentDisplayName(e)}</TableCell>
                            <TableCell className="text-slate-600 tabular-nums text-sm">{e.student?.lrn ?? "—"}</TableCell>
                            {manageSection?.grade_uses_session_scheduling && (
                              <TableCell className="text-sm text-slate-600">
                                {e.class_session === "AM" ? "Morning" : e.class_session === "PM" ? "Afternoon" : "—"}
                              </TableCell>
                            )}
                            <TableCell className="text-sm text-slate-600">
                              {here ? (
                                <span className="text-[var(--theme-primary)] font-medium">{manageSection.name}</span>
                              ) : otherName ? (
                                otherName
                              ) : (
                                <span className="text-slate-400">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {here ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={assignEnrollmentMutation.isPending || !canAssignToSection}
                                  isLoading={assignEnrollmentMutation.isPending}
                                  loadingText="Removing..."
                                  onClick={() =>
                                    assignEnrollmentMutation.mutate({ enrollmentId: e.id, sectionId: null })
                                  }
                                >
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
                                  disabled={assignDisabled}
                                  isLoading={assignEnrollmentMutation.isPending}
                                  loadingText="Assigning..."
                                  onClick={() =>
                                    assignEnrollmentMutation.mutate({
                                      enrollmentId: e.id,
                                      sectionId: manageSection.id,
                                    })
                                  }
                                >
                                  Assign here
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
          <DialogFooter className="shrink-0 sm:justify-end">
            <Button
              variant="outline"
              onClick={closeManageDialog}
              isLoading={closingManageDialog}
              loadingText="Closing..."
              disabled={assignEnrollmentMutation.isPending}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeSectionForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Section" : "New Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rizal" />
            </div>
            <div>
              <Label>Grade Level</Label>
              <Select
                value={form.grade_level}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    grade_level: v,
                    session: gradeUsesSessionScheduling(v, gradeLevels) ? "AM" : "whole_day",
                  }))
                }
              >
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {gradeUsesSessionScheduling(form.grade_level, gradeLevels) && (
              <div>
                <Label>Section schedule</Label>
                <Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">Morning (AM)</SelectItem>
                    <SelectItem value="PM">Afternoon (PM)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kindergarten 1 and Kindergarten 2 use morning or afternoon sections (e.g. two &quot;Molave&quot; rows: one AM, one PM).
                </p>
              </div>
            )}
            <div>
              <Label>Section type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cream">Cream (honors)</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Adviser</Label>
                <Select value={form.adviser_id} onValueChange={(v) => setForm({ ...form, adviser_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_ADVISER}>No adviser</SelectItem>
                    {adviserOptions.map((teacher) => (
                      <SelectItem key={teacher.id} value={String(teacher.id)}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Capacity</Label>
                <Input type="number" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value) || 50 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeSectionForm}
              isLoading={closingSectionForm}
              loadingText="Closing..."
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || !form.grade_level || closingSectionForm}
              isLoading={createMutation.isPending || updateMutation.isPending}
              loadingText={sectionSaveText}
              className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
            >
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

Sections.layout = (page) => <AppLayout currentPageName="Sections">{page}</AppLayout>;
