import AppLayout from "@/Layouts/AppLayout";
import React, { useEffect, useState } from "react";
import { Search, Save, UserPlus, Plus, Edit2, Trash2, Unlock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/lib/roles";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "../components/shared/PageHeader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

const NONE_USER = "__none__";
const NONE_DEPT = "__none__";

const facultyAccountEmpty = {
  name: "",
  email: "",
  role: "faculty",
  status: "active",
  phone_number: "",
  two_factor_enabled: false,
  password: "",
  password_confirmation: "",
  department_id: NONE_DEPT,
};

const statusColors = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-600",
  suspended: "bg-red-100 text-red-700",
};

function facultyName(f) {
  return [f.first_name, f.middle_name, f.last_name].filter(Boolean).join(" ").trim() || "—";
}

function departmentOptionLabel(d) {
  return d.name;
}

function departmentCellLabel(u) {
  const d = u.department;
  if (!d) return "—";
  return departmentOptionLabel(d);
}

function GradeLevelHeadRow({ gradeLevel, faculty, onInvalidate }) {
  const existingHead = faculty.find((f) => f.is_grade_level_head && Number(f.grade_level_head_of) === Number(gradeLevel.id));
  const [selectedFacultyId, setSelectedFacultyId] = useState(existingHead ? String(existingHead.id) : NONE_USER);

  useEffect(() => {
    setSelectedFacultyId(existingHead ? String(existingHead.id) : NONE_USER);
  }, [existingHead?.id, existingHead?.updated_at, gradeLevel.id]);

  const selectedFaculty = faculty.find((f) => String(f.id) === selectedFacultyId) ?? null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (selectedFacultyId === NONE_USER) {
        if (!existingHead) {
          return null;
        }

        const body = {
          first_name: existingHead.first_name,
          last_name: existingHead.last_name,
          middle_name: existingHead.middle_name || null,
          employee_id: existingHead.employee_id || null,
          position: existingHead.position || null,
          specialization: existingHead.specialization || null,
          contact_number: existingHead.contact_number || null,
          is_grade_level_head: false,
          grade_level_head_of: null,
        };
        const { data } = await http.patch(`/faculty/${existingHead.id}`, body);
        return data?.data;
      }

      if (!selectedFaculty) {
        throw new Error("Select a teacher.");
      }

      const body = {
        first_name: selectedFaculty.first_name,
        last_name: selectedFaculty.last_name,
        middle_name: selectedFaculty.middle_name || null,
        employee_id: selectedFaculty.employee_id || null,
        position: selectedFaculty.position || null,
        specialization: selectedFaculty.specialization || null,
        contact_number: selectedFaculty.contact_number || null,
        is_grade_level_head: true,
        grade_level_head_of: Number(gradeLevel.id),
      };
      const { data } = await http.patch(`/faculty/${selectedFaculty.id}`, body);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Grade level head saved", {
        description: `${gradeLevel.name}: ${selectedFaculty ? facultyName(selectedFaculty) : "No assigned head"}`,
      });
      onInvalidate();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const originalFacultyId = existingHead ? String(existingHead.id) : NONE_USER;
  const dirty = selectedFacultyId !== originalFacultyId;

  return (
    <TableRow className="hover:bg-slate-50">
      <TableCell className="text-sm font-medium text-slate-800">
        {gradeLevel.name}
      </TableCell>
      <TableCell className="min-w-[220px]">
        <Select
          value={selectedFacultyId}
          onValueChange={setSelectedFacultyId}
        >
          <SelectTrigger className="h-9 text-left">
            <SelectValue placeholder="Select teacher…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_USER}>— No assigned head —</SelectItem>
            {faculty.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {facultyName(f)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-sm text-slate-500">{selectedFaculty?.employee_id ?? "—"}</TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="secondary"
          className="h-8"
          disabled={!dirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function FacultyManagement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [facultyUserSearch, setFacultyUserSearch] = useState("");
  const [showFacultyUserForm, setShowFacultyUserForm] = useState(false);
  const [editingFacultyUser, setEditingFacultyUser] = useState(null);
  const [facultyUserForm, setFacultyUserForm] = useState(facultyAccountEmpty);

  const { data: departmentsList = [] } = useQuery({
    queryKey: ["departments-roster"],
    queryFn: async () => {
      const { data } = await http.get("/departments");
      return data?.data ?? [];
    },
    enabled: user?.role === "school_admin",
  });

  const { data: gradeLevels = [] } = useQuery({
    queryKey: ["grade-levels"],
    queryFn: async () => {
      const { data } = await http.get("/grade-levels");
      return data?.data ?? [];
    },
    enabled: user?.role === "school_admin",
  });

  const { data: faculty = [], isLoading } = useQuery({
    queryKey: ["faculty-roster"],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "300" });
      const { data } = await http.get(`/faculty?${params.toString()}`);
      return data?.data ?? [];
    },
    enabled: user?.role === "school_admin",
  });

  const { data: unlinkedFacultyLogins = [], isLoading: unlinkedLoading } = useQuery({
    queryKey: ["faculty-unlinked-logins"],
    queryFn: async () => {
      const { data } = await http.get("/faculty/unlinked-faculty-logins");
      return data?.data ?? [];
    },
    enabled: user?.role === "school_admin",
  });

  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const { data } = await http.post("/faculty/bootstrap-unlinked");
      return data?.data;
    },
    onSuccess: (payload) => {
      toast.success("Roster updated", {
        description:
          payload?.created > 0
            ? `Created ${payload.created} teacher roster row(s) from existing logins.`
            : "Every teacher login already had a roster row.",
      });
      qc.invalidateQueries({ queryKey: ["faculty-roster"] });
      qc.invalidateQueries({ queryKey: ["faculty-unlinked-logins"] });
      qc.invalidateQueries({ queryKey: ["users", "faculty-role"] });
      qc.invalidateQueries({ queryKey: ["users", "faculty-only-manage"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const onInvalidate = () => {
    qc.invalidateQueries({ queryKey: ["faculty-roster"] });
    qc.invalidateQueries({ queryKey: ["faculty-unlinked-logins"] });
    qc.invalidateQueries({ queryKey: ["users", "faculty-role"] });
    qc.invalidateQueries({ queryKey: ["users", "faculty-only-manage"] });
  };

  const { data: facultyAccounts = [], isLoading: facultyAccountsLoading } = useQuery({
    queryKey: ["users", "faculty-only-manage", { facultyUserSearch }],
    queryFn: async () => {
      const params = new URLSearchParams({ role: "faculty", limit: "300" });
      if (facultyUserSearch.trim()) params.append("search", facultyUserSearch.trim());
      const { data } = await http.get(`/users?${params.toString()}`);
      return data?.data ?? [];
    },
    enabled: user?.role === "school_admin",
  });

  const createFacultyUserMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await http.post("/users", payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Teacher account created");
      qc.invalidateQueries({ queryKey: ["users"] });
      onInvalidate();
      closeFacultyUserForm();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const updateFacultyUserMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await http.put(`/users/${id}`, payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Teacher account updated");
      qc.invalidateQueries({ queryKey: ["users"] });
      onInvalidate();
      closeFacultyUserForm();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const deleteFacultyUserMutation = useMutation({
    mutationFn: async (id) => http.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success("Account deactivated");
      qc.invalidateQueries({ queryKey: ["users"] });
      onInvalidate();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const unlockFacultyUserMutation = useMutation({
    mutationFn: async (id) => http.post(`/users/${id}/unlock`),
    onSuccess: () => {
      toast.success("Account unlocked");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", "faculty-only-manage"] });
    },
  });

  const resetFacultyPasswordMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await http.post(`/users/${id}/reset-password`, { return_password: true });
      return data?.data;
    },
    onSuccess: (data) => {
      toast.success(`Temporary password: ${data?.temporary_password ?? "set"}`, { duration: 10_000 });
    },
  });

  const closeFacultyUserForm = () => {
    setShowFacultyUserForm(false);
    setEditingFacultyUser(null);
    setFacultyUserForm(facultyAccountEmpty);
  };

  const openCreateFacultyUser = () => {
    setEditingFacultyUser(null);
    setFacultyUserForm(facultyAccountEmpty);
    setShowFacultyUserForm(true);
  };

  const openEditFacultyUser = (u) => {
    setEditingFacultyUser(u);
    setFacultyUserForm({
      ...facultyAccountEmpty,
      name: u.name ?? "",
      email: u.email ?? "",
      role: "faculty",
      status: u.status ?? "active",
      phone_number: u.phone_number ?? "",
      two_factor_enabled: !!u.two_factor_enabled,
      department_id:
        u.department?.id != null
          ? String(u.department.id)
          : u.department_id != null
            ? String(u.department_id)
            : NONE_DEPT,
    });
    setShowFacultyUserForm(true);
  };

  const submitFacultyUserForm = () => {
    const deptId =
      facultyUserForm.department_id === NONE_DEPT || facultyUserForm.department_id === ""
        ? null
        : Number(facultyUserForm.department_id);
    const payload = {
      name: facultyUserForm.name,
      email: facultyUserForm.email,
      role: "faculty",
      status: facultyUserForm.status,
      phone_number: facultyUserForm.phone_number || null,
      two_factor_enabled: !!facultyUserForm.two_factor_enabled,
      department_id: deptId,
    };
    if (facultyUserForm.password) {
      payload.password = facultyUserForm.password;
      payload.password_confirmation = facultyUserForm.password_confirmation || facultyUserForm.password;
    }
    if (editingFacultyUser) {
      updateFacultyUserMutation.mutate({ id: editingFacultyUser.id, payload });
    } else {
      if (!facultyUserForm.password) {
        toast.error("Password is required for new accounts.");
        return;
      }
      createFacultyUserMutation.mutate(payload);
    }
  };

  if (user?.role !== "school_admin") {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Only school administrators can manage teachers and grade level heads.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teachers"
        description="Teachers tab: create and manage teacher logins. Grade-level head tab: assign one faculty member per grade level."
      />

      <Tabs defaultValue="teachers" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="grade-level-head">Grade-level head</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-600">
              Create accounts for teachers (system role: faculty). You can assign a departmental roster (grades 4–6) when applicable. Roster rows are created automatically when you save a new login.
            </p>
            <Button onClick={openCreateFacultyUser} className="bg-[#1e3a5f] hover:bg-[#2c5282] shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add teacher account
            </Button>
          </div>

          <Card className="border-0 shadow-sm p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search teachers by name or email…"
                value={facultyUserSearch}
                onChange={(e) => setFacultyUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Last login</TableHead>
                  <TableHead className="text-xs w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyAccountsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-slate-400 py-10">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : facultyAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-slate-400 py-10">
                      No teacher accounts yet. Use Add teacher account.
                    </TableCell>
                  </TableRow>
                ) : (
                  facultyAccounts.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm text-slate-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_BADGE_CLASSES[u.role] ?? "bg-slate-100 text-slate-600"}>
                          {u.role === "faculty" ? "Teacher" : ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[u.status] ?? statusColors.inactive}>{u.status ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-[200px]">{departmentCellLabel(u)}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {u.last_login_at ? format(new Date(u.last_login_at), "MMM d, yyyy HH:mm") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditFacultyUser(u)} title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {u.locked_until && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => unlockFacultyUserMutation.mutate(u.id)}
                              title="Unlock"
                            >
                              <Unlock className="w-3.5 h-3.5 text-amber-600" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              if (confirm(`Reset password for ${u.email}?`)) resetFacultyPasswordMutation.mutate(u.id);
                            }}
                            title="Reset password"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              if (confirm(`Deactivate ${u.email}?`)) deleteFacultyUserMutation.mutate(u.id);
                            }}
                            title="Deactivate"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Dialog open={showFacultyUserForm} onOpenChange={(v) => (v ? setShowFacultyUserForm(true) : closeFacultyUserForm())}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFacultyUser ? "Edit teacher account" : "Add teacher account"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={facultyUserForm.name} onChange={(e) => setFacultyUserForm({ ...facultyUserForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={facultyUserForm.email}
                    onChange={(e) => setFacultyUserForm({ ...facultyUserForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={facultyUserForm.status} onValueChange={(v) => setFacultyUserForm({ ...facultyUserForm, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department (optional)</Label>
                  <p className="text-[11px] text-slate-400 mb-1">For teachers in grades 4–6 departmentalized classes.</p>
                  <Select
                    value={facultyUserForm.department_id || NONE_DEPT}
                    onValueChange={(v) => setFacultyUserForm({ ...facultyUserForm, department_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_DEPT}>— None —</SelectItem>
                      {departmentsList.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {departmentOptionLabel(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={facultyUserForm.phone_number ?? ""}
                    onChange={(e) => setFacultyUserForm({ ...facultyUserForm, phone_number: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">Two-factor authentication</p>
                    <p className="text-xs text-slate-400">Require email OTP on every login.</p>
                  </div>
                  <Switch
                    checked={facultyUserForm.two_factor_enabled}
                    onCheckedChange={(v) => setFacultyUserForm({ ...facultyUserForm, two_factor_enabled: v })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{editingFacultyUser ? "New password (optional)" : "Password"}</Label>
                    <Input
                      type="password"
                      value={facultyUserForm.password}
                      onChange={(e) => setFacultyUserForm({ ...facultyUserForm, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Confirm password</Label>
                    <Input
                      type="password"
                      value={facultyUserForm.password_confirmation}
                      onChange={(e) => setFacultyUserForm({ ...facultyUserForm, password_confirmation: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeFacultyUserForm}>
                  Cancel
                </Button>
                <Button
                  onClick={submitFacultyUserForm}
                  disabled={
                    !facultyUserForm.name ||
                    !facultyUserForm.email ||
                    createFacultyUserMutation.isPending ||
                    updateFacultyUserMutation.isPending
                  }
                  className="bg-[#1e3a5f] hover:bg-[#2c5282]"
                >
                  {editingFacultyUser ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="grade-level-head" className="space-y-5 mt-4">
          <p className="text-sm text-slate-600">
            Link each roster row to a teacher login, then turn on Grade level head and pick exactly one grade. That person will see section assignment, reports, and other head tools after they refresh or sign in again.
          </p>

          {!unlinkedLoading && unlinkedFacultyLogins.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/70 shadow-sm p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <UserPlus className="w-8 h-8 text-amber-700 shrink-0" />
                <div className="text-sm text-amber-950">
                  <p className="font-medium">
                    {unlinkedFacultyLogins.length} teacher login{unlinkedFacultyLogins.length === 1 ? "" : "s"}{" "}
                    {unlinkedFacultyLogins.length === 1 ? "has" : "have"} no roster row yet.
                  </p>
                  <p className="text-amber-900/90 mt-1">
                    Create roster entries from those accounts (names come from their user profile). New teachers get a row automatically when they are saved on the Teachers tab.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="default"
                className="bg-amber-800 hover:bg-amber-900 shrink-0"
                disabled={bootstrapMutation.isPending}
                onClick={() => bootstrapMutation.mutate()}
              >
                {bootstrapMutation.isPending ? "Creating…" : `Create roster rows (${unlinkedFacultyLogins.length})`}
              </Button>
            </Card>
          )}

          <Card className="border-0 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Grade level</TableHead>
                  <TableHead className="text-xs">Grade level head</TableHead>
                  <TableHead className="text-xs">Employee ID</TableHead>
                  <TableHead className="text-xs w-28"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || (gradeLevels.length === 0 && unlinkedLoading) ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-slate-400 py-10">
                      Loading grade levels…
                    </TableCell>
                  </TableRow>
                ) : gradeLevels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-slate-400 py-10">
                      No grade levels found.
                    </TableCell>
                  </TableRow>
                ) : faculty.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-slate-400 py-10">
                      {unlinkedFacultyLogins.length > 0 ? (
                        <>
                          No roster rows yet. Use the yellow banner above to create them from existing teacher logins, or add accounts on the{" "}
                          <strong>Teachers</strong> tab (a roster row is created when you save each account).
                        </>
                      ) : (
                        <>
                          No teacher roster rows yet. Add teacher accounts on the <strong>Teachers</strong> tab — a roster row is created when you save each account — then return here to set grade heads.
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  gradeLevels.map((gradeLevel) => (
                    <GradeLevelHeadRow
                      key={gradeLevel.id}
                      gradeLevel={gradeLevel}
                      faculty={faculty}
                      onInvalidate={onInvalidate}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <p className="text-xs text-slate-400 px-1">
            Create teacher logins on the <strong>Teachers</strong> tab. New teachers get a roster row automatically, then they appear in each grade level head dropdown.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

FacultyManagement.layout = (page) => (
  <AppLayout currentPageName="FacultyManagement">{page}</AppLayout>
);

function extractError(err) {
  const data = err?.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join("\n");
  }
  if (err?.message && !data) {
    return err.message;
  }
  return data?.message ?? err.message ?? "Something went wrong";
}
