import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Clock, Plus, Edit2, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = [
  "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM",
  "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM",
];

const DAY_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-red-100 text-red-700 border-red-200",
];

// Sample schedule data stored in-memory
const SAMPLE_SCHEDULES = [
  { id: 1, section: "Rizal (Grade 1)", subject: "Filipino", teacher: "Mrs. Santos", day: "Monday", time_start: "7:00 AM", time_end: "7:45 AM" },
  { id: 2, section: "Rizal (Grade 1)", subject: "Mathematics", teacher: "Mr. Reyes", day: "Monday", time_start: "7:45 AM", time_end: "8:30 AM" },
  { id: 3, section: "Rizal (Grade 1)", subject: "English", teacher: "Mrs. Cruz", day: "Monday", time_start: "8:30 AM", time_end: "9:15 AM" },
  { id: 4, section: "Rizal (Grade 1)", subject: "Science", teacher: "Mrs. Garcia", day: "Tuesday", time_start: "7:00 AM", time_end: "7:45 AM" },
  { id: 5, section: "Rizal (Grade 1)", subject: "MAPEH", teacher: "Mr. Torres", day: "Tuesday", time_start: "7:45 AM", time_end: "8:30 AM" },
  { id: 6, section: "Bonifacio (Grade 2)", subject: "Filipino", teacher: "Mrs. Santos", day: "Monday", time_start: "9:00 AM", time_end: "9:45 AM" },
  { id: 7, section: "Bonifacio (Grade 2)", subject: "Mathematics", teacher: "Mr. Reyes", day: "Wednesday", time_start: "7:00 AM", time_end: "7:45 AM" },
  { id: 8, section: "Luna (Grade 3)", subject: "Science", teacher: "Mrs. Garcia", day: "Thursday", time_start: "10:00 AM", time_end: "10:45 AM" },
];

export default function Scheduling() {
  const [schedules, setSchedules] = useState(SAMPLE_SCHEDULES);
  const [showForm, setShowForm] = useState(false);
  const [selectedSection, setSelectedSection] = useState("All");
  const [form, setForm] = useState({ section: "", subject: "", teacher: "", day: "Monday", time_start: "7:00 AM", time_end: "8:00 AM" });

  const { data: sections = [] } = useQuery({ queryKey: ["sections"], queryFn: () => base44.entities.Section.list() });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => base44.entities.Subject.list() });

  const handleAdd = () => {
    const newId = Math.max(...schedules.map(s => s.id), 0) + 1;
    setSchedules(prev => [...prev, { id: newId, ...form }]);
    setShowForm(false);
    setForm({ section: "", subject: "", teacher: "", day: "Monday", time_start: "7:00 AM", time_end: "8:00 AM" });
  };

  const handleDelete = (id) => setSchedules(prev => prev.filter(s => s.id !== id));

  const uniqueSections = ["All", ...new Set(schedules.map(s => s.section))];
  const filtered = selectedSection === "All" ? schedules : schedules.filter(s => s.section === selectedSection);

  const byDay = {};
  DAYS.forEach(d => { byDay[d] = filtered.filter(s => s.day === d); });

  const downloadCSV = () => {
    const rows = [["Section", "Subject", "Teacher", "Day", "Start", "End"]];
    schedules.forEach(s => rows.push([s.section, s.subject, s.teacher, s.day, s.time_start, s.time_end]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Class_Schedules.csv"; a.click();
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

      {/* Filter */}
      <div className="mb-5">
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>
            {uniqueSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly Grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {DAYS.map((day, di) => (
          <Card key={day} className="border-0 shadow-sm">
            <CardHeader className={`py-3 px-4 rounded-t-lg ${DAY_COLORS[di].split(' ').slice(0,1).join(' ')}`}>
              <CardTitle className={`text-sm font-bold ${DAY_COLORS[di].split(' ').slice(1).join(' ')}`}>{day}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 min-h-[120px]">
              {byDay[day].length === 0 ? (
                <p className="text-xs text-slate-400 text-center pt-4">No classes</p>
              ) : (
                byDay[day].sort((a, b) => a.time_start.localeCompare(b.time_start)).map(s => (
                  <div key={s.id} className={`p-2 rounded-lg border text-xs ${DAY_COLORS[di]}`}>
                    <div className="font-bold">{s.subject}</div>
                    <div className="opacity-75">{s.section}</div>
                    <div className="opacity-75">{s.time_start} – {s.time_end}</div>
                    <div className="opacity-60 mt-1">{s.teacher}</div>
                    <button onClick={() => handleDelete(s.id)} className="mt-1 text-red-500 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Table */}
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
                  <td className="px-4 py-2.5 text-slate-600">{s.teacher}</td>
                  <td className="px-4 py-2.5"><Badge variant="secondary">{s.day}</Badge></td>
                  <td className="px-4 py-2.5 text-slate-600">{s.time_start} – {s.time_end}</td>
                  <td className="px-4 py-2.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Section</Label>
              <Select value={form.section} onValueChange={v => setForm({ ...form, section: v })}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={`${s.name} (${s.grade_level})`}>{s.name} – {s.grade_level}</SelectItem>)}
                  <SelectItem value="Rizal (Grade 1)">Rizal (Grade 1)</SelectItem>
                  <SelectItem value="Bonifacio (Grade 2)">Bonifacio (Grade 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Subject</Label>
              <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  <SelectItem value="Filipino">Filipino</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Teacher</Label>
              <Input value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} placeholder="Teacher name" />
            </div>
            <div><Label>Day</Label>
              <Select value={form.day} onValueChange={v => setForm({ ...form, day: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label>
                <Select value={form.time_start} onValueChange={v => setForm({ ...form, time_start: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>End Time</Label>
                <Select value={form.time_end} onValueChange={v => setForm({ ...form, time_end: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.section || !form.subject} className="bg-[#1e3a5f] hover:bg-[#2c5282]">Add Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}