import AppLayout from "@/Layouts/AppLayout";
import React, { useMemo, useState } from "react";
import { Edit2, Plus, Save, Search, Trash2, Unlock, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "../components/shared/PageHeader";
import { http } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/lib/roles";

const NONE_DEPT = "__none__";

const emptyForm = {
  name: "",
  email: "",
  phone_number: "",
  role: "faculty",
  status: "active",
  department_id: NONE_DEPT,
  password: "",
  password_confirmation: "",
};

function extractError(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong";
}

function facultyName(item) {
  return [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(" ").trim() || item.user?.name || "Teacher";
}

function departmentName(item) {
  return item.department?.name || item.user?.department?.name || "-";
}

export default function FacultyManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const canManage = user?.role === "school_admin" || user?.role === "admin";

  const facultyQuery = useQuery({
    queryKey: ["faculty-roster"],
    queryFn: async () => {
      const { data } = await http.get("/faculty?limit=300");
      return data?.data ?? [];
    },
    enabled: canManage,
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await http.get("/departments");
      return data?.data ?? [];
    },
    enabled: canManage,
  });

  const unlinkedQuery = useQuery({
    queryKey: ["faculty-unlinked-logins"],
    queryFn: async () => {
      const { data } = await http.get("/faculty/unlinked-faculty-logins");
      return data?.data ?? [];
    },
    enabled: canManage,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["faculty-roster"] });
    queryClient.invalidateQueries({ queryKey: ["faculty-unlinked-logins"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        email: form.email,
        phone_number: form.phone_number,
        role: form.role,
        status: form.status,
        department_id: form.department_id === NONE_DEPT ? null : Number(form.department_id),
      };

      if (!editing) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation || form.password;
      }

      if (editing?.user_id || editing?.id) {
        const id = editing.user_id || editing.id;
        const { data } = await http.put(`/users/${id}`, payload);
        return data?.data;
      }

      const { data } = await http.post("/users", payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success(editing ? "Teacher account updated" : "Teacher account created");
      invalidate();
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (error) => toast.error(extractError(error)),
  });

  const bootstrapMutation = useMutation({
    mutationFn: async () => http.post("/faculty/bootstrap-unlinked"),
    onSuccess: () => {
      toast.success("Unlinked teacher logins bootstrapped");
      invalidate();
    },
    onError: (error) => toast.error(extractError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => http.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success("Teacher account deleted");
      invalidate();
    },
    onError: (error) => toast.error(extractError(error)),
  });

  const unlockMutation = useMutation({
    mutationFn: async (id) => http.post(`/users/${id}/unlock`),
    onSuccess: () => {
      toast.success("Account unlocked");
      invalidate();
    },
    onError: (error) => toast.error(extractError(error)),
  });

  const filteredFaculty = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = facultyQuery.data ?? [];
    if (!term) return items;

    return items.filter((item) => {
      const haystack = [
        facultyName(item),
        item.email,
        item.user?.email,
        item.phone_number,
        item.user?.phone_number,
        departmentName(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [facultyQuery.data, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    const account = item.user ?? item;
    setEditing(account);
    setForm({
      name: account.name || facultyName(item),
      email: account.email || "",
      phone_number: account.phone_number || "",
      role: account.role || "faculty",
      status: account.status || "active",
      department_id: String(account.department_id || item.department_id || NONE_DEPT),
      password: "",
      password_confirmation: "",
    });
    setShowForm(true);
  };

  if (!canManage) {
    return <div className="p-6 text-center text-sm text-slate-500">Only administrators can manage faculty accounts.</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Faculty Management"
        description="Manage teacher accounts and roster access."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => bootstrapMutation.mutate()} disabled={bootstrapMutation.isPending}>
              <UserPlus className="mr-2 h-4 w-4" />
              Bootstrap logins
            </Button>
            <Button onClick={openCreate} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
              <Plus className="mr-2 h-4 w-4" />
              Add teacher account
            </Button>
          </div>
        }
      />

      <Card className="border-0 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search teachers by name, email, or department..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facultyQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  Loading faculty...
                </TableCell>
              </TableRow>
            ) : filteredFaculty.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  No faculty accounts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredFaculty.map((item) => {
                const account = item.user ?? item;
                const role = account.role || "faculty";
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{facultyName(item)}</TableCell>
                    <TableCell>{account.email || "-"}</TableCell>
                    <TableCell>{departmentName(item)}</TableCell>
                    <TableCell>
                      <span className={ROLE_BADGE_CLASSES[role] || "rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"}>
                        {ROLE_LABELS[role] || role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(item)} title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => unlockMutation.mutate(account.id)} title="Unlock">
                          <Unlock className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(account.id)}
                          title="Delete"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {unlinkedQuery.data?.length > 0 && (
        <Card className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {unlinkedQuery.data.length} faculty login(s) are not linked to roster records.
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit teacher account" : "Add teacher account"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <Input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department_id} onValueChange={(value) => setForm({ ...form, department_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="No department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_DEPT}>No department</SelectItem>
                  {(departmentsQuery.data ?? []).map((department) => (
                    <SelectItem key={department.id} value={String(department.id)}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    value={form.password_confirmation}
                    onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

FacultyManagement.layout = (page) => <AppLayout currentPageName="FacultyManagement">{page}</AppLayout>;
