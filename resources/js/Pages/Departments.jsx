import AppLayout from "@/Layouts/AppLayout";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "sonner";

const NONE = "__none__";

function facultyDisplayName(f) {
  return [f.first_name, f.middle_name, f.last_name].filter(Boolean).join(" ").trim() || "—";
}

export default function Departments() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [modalDept, setModalDept] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await http.get("/departments");
      return data?.data ?? [];
    },
    enabled: user?.role === "admin" || user?.role === "school_admin",
  });

  const { data: deptDetail, isLoading: deptDetailLoading } = useQuery({
    queryKey: ["department-detail", modalDept?.id],
    queryFn: async () => {
      const { data } = await http.get(`/departments/${modalDept.id}`);
      return data?.data ?? null;
    },
    enabled: !!modalDept?.id,
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects-in-department", modalDept?.id],
    queryFn: async () => {
      const { data } = await http.get("/subjects", {
        params: { limit: 500 },
      });
      return (data?.data ?? []).filter((s) => s.department_id === modalDept?.id);
    },
    enabled: !!modalDept?.id,
  });

  const { data: facultyInDept = [], isLoading: facultyLoading } = useQuery({
    queryKey: ["faculty-in-department", modalDept?.id],
    queryFn: async () => {
      const { data } = await http.get("/faculty", {
        params: { limit: 500 },
      });
      return (data?.data ?? []).filter((f) => f.department_id === modalDept?.id);
    },
    enabled: !!modalDept?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await http.post("/departments", {
        name: newName.trim(),
      });
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Department added");
      setAddOpen(false);
      setNewName("");
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await http.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      toast.success("Department removed");
      qc.invalidateQueries({ queryKey: ["departments"] });
      setModalDept(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? err.message),
  });

  if (user?.role !== "admin" && user?.role !== "school_admin") {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Only administrators can manage departments.
      </div>
    );
  }

  const openModal = (d) => setModalDept(d);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Departments (Grades 4–6)"
        description="Create departments to organize subjects with assigned teachers. Departments are independent and can contain subjects for multiple grades."
        action={
          <Button
            className="bg-[#1e3a5f] hover:bg-[#2c5282]"
            onClick={() => {
              setNewName("");
              setAddOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add department
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departments.length === 0 ? (
          <Card className="border-0 shadow-sm p-6 text-sm text-slate-500 col-span-full">
            No departments yet. Click <strong>Add department</strong> to create one.
          </Card>
        ) : (
          departments.map((d) => (
            <Card key={d.id} className="border-0 shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Building2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <button
                    type="button"
                    className="text-left font-medium text-slate-900 hover:text-[#1e3a5f] underline-offset-2 hover:underline"
                    onClick={() => openModal(d)}
                  >
                    {d.name}
                  </button>
                  <p className="text-xs text-slate-500 mt-1">
                    {d.assignments_count ?? 0} subject–teacher assignment(s)
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="secondary" className="h-8" onClick={() => openModal(d)}>
                  View subjects
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-red-600"
                  onClick={() => {
                    if (confirm("Delete this department and all its subject–teacher links?")) {
                      deleteMutation.mutate(d.id);
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add department</DialogTitle>
            <DialogDescription>Create a new department to organize subjects and teachers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="dept-name">Department Name</Label>
              <Input
                id="dept-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Grade 5 – Section A"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!modalDept} onOpenChange={(o) => !o && setModalDept(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalDept?.name}</DialogTitle>
            <DialogDescription>
              Subjects and teachers assigned to this department.
            </DialogDescription>
          </DialogHeader>
          
          {deptDetailLoading || subjectsLoading || facultyLoading ? (
            <p className="text-sm text-slate-500 py-6">Loading…</p>
          ) : (
            <div className="space-y-6">
              {/* Subjects Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Subjects</h3>
                {subjects.length === 0 ? (
                  <p className="text-xs text-slate-500">No subjects assigned to this department.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-xs">Code</TableHead>
                        <TableHead className="text-xs">Minutes/Day</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-sm">{s.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{s.code ?? "—"}</TableCell>
                          <TableCell className="text-sm">{s.minutes_per_day ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Faculty Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Teachers</h3>
                {facultyInDept.length === 0 ? (
                  <p className="text-xs text-slate-500">No teachers assigned to this department.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Teacher Name</TableHead>
                        <TableHead className="text-xs">Employee ID</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facultyInDept.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="text-sm">{facultyDisplayName(f)}</TableCell>
                          <TableCell className="text-xs text-slate-500">{f.employee_id ?? "—"}</TableCell>
                          <TableCell className="text-sm">{f.user?.status ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setModalDept(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

Departments.layout = (page) => <AppLayout currentPageName="Departments">{page}</AppLayout>;
