import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Edit2, Trash2, Download, Users, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import StudentForm from "../components/enrollment/StudentForm";

const GRADE_LEVELS = ["All","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];

export default function Students() {
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date"),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: () => base44.entities.Section.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); setShowForm(false); setEditingStudent(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Student.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); setDeleteId(null); },
  });

  const handleSubmit = (formData) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = `${s.first_name} ${s.last_name} ${s.lrn}`.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "All" || s.current_grade_level === gradeFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchGrade && matchStatus;
  });

  const statusColors = {
    enrolled: "bg-emerald-100 text-emerald-700",
    transferred_in: "bg-blue-100 text-blue-700",
    transferred_out: "bg-amber-100 text-amber-700",
    dropped: "bg-red-100 text-red-700",
    graduated: "bg-purple-100 text-purple-700",
  };

  // SF1 Download (CSV)
  const downloadSF1 = () => {
    const enrolledStudents = students.filter(s => s.status === "enrolled");
    const csvRows = [
      ["LRN","Last Name","First Name","Middle Name","Gender","Birthday","Grade Level","Section","Parent/Guardian","Parent Contact"]
    ];
    enrolledStudents.forEach(s => {
      csvRows.push([s.lrn, s.last_name, s.first_name, s.middle_name, s.gender, s.birthday, s.current_grade_level, s.current_section_name, s.parent_name, s.parent_contact]);
    });
    const csv = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "SF1_School_Register.csv"; a.click();
  };

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${filtered.length} student${filtered.length !== 1 ? "s" : ""} found`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadSF1}>
              <Download className="w-4 h-4 mr-2" /> SF1
            </Button>
            <Button onClick={() => { setEditingStudent(null); setShowForm(true); }} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              <Plus className="w-4 h-4 mr-2" /> Enroll Student
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="border-0 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or LRN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="transferred_in">Transferred In</SelectItem>
              <SelectItem value="transferred_out">Transferred Out</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Users} title="No students found" description="Enroll your first student or adjust your filters" />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">LRN</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Grade & Section</TableHead>
                  <TableHead className="text-xs">Gender</TableHead>
                  <TableHead className="text-xs">Parent/Guardian</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs font-mono text-slate-500">{s.lrn}</TableCell>
                    <TableCell>
                      <Link to={`/StudentProfile/${s.id}`} className="text-sm font-medium text-[#1e3a5f] hover:underline cursor-pointer">
                        {s.last_name}, {s.first_name} {s.middle_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {s.current_grade_level} {s.current_section_name && `- ${s.current_section_name}`}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{s.gender}</TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">{s.parent_name}</div>
                      <div className="text-xs text-slate-400">{s.parent_contact}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[s.status] || "bg-gray-100 text-gray-700"}>
                        {s.status?.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingStudent(s); setShowForm(true); }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

      <StudentForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingStudent(null); }}
        onSubmit={handleSubmit}
        student={editingStudent}
        sections={sections}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}