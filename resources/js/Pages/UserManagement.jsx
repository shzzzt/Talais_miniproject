import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, Unlock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import PageHeader from "../components/shared/PageHeader";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

const roleColors = {
    admin: "bg-blue-100 text-blue-700",
    faculty: "bg-emerald-100 text-emerald-700",
    parent: "bg-amber-100 text-amber-700",
};
const statusColors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-slate-100 text-slate-600",
    suspended: "bg-red-100 text-red-700",
};

const emptyForm = {
    name: "",
    email: "",
    role: "faculty",
    status: "active",
    phone_number: "",
    is_grade_level_head: false,
    two_factor_enabled: false,
    password: "",
    password_confirmation: "",
};

export default function UserManagement() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("All");
    const [form, setForm] = useState(emptyForm);

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["users", { search, filterRole }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (filterRole !== "All") params.append("role", filterRole);
            params.append("limit", "200");
            const { data } = await http.get(`/users?${params.toString()}`);
            return data?.data ?? [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await http.post(`/users`, payload);
            return data?.data;
        },
        onSuccess: () => {
            toast.success("User created");
            qc.invalidateQueries({ queryKey: ["users"] });
            closeForm();
        },
        onError: (err) => toast.error(extractError(err)),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const { data } = await http.put(`/users/${id}`, payload);
            return data?.data;
        },
        onSuccess: () => {
            toast.success("User updated");
            qc.invalidateQueries({ queryKey: ["users"] });
            closeForm();
        },
        onError: (err) => toast.error(extractError(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => http.delete(`/users/${id}`),
        onSuccess: () => {
            toast.success("User deactivated");
            qc.invalidateQueries({ queryKey: ["users"] });
        },
        onError: (err) => toast.error(extractError(err)),
    });

    const unlockMutation = useMutation({
        mutationFn: async (id) => http.post(`/users/${id}/unlock`),
        onSuccess: () => {
            toast.success("Account unlocked");
            qc.invalidateQueries({ queryKey: ["users"] });
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async (id) => {
            const { data } = await http.post(`/users/${id}/reset-password`, {
                return_password: true,
            });
            return data?.data;
        },
        onSuccess: (data) => {
            toast.success(`Temporary password: ${data?.temporary_password ?? "set"}`, {
                duration: 10_000,
            });
        },
    });

    const handleSubmit = () => {
        const payload = {
            name: form.name,
            email: form.email,
            role: form.role,
            status: form.status,
            phone_number: form.phone_number || null,
            is_grade_level_head: !!form.is_grade_level_head,
            two_factor_enabled: !!form.two_factor_enabled,
        };
        if (form.password) {
            payload.password = form.password;
            payload.password_confirmation = form.password_confirmation || form.password;
        }
        if (editing) updateMutation.mutate({ id: editing.id, payload });
        else createMutation.mutate(payload);
    };

    const openEdit = (u) => {
        setEditing(u);
        setForm({
            ...emptyForm,
            name: u.name ?? "",
            email: u.email ?? "",
            role: u.role ?? "faculty",
            status: u.status ?? "active",
            phone_number: u.phone_number ?? "",
            is_grade_level_head: !!u.is_grade_level_head,
            two_factor_enabled: !!u.two_factor_enabled,
        });
        setShowForm(true);
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        setForm(emptyForm);
    };

    const filtered = users;

    return (
        <div>
            <PageHeader
                title="User Management"
                description="Manage faculty, admin, and parent accounts"
                action={
                    <Button onClick={openCreate} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
                        <Plus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                }
            />

            <div className="grid grid-cols-3 gap-4 mb-5">
                {["admin", "faculty", "parent"].map((role) => (
                    <Card key={role} className="border-0 shadow-sm p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider capitalize">
                            {role === "admin" ? "Administrators" : role === "faculty" ? "Faculty" : "Parents"}
                        </p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">
                            {users.filter((u) => u.role === role).length}
                        </p>
                    </Card>
                ))}
            </div>

            <Card className="border-0 shadow-sm p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                        </SelectContent>
                    </Select>
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
                            <TableHead className="text-xs">Last Login</TableHead>
                            <TableHead className="text-xs w-32">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-sm text-slate-400 py-8">
                                    Loading users…
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-sm text-slate-400 py-8">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((u) => (
                                <TableRow key={u.id} className="hover:bg-slate-50">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">
                                                    {(u.name ?? "?")[0]}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{u.name}</p>
                                                {u.is_grade_level_head && (
                                                    <p className="text-[10px] uppercase tracking-wide text-amber-600">
                                                        Grade Level Head
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge className={roleColors[u.role]}>{u.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge className={statusColors[u.status] ?? statusColors.inactive}>
                                                {u.status ?? "inactive"}
                                            </Badge>
                                            {u.locked_until && (
                                                <Badge className="bg-red-100 text-red-700">Locked</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400">
                                        {u.last_login_at
                                            ? format(new Date(u.last_login_at), "MMM d, yyyy HH:mm")
                                            : "Never"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => openEdit(u)}
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            {u.locked_until && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => unlockMutation.mutate(u.id)}
                                                    title="Unlock"
                                                >
                                                    <Unlock className="w-3 h-3 text-amber-500" />
                                                </Button>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => {
                                                    if (confirm(`Reset password for ${u.email}?`))
                                                        resetPasswordMutation.mutate(u.id);
                                                }}
                                                title="Reset password"
                                            >
                                                <KeyRound className="w-3 h-3 text-slate-500" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => {
                                                    if (confirm(`Deactivate ${u.email}?`))
                                                        deleteMutation.mutate(u.id);
                                                }}
                                                title="Deactivate"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={showForm} onOpenChange={(v) => (v ? setShowForm(true) : closeForm())}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit User" : "Add New User"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Role</Label>
                                <Select
                                    value={form.role}
                                    onValueChange={(v) => setForm({ ...form, role: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="faculty">Faculty</SelectItem>
                                        <SelectItem value="parent">Parent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(v) => setForm({ ...form, status: v })}
                                >
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
                        </div>
                        <div>
                            <Label>Phone Number</Label>
                            <Input
                                value={form.phone_number ?? ""}
                                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                            />
                        </div>
                        {form.role === "faculty" && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-medium">Grade Level Head</p>
                                    <p className="text-xs text-slate-400">
                                        Allow this faculty to review &amp; finalize grades for a grade level.
                                    </p>
                                </div>
                                <Switch
                                    checked={form.is_grade_level_head}
                                    onCheckedChange={(v) =>
                                        setForm({ ...form, is_grade_level_head: v })
                                    }
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div>
                                <p className="text-sm font-medium">Two-Factor Authentication</p>
                                <p className="text-xs text-slate-400">
                                    Require email OTP on every login.
                                </p>
                            </div>
                            <Switch
                                checked={form.two_factor_enabled}
                                onCheckedChange={(v) => setForm({ ...form, two_factor_enabled: v })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>{editing ? "New password (optional)" : "Password"}</Label>
                                <Input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Confirm password</Label>
                                <Input
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={(e) =>
                                        setForm({ ...form, password_confirmation: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeForm}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                !form.name ||
                                !form.email ||
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                            className="bg-[#1e3a5f] hover:bg-[#2c5282]"
                        >
                            {editing ? "Update" : "Create User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

UserManagement.layout = (page) => <AppLayout currentPageName="UserManagement">{page}</AppLayout>;

function extractError(err) {
    const data = err?.response?.data;
    if (data?.errors) {
        return Object.values(data.errors).flat().join("\n");
    }
    return data?.message ?? err.message ?? "Something went wrong";
}
