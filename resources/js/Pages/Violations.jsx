import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { Plus, Search, Download, Shield, Trash2 } from "lucide-react";
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

export default function Violations() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const initialForm = {
    student_id: "",
    date_of_incident: new Date().toISOString().split("T")[0],
    violation_type: "",
    severity: "minor",
    description: "",
    action_taken: "",
  };
  const [form, setForm] = useState(initialForm);

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: violations = [], isLoading } = useQuery({
    queryKey: ['violations'],
    queryFn: () => base44.entities.Violation.list('-date_of_incident'),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.Violation.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      setShowForm(false);
      setForm(initialForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Violation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['violations'] }),
  });

  const filtered = violations.filter(v => {
    const term = search.toLowerCase();
    const matchSearch = !term
      || (v.student_name || '').toLowerCase().includes(term)
      || (v.violation_type || '').toLowerCase().includes(term);
    const matchSeverity = filterSeverity === "All" || v.severity === filterSeverity;
    return matchSearch && matchSeverity;
  });

  const downloadCSV = () => {
    const rows = [["Student", "Grade", "Section", "Date", "Type", "Severity", "Description", "Action"]];
    violations.forEach(v => rows.push([
      v.student_name || '',
      v.grade_level || '',
      v.section || '',
      v.date_of_incident || '',
      v.violation_type || '',
      v.severity || '',
      `"${(v.description || '').replace(/"/g, '""')}"`,
      `"${(v.action_taken || '').replace(/"/g, '""')}"`,
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Violations_Report.csv"; a.click();
  };

  const severityColors = { minor: "bg-amber-100 text-amber-700", major: "bg-red-100 text-red-700" };

  const handleSubmit = () => {
    if (!form.student_id || !form.violation_type) return;
    createMutation.mutate({
      student_id: Number(form.student_id),
      date_of_incident: form.date_of_incident,
      violation_type: form.violation_type,
      severity: form.severity,
      description: form.description,
      action_taken: form.action_taken,
    });
  };

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

      {isLoading ? (
        <div className="text-center py-8 text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
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
                <TableHead className="text-xs w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(v => (
                <TableRow key={v.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-sm">{v.student_name}</TableCell>
                  <TableCell className="text-sm text-slate-600">{v.grade_level} {v.section ? `– ${v.section}` : ''}</TableCell>
                  <TableCell className="text-sm text-slate-600">{v.date_of_incident}</TableCell>
                  <TableCell className="text-sm">{v.violation_type}</TableCell>
                  <TableCell><Badge className={severityColors[v.severity]}>{v.severity}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-xs truncate">{v.description}</TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-xs truncate">{v.action_taken}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(v.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Violation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Student</Label>
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.status === 'enrolled').map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.last_name}, {s.first_name} {s.current_grade_level ? `– ${s.current_grade_level}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date_of_incident} onChange={e => setForm({ ...form, date_of_incident: e.target.value })} />
              </div>
              <div>
                <Label>Violation Type</Label>
                <Select value={form.violation_type} onValueChange={v => setForm({ ...form, violation_type: v })}>
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
            <div>
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the incident..." />
            </div>
            <div>
              <Label>Action Taken</Label>
              <Textarea value={form.action_taken} onChange={e => setForm({ ...form, action_taken: e.target.value })} rows={2} placeholder="Disciplinary action applied..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.student_id || !form.violation_type || createMutation.isPending}
              className="bg-[#1e3a5f] hover:bg-[#2c5282]"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

Violations.layout = (page) => <AppLayout currentPageName="Violations">{page}</AppLayout>;
