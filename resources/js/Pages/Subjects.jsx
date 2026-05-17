import AppLayout from '@/Layouts/AppLayout';
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44, http } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const GRADE_LEVELS = ["Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
const NONE_DEPT = "__none__";

function departmentOptionLabel(d) {
  return d.name;
}

function isDepartmentalizedGrade(gradeName) {
  if (!gradeName) return false;
  const gradeNum = parseInt(gradeName.replace('Grade ', ''), 10);
  return gradeNum >= 4;
}

export default function Subjects() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [closingForm, setClosingForm] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    grade_level: "",
    minutes_per_day: "50",
    department_id: NONE_DEPT,
  });  const [filterGrade, setFilterGrade] = useState("All");
  const queryClient = useQueryClient();

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list(),
  });

  const { data: departmentsList = [] } = useQuery({
    queryKey: ["departments-subjects"],
    queryFn: async () => {
      const { data } = await http.get("/departments");
      return data?.data ?? [];
    },
  });

  const departmentsForSelect = useMemo(() => {
    return departmentsList;
  }, [departmentsList]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Subject.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setShowForm(false);
      resetForm();
      toast.success("Subject created");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subject.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setShowForm(false);
      setEditing(null);
      resetForm();
      toast.success("Subject updated");
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Subject.delete(id),
    onMutate: (id) => setDeletingSubjectId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
    onError: (e) => toast.error(extractApiError(e)),
    onSettled: () => setDeletingSubjectId(null),
  });

  const resetForm = () =>
    setForm({
      name: "",
      code: "",
      grade_level: "",
      minutes_per_day: "50",
      department_id: NONE_DEPT,
    });
  const handleSubmit = () => {
    const minutes = form.minutes_per_day === "" ? undefined : parseInt(form.minutes_per_day, 10);
    const deptId =
      form.department_id === NONE_DEPT || form.department_id === ""
        ? null
        : Number(form.department_id);
    const payload = {
      name: form.name,
      code: form.code || undefined,
      grade_level: form.grade_level,
      minutes_per_day: Number.isFinite(minutes) ? minutes : undefined,
      department_id: deptId,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formBusy = createMutation.isPending || updateMutation.isPending || closingForm;

  const closeForm = () => {
    if (formBusy) return;
    setClosingForm(true);
    window.setTimeout(() => {
      setShowForm(false);
      setEditing(null);
      resetForm();
      setClosingForm(false);
      toast.message("Subject form closed");
    }, 150);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code || "",
      grade_level: s.grade_level,
      minutes_per_day: s.minutes_per_day != null ? String(s.minutes_per_day) : "45",
      department_id:
        s.department?.id != null
          ? String(s.department.id)
          : s.department_id != null
            ? String(s.department_id)
            : NONE_DEPT,
    });
    setShowForm(true);
  };

  const filtered = filterGrade === "All" ? subjects : subjects.filter(s => s.grade_level === filterGrade);

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Manage subject offerings per grade level"
        action={
          <Button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
            <Plus className="w-4 h-4 mr-2" /> Add Subject
          </Button>
        }
      />

      <div className="mb-4">
        <Select value={filterGrade} onValueChange={setFilterGrade}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Grades</SelectItem>
            {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects found" description="Add subjects for each grade level" />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs">Subject Name</TableHead>
                <TableHead className="text-xs">Grade Level</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Minutes / day</TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs font-mono text-slate-500">{s.code}</TableCell>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell><Badge variant="secondary">{s.grade_level}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-[220px]">
                    {s.department ? departmentOptionLabel(s.department) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{s.minutes_per_day ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)} disabled={deleteMutation.isPending}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        isLoading={deletingSubjectId === s.id}
                        onClick={() => deleteMutation.mutate(s.id)}
                        title="Delete subject"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Subject" : "New Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <Label>Code</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. MATH" />
              </div>
            </div>
            <div>
              <Label>Grade Level</Label>
              <Select
                value={form.grade_level}
                onValueChange={(v) => setForm({ ...form, grade_level: v, department_id: NONE_DEPT })}
              >
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department (optional)</Label>
              <p className="text-[11px] text-slate-400 mb-1">
                {!isDepartmentalizedGrade(form.grade_level)
                  ? "Departments are only available for Grade 4 and above."
                  : "Link this subject to a department when applicable."}
              </p>
              <Select
                value={form.department_id || NONE_DEPT}
                onValueChange={(v) => setForm({ ...form, department_id: v })}
                disabled={!isDepartmentalizedGrade(form.grade_level)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !isDepartmentalizedGrade(form.grade_level)
                        ? "Not available for this grade"
                        : departmentsForSelect.length === 0
                          ? "No departments available"
                          : "None"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_DEPT}>None</SelectItem>
                  {departmentsForSelect.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {departmentOptionLabel(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Minutes per day</Label>
              <Input
                type="number"
                min={0}
                max={600}
                value={form.minutes_per_day}
                onChange={(e) => setForm({ ...form, minutes_per_day: e.target.value })}
              />
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
              onClick={handleSubmit}
              disabled={!form.name || !form.grade_level || closingForm}
              isLoading={createMutation.isPending || updateMutation.isPending}
              loadingText={editing ? "Updating..." : "Creating..."}
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

Subjects.layout = (page) => <AppLayout currentPageName="Subjects">{page}</AppLayout>;
