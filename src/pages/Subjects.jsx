import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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

const GRADE_LEVELS = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];

export default function Subjects() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", grade_level: "", teacher_name: "" });
  const [filterGrade, setFilterGrade] = useState("All");
  const queryClient = useQueryClient();

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Subject.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subjects"] }); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subject.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subjects"] }); setShowForm(false); setEditing(null); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Subject.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const resetForm = () => setForm({ name: "", code: "", grade_level: "", teacher_name: "" });

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code || "", grade_level: s.grade_level, teacher_name: s.teacher_name || "" });
    setShowForm(true);
  };

  const filtered = filterGrade === "All" ? subjects : subjects.filter(s => s.grade_level === filterGrade);

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Manage subject offerings per grade level"
        action={
          <Button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
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
                <TableHead className="text-xs">Teacher</TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs font-mono text-slate-500">{s.code}</TableCell>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell><Badge variant="secondary">{s.grade_level}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-600">{s.teacher_name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(s.id)}>
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

      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditing(null); resetForm(); }}>
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
              <Select value={form.grade_level} onValueChange={v => setForm({ ...form, grade_level: v })}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher Name</Label>
              <Input value={form.teacher_name} onChange={e => setForm({ ...form, teacher_name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.grade_level} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}