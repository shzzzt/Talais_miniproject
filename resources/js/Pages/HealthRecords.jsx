import AppLayout from '@/Layouts/AppLayout';
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { HeartPulse, Plus, Download, AlertTriangle, Search, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StatCard from "../components/shared/StatCard";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { useAuth } from '@/lib/AuthContext';
import { toast } from "sonner";

function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return { bmi: 0, category: "Normal" };
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category = "Normal";
  if (bmi < 14.0) category = "Severely Wasted";
  else if (bmi < 18.5) category = "Wasted";
  else if (bmi < 25.0) category = "Normal";
  else if (bmi < 30.0) category = "Overweight";
  else category = "Obese";
  return { bmi: Math.round(bmi * 10) / 10, category };
}

function calculateAge(birthday) {
  if (!birthday) return 0;
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function HealthRecords() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [form, setForm] = useState({ height_cm: "", weight_kg: "", date_recorded: new Date().toISOString().split("T")[0], remarks: "" });
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: sections = [] } = useQuery({ queryKey: ["sections"], queryFn: () => base44.entities.Section.list() });
  const { data: faculty = [] } = useQuery({ queryKey: ["faculty"], queryFn: () => base44.entities.Faculty.list() });
  const { data: records = [] } = useQuery({ queryKey: ["healthRecords"], queryFn: () => base44.entities.HealthRecord.list("-created_date") });

  const currentFaculty = faculty.find((item) => String(item.user_id) === String(user?.id ?? ""));
  const isGradeLevelHead = Boolean(currentFaculty?.is_grade_level_head && currentFaculty?.grade_level_head_of);
  const gradeHeadLevel = currentFaculty?.grade_level_head?.name ?? "";
  const gradeHeadSections = useMemo(() => (
    sections
      .filter((section) => String(section.grade_level_id ?? "") === String(currentFaculty?.grade_level_head_of ?? ""))
      .sort((a, b) => a.name.localeCompare(b.name))
  ), [sections, currentFaculty?.grade_level_head_of]);
  const scopedStudents = useMemo(() => (
    students
      .filter((student) => student.status === "enrolled")
      .filter((student) => !isGradeLevelHead || String(student.current_grade_level_id) === String(currentFaculty?.grade_level_head_of))
      .filter((student) => selectedSection === "all" || String(student.current_section_id) === selectedSection)
      .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
  ), [students, isGradeLevelHead, currentFaculty?.grade_level_head_of, selectedSection]);
  const latestRecordByStudent = useMemo(() => {
    const map = new Map();
    records.forEach((record) => {
      const key = String(record.student_id);
      const existing = map.get(key);
      if (!existing || String(record.date_recorded ?? "") > String(existing.date_recorded ?? "")) {
        map.set(key, record);
      }
    });
    return map;
  }, [records]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HealthRecord.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["healthRecords"] }); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HealthRecord.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["healthRecords"] }); setShowForm(false); setEditing(null); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HealthRecord.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["healthRecords"] }),
  });

  const resetForm = () => {
    setForm({ height_cm: "", weight_kg: "", date_recorded: new Date().toISOString().split("T")[0], remarks: "" });
    setSelectedStudent("");
  };

  const handleSubmit = () => {
    const student = scopedStudents.find(s => String(s.id) === String(selectedStudent));
    if (!student && !editing) return;

    const target = editing ? students.find(s => String(s.id) === String(editing.student_id)) : student;
    const { bmi, category } = calculateBMI(parseFloat(form.weight_kg), parseFloat(form.height_cm));
    const age = calculateAge(target?.birthday);
    const needsFeeding = category === "Severely Wasted" || category === "Wasted";

    const data = {
      student_id: target.id,
      student_name: `${target.last_name}, ${target.first_name}`,
      grade_level: target.current_grade_level,
      section_name: target.current_section_name || "",
      height_cm: parseFloat(form.height_cm),
      weight_kg: parseFloat(form.weight_kg),
      bmi, bmi_category: category,
      feeding_program: needsFeeding,
      age_years: age,
      date_recorded: form.date_recorded,
      remarks: form.remarks,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (rec) => {
    setEditing(rec);
    setSelectedStudent(String(rec.student_id));
    setForm({ height_cm: rec.height_cm, weight_kg: rec.weight_kg, date_recorded: rec.date_recorded, remarks: rec.remarks || "" });
    setShowForm(true);
  };

  const openCreateForStudent = (studentId = "") => {
    if (!studentId && isGradeLevelHead && selectedSection === "all") {
      toast.error("Select a section first.");
      return;
    }
    setEditing(null);
    resetForm();
    setSelectedStudent(String(studentId));
    setShowForm(true);
  };

  const filtered = records.filter(r => {
    const matchSearch = (r.student_name || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || r.bmi_category === filterCategory;
    const matchScope = !isGradeLevelHead || scopedStudents.some((student) => String(student.id) === String(r.student_id));
    return matchSearch && matchCategory && matchScope;
  });

  const feedingCount = records.filter(r => r.feeding_program).length;
  const normalCount = records.filter(r => r.bmi_category === "Normal").length;

  const bmiColors = {
    "Severely Wasted": "bg-red-100 text-red-700",
    "Wasted": "bg-amber-100 text-amber-700",
    "Normal": "bg-emerald-100 text-emerald-700",
    "Overweight": "bg-orange-100 text-orange-700",
    "Obese": "bg-red-100 text-red-700",
  };

  const downloadCSV = () => {
    const csvRows = [["Student Name","Grade Level","Section","Height (cm)","Weight (kg)","BMI","Category","Feeding Program","Age","Date"]];
    records.forEach(r => {
      csvRows.push([r.student_name, r.grade_level, r.section_name, r.height_cm, r.weight_kg, r.bmi, r.bmi_category, r.feeding_program ? "Yes" : "No", r.age_years, r.date_recorded]);
    });
    const csv = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Health_Records.csv"; a.click();
  };

  return (
    <div>
      <PageHeader
        title="Student Health Records"
        description="Track student BMI and identify feeding program candidates"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
            <Button onClick={() => openCreateForStudent()} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
              <Plus className="w-4 h-4 mr-2" /> New Record
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard title="Total Records" value={records.length} icon={HeartPulse} color="blue" />
        <StatCard title="Normal BMI" value={normalCount} icon={HeartPulse} color="green" />
        <StatCard title="Feeding Program" value={feedingCount} icon={AlertTriangle} color="amber" />
        <StatCard title="Overweight/Obese" value={records.filter(r => r.bmi_category === "Overweight" || r.bmi_category === "Obese").length} icon={AlertTriangle} color="red" />
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {isGradeLevelHead && (
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{gradeHeadLevel || "Grade level"} sections</SelectItem>
                {gradeHeadSections.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)}>{section.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Severely Wasted">Severely Wasted</SelectItem>
              <SelectItem value="Wasted">Wasted</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Overweight">Overweight</SelectItem>
              <SelectItem value="Obese">Obese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isGradeLevelHead && (
        <Card className="border-0 shadow-sm overflow-hidden mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Students {selectedSection !== "all" ? "in selected section" : `in ${gradeHeadLevel}`}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {scopedStudents.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No enrolled students found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Section</TableHead>
                      <TableHead className="text-xs">Latest BMI</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs w-32">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopedStudents.map((student) => {
                      const latest = latestRecordByStudent.get(String(student.id));
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="text-sm font-medium">{student.last_name}, {student.first_name}</TableCell>
                          <TableCell className="text-sm text-slate-600">{student.current_section_name || "No section"}</TableCell>
                          <TableCell className="text-sm">{latest?.bmi ?? "No record"}</TableCell>
                          <TableCell>{latest?.bmi_category ? <Badge className={bmiColors[latest.bmi_category]}>{latest.bmi_category}</Badge> : null}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openCreateForStudent(student.id)}>
                              Edit
                            </Button>
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
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={HeartPulse} title="No health records" description="Add health records to track student BMI" />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Grade</TableHead>
                  <TableHead className="text-xs">Height</TableHead>
                  <TableHead className="text-xs">Weight</TableHead>
                  <TableHead className="text-xs">BMI</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Feeding</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.student_name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{r.grade_level}</TableCell>
                    <TableCell className="text-sm">{r.height_cm} cm</TableCell>
                    <TableCell className="text-sm">{r.weight_kg} kg</TableCell>
                    <TableCell className="text-sm font-bold">{r.bmi}</TableCell>
                    <TableCell><Badge className={bmiColors[r.bmi_category]}>{r.bmi_category}</Badge></TableCell>
                    <TableCell>
                      {r.feeding_program && <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="w-3 h-3 mr-1" /> Yes</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{r.date_recorded}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(r.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditing(null); resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Health Record" : "New Health Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div>
                <Label>Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {scopedStudents.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.last_name}, {s.first_name} - {s.current_grade_level} / {s.current_section_name || "No section"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Height (cm)</Label>
                <Input type="number" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} placeholder="e.g. 130" />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} placeholder="e.g. 30" />
              </div>
            </div>
            {form.height_cm && form.weight_kg && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Computed BMI:</span>
                  <span className="font-bold">{calculateBMI(parseFloat(form.weight_kg), parseFloat(form.height_cm)).bmi}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-slate-600">Category:</span>
                  <Badge className={bmiColors[calculateBMI(parseFloat(form.weight_kg), parseFloat(form.height_cm)).category]}>
                    {calculateBMI(parseFloat(form.weight_kg), parseFloat(form.height_cm)).category}
                  </Badge>
                </div>
              </div>
            )}
            <div>
              <Label>Date Recorded</Label>
              <Input type="date" value={form.date_recorded} onChange={e => setForm({ ...form, date_recorded: e.target.value })} />
            </div>
            <div>
              <Label>Remarks</Label>
              <Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={(!editing && !selectedStudent) || !form.height_cm || !form.weight_kg}
              className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
            >
              {editing ? "Update" : "Save Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

HealthRecords.layout = (page) => <AppLayout currentPageName="HealthRecords">{page}</AppLayout>;
