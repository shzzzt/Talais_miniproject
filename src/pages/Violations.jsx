import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Plus, Search, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const SAMPLE_VIOLATIONS = [
  { id: 1, student_name: "Cruz, Juan", grade_level: "Grade 1", section: "Rizal", date: "2025-09-15", type: "Tardiness", severity: "minor", description: "Student arrived 30 minutes late without excuse.", action: "Verbal warning given. Parents notified.", recorded_by: "Mrs. Santos" },
  { id: 2, student_name: "Torres, Carlo", grade_level: "Grade 2", section: "Bonifacio", date: "2025-10-02", type: "Misconduct", severity: "major", description: "Student involved in a physical altercation during recess.", action: "Called to principal's office. Written notice to parents.", recorded_by: "Mr. Reyes" },
  { id: 3, student_name: "Reyes, Maria", grade_level: "Grade 1", section: "Rizal", date: "2025-10-10", type: "Uniform Violation", severity: "minor", description: "Student not wearing complete school uniform.", action: "Reminder given. No further action.", recorded_by: "Mrs. Santos" },
  { id: 4, student_name: "Garcia, Sofia", grade_level: "Grade 1", section: "Mabini", date: "2025-11-03", type: "Tardiness", severity: "minor", description: "Student arrived late for the 3rd time this quarter.", action: "Written notice sent to parents.", recorded_by: "Mrs. Cruz" },
];

export default function Violations() {
  const [violations, setViolations] = useState(SAMPLE_VIOLATIONS);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [form, setForm] = useState({
    student_name: "", grade_level: "", section: "", date: new Date().toISOString().split("T")[0],
    type: "", severity: "minor", description: "", action: ""
  });

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });

  const handleAdd = () => {
    const newId = Math.max(...violations.map(v => v.id), 0) + 1;
    setViolations(prev => [...prev, { id: newId, ...form, recorded_by: "Current User" }]);
    setShowForm(false);
    setForm({ student_name: "", grade_level: "", section: "", date: new Date().toISOString().split("T")[0], type: "", severity: "minor", description: "", action: "" });
  };

  const filtered = violations.filter(v => {
    const matchSearch = v.student_name.toLowerCase().includes(search.toLowerCase()) || v.type.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === "All" || v.severity === filterSeverity;
    return matchSearch && matchSeverity;
  });

  const downloadCSV = () => {
    const rows = [["Student", "Grade", "Section", "Date", "Type", "Severity", "Description", "Action"]];
    violations.forEach(v => rows.push([v.student_name, v.grade_level, v.section, v.date, v.type, v.severity, `"${v.description}"`, `"${v.action}"`]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Violations_Report.csv"; a.click();
  };

  const severityColors = { minor: "bg-amber-100 text-amber-700", major: "bg-red-100 text-red-700" };

  return (
    <div>
      <PageHeader
        title="Student Violations"
        description="Record and track student behavioral incidents"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
            <Button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              <Plus className="w-4 h-4 mr-2" /> Record Violation
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{violations.length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Minor</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{violations.filter(v => v.severity === "minor").length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Major</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{violations.filter(v => v.severity === "major").length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search student or violation type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="major">Major</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title="No violations recorded" description="Record a student violation to get started" />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">Grade & Section</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Severity</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Action Taken</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(v => (
                <TableRow key={v.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-sm">{v.student_name}</TableCell>
                  <TableCell className="text-sm text-slate-600">{v.grade_level} – {v.section}</TableCell>
                  <TableCell className="text-sm text-slate-600">{v.date}</TableCell>
                  <TableCell className="text-sm">{v.type}</TableCell>
                  <TableCell><Badge className={severityColors[v.severity]}>{v.severity}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-xs truncate">{v.description}</TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-xs truncate">{v.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Violation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Student Name</Label>
              <Select value={form.student_name} onValueChange={v => {
                const s = students.find(st => `${st.last_name}, ${st.first_name}` === v);
                setForm({ ...form, student_name: v, grade_level: s?.current_grade_level || "", section: s?.current_section_name || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.status === "enrolled").map(s => (
                    <SelectItem key={s.id} value={`${s.last_name}, ${s.first_name}`}>{s.last_name}, {s.first_name} – {s.current_grade_level}</SelectItem>
                  ))}
                  <SelectItem value="Cruz, Juan">Cruz, Juan – Grade 1</SelectItem>
                  <SelectItem value="Reyes, Maria">Reyes, Maria – Grade 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div><Label>Violation Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tardiness">Tardiness</SelectItem>
                    <SelectItem value="Misconduct">Misconduct</SelectItem>
                    <SelectItem value="Uniform Violation">Uniform Violation</SelectItem>
                    <SelectItem value="Cheating">Cheating</SelectItem>
                    <SelectItem value="Bullying">Bullying</SelectItem>
                    <SelectItem value="Vandalism">Vandalism</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Severity</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the incident..." />
            </div>
            <div><Label>Action Taken</Label>
              <Textarea value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} rows={2} placeholder="Disciplinary action applied..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.student_name || !form.type} className="bg-[#1e3a5f] hover:bg-[#2c5282]">Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}