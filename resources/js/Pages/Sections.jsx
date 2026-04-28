import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { Plus, Edit2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const GRADE_LEVELS = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];

export default function Sections() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", grade_level: "", adviser_name: "", adviser_email: "", max_capacity: 50 });
  const queryClient = useQueryClient();

  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: () => base44.entities.Section.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Section.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sections"] }); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Section.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sections"] }); setShowForm(false); setEditing(null); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Section.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections"] }),
  });

  const resetForm = () => setForm({ name: "", grade_level: "", adviser_name: "", adviser_email: "", max_capacity: 50 });

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, grade_level: s.grade_level, adviser_name: s.adviser_name || "", adviser_email: s.adviser_email || "", max_capacity: s.max_capacity || 50 });
    setShowForm(true);
  };

  const getStudentCount = (sectionId) => students.filter(s => s.current_section_id === sectionId && s.status === "enrolled").length;

  // Group by grade level
  const grouped = {};
  sections.forEach(s => {
    if (!grouped[s.grade_level]) grouped[s.grade_level] = [];
    grouped[s.grade_level].push(s);
  });

  return (
    <div>
      <PageHeader
        title="Sections"
        description="Manage class sections per grade level"
        action={
          <Button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
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
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800">{s.name}</h4>
                            {s.adviser_name && <p className="text-xs text-slate-400 mt-0.5">Adviser: {s.adviser_name}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(s.id)}>
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
                            className="h-full bg-[#1e3a5f] rounded-full transition-all"
                            style={{ width: `${Math.min((count / (s.max_capacity || 50)) * 100, 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditing(null); resetForm(); }}>
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
              <Select value={form.grade_level} onValueChange={v => setForm({ ...form, grade_level: v })}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Adviser Name</Label>
                <Input value={form.adviser_name} onChange={e => setForm({ ...form, adviser_name: e.target.value })} />
              </div>
              <div>
                <Label>Max Capacity</Label>
                <Input type="number" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value) || 50 })} />
              </div>
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

Sections.layout = (page) => <AppLayout currentPageName="Sections">{page}</AppLayout>;
