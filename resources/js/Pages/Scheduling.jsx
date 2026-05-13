import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { Plus, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PageHeader from "../components/shared/PageHeader";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-red-100 text-red-700 border-red-200",
];

export default function Scheduling() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedSection, setSelectedSection] = useState("All");
  const initialForm = {
    section_id: "",
    subject_id: "",
    faculty_id: "",
    day: "Monday",
    time_start: "07:00",
    time_end: "08:00",
  };
  const [form, setForm] = useState(initialForm);

  const { data: sections = [] } = useQuery({ queryKey: ["sections"], queryFn: () => base44.entities.Section.list() });
  
  // Get the selected section object to find its grade level
  const selectedSectionObj = sections.find(s => String(s.id) === form.section_id);
  const selectedGradeLevel = selectedSectionObj?.grade_level;
  const selectedGradeLevelId = selectedSectionObj?.grade_level_id;
  
  // Fetch subjects filtered by the selected section's grade level
  const { data: subjects = [], isFetching: isFetchingSubjects } = useQuery({
    queryKey: ["subjects-by-grade", selectedGradeLevelId],
    queryFn: async () => {
      if (!selectedGradeLevelId) {
        return []; // Return empty array if no grade level selected
      }
      try {
        const result = await base44.entities.Subject.filter({ primary_grade_level_id: selectedGradeLevelId });
        return Array.isArray(result) ? result : (result?.data ?? []);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        return [];
      }
    },
    enabled: !!selectedGradeLevelId, // Only enable when grade level is available
    staleTime: 0, // Don't cache
    gcTime: 0, // Don't cache
  });
  
  const selectedSubjectObj = subjects.find(s => String(s.id) === form.subject_id);
  const selectedSubjectDepartmentId = selectedSubjectObj?.department_id ?? null;
  const { data: faculty = [] } = useQuery({ queryKey: ["faculty"], queryFn: () => base44.entities.Faculty.list() });
  const filteredFaculty = form.subject_id
    ? faculty.filter(f => {
        const facultyDepartmentId = f.department_id ?? f.department?.id ?? null;
        return selectedSubjectDepartmentId
          ? Number(facultyDepartmentId) === Number(selectedSubjectDepartmentId)
          : facultyDepartmentId === null || facultyDepartmentId === "";
      })
    : [];
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["class-schedules"],
    queryFn: () => base44.entities.ClassSchedule.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.ClassSchedule.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-schedules"] });
      setShowForm(false);
      setForm(initialForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClassSchedule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["class-schedules"] }),
  });

  const sectionLabel = (s) => `${s.name}${s.grade_level ? ` (${s.grade_level})` : ''}`;
  const uniqueSectionLabels = ["All", ...new Set(schedules.map(s => s.section).filter(Boolean))];
  const filtered = selectedSection === "All" ? schedules : schedules.filter(s => s.section === selectedSection);

  const byDay = {};
  DAYS.forEach(d => { byDay[d] = filtered.filter(s => s.day === d).sort((a, b) => (a.time_start || '').localeCompare(b.time_start || '')); });

  const downloadCSV = () => {
    const rows = [["Section", "Subject", "Teacher", "Day", "Start", "End"]];
    schedules.forEach(s => rows.push([s.section || '', s.subject || '', s.teacher || '', s.day || '', s.time_start || '', s.time_end || '']));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Class_Schedules.csv"; a.click();
  };

  const handleAdd = () => {
    if (!form.section_id || !form.subject_id) return;
    createMutation.mutate({
      section_id: Number(form.section_id),
      subject_id: Number(form.subject_id),
      faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
      day_of_week: form.day,
      time_start: form.time_start,
      time_end: form.time_end,
    });
  };

  return (
    <div>
      <PageHeader
        title="Class Scheduling"
        description="Manage weekly class schedules per section and teacher"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
            <Button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              <Plus className="w-4 h-4 mr-2" /> Add Schedule
            </Button>
          </div>
        }
      />

      <div className="mb-5">
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>
            {uniqueSectionLabels.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {DAYS.map((day, di) => (
          <Card key={day} className="border-0 shadow-sm">
            <CardHeader className={`py-3 px-4 rounded-t-lg ${DAY_COLORS[di].split(' ').slice(0,1).join(' ')}`}>
              <CardTitle className={`text-sm font-bold ${DAY_COLORS[di].split(' ').slice(1).join(' ')}`}>{day}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 min-h-[120px]">
              {isLoading ? (
                <p className="text-xs text-slate-400 text-center pt-4">Loading...</p>
              ) : byDay[day].length === 0 ? (
                <p className="text-xs text-slate-400 text-center pt-4">No classes</p>
              ) : (
                byDay[day].map(s => (
                  <div key={s.id} className={`p-2 rounded-lg border text-xs ${DAY_COLORS[di]}`}>
                    <div className="font-bold">{s.subject}</div>
                    <div className="opacity-75">{s.section}</div>
                    <div className="opacity-75">{s.time_start} – {s.time_end}</div>
                    <div className="opacity-60 mt-1">{s.teacher || '—'}</div>
                    <button onClick={() => deleteMutation.mutate(s.id)} className="mt-1 text-red-500 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm mt-6">
        <CardHeader><CardTitle className="text-sm">All Schedules</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Section", "Subject", "Teacher", "Day", "Time", ""].map(h => (
                  <th key={h} className="text-left text-xs px-4 py-2 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-sm">{s.section}</td>
                  <td className="px-4 py-2.5 font-medium">{s.subject}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.teacher || '—'}</td>
                  <td className="px-4 py-2.5"><Badge variant="secondary">{s.day}</Badge></td>
                  <td className="px-4 py-2.5 text-slate-600">{s.time_start} – {s.time_end}</td>
                  <td className="px-4 py-2.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(s.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section</Label>
              <Select value={form.section_id} onValueChange={v => setForm({ ...form, section_id: v, subject_id: "", faculty_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{sectionLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject {selectedGradeLevel && <span className="text-xs text-slate-500">({selectedGradeLevel})</span>}</Label>
              <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v, faculty_id: "" })} disabled={!form.section_id || isFetchingSubjects || subjects.length === 0}>
                <SelectTrigger><SelectValue placeholder={form.section_id ? (isFetchingSubjects ? "Loading subjects..." : "Select subject") : "Select a section first"} /></SelectTrigger>
                <SelectContent>
                  {isFetchingSubjects ? (
                    <div className="p-2 text-sm text-slate-500">Loading subjects...</div>
                  ) : subjects.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">No subjects for this grade level</div>
                  ) : (
                    subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={form.faculty_id} onValueChange={v => setForm({ ...form, faculty_id: v })} disabled={!form.subject_id || filteredFaculty.length === 0}>
                <SelectTrigger><SelectValue placeholder={form.subject_id ? "Select faculty (optional)" : "Select a subject first"} /></SelectTrigger>
                <SelectContent>
                  {filteredFaculty.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">No matching teachers</div>
                  ) : (
                    filteredFaculty.map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.first_name} {f.last_name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Day</Label>
              <Select value={form.day} onValueChange={v => setForm({ ...form, day: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={form.time_start} onChange={e => setForm({ ...form, time_start: e.target.value })} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={form.time_end} onChange={e => setForm({ ...form, time_end: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.section_id || !form.subject_id || createMutation.isPending} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              {createMutation.isPending ? 'Saving...' : 'Add Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

Scheduling.layout = (page) => <AppLayout currentPageName="Scheduling">{page}</AppLayout>;
