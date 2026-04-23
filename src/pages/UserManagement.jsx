import React, { useState } from "react";
import { Users, Plus, Search, Edit2, Trash2, Shield, UserCheck, UserX } from "lucide-react";
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

const INITIAL_USERS = [
  { id: 1, name: "Dr. Weenkie Jhon Marcelo", email: "admin@musuan.edu.ph", role: "admin", status: "active", last_login: "2026-02-18", employee_id: "ADM001" },
  { id: 2, name: "Mrs. Maria Santos", email: "m.santos@musuan.edu.ph", role: "faculty", status: "active", last_login: "2026-02-17", employee_id: "FAC001" },
  { id: 3, name: "Mr. Jose Reyes", email: "j.reyes@musuan.edu.ph", role: "faculty", status: "active", last_login: "2026-02-16", employee_id: "FAC002" },
  { id: 4, name: "Mrs. Ana Cruz", email: "a.cruz@musuan.edu.ph", role: "faculty", status: "inactive", last_login: "2026-01-10", employee_id: "FAC003" },
  { id: 5, name: "Pedro Dela Cruz", email: "pedro.dc@gmail.com", role: "parent", status: "active", last_login: "2026-02-15", employee_id: "" },
  { id: 6, name: "Maria Santos Sr.", email: "m.santos.parent@gmail.com", role: "parent", status: "active", last_login: "2026-02-14", employee_id: "" },
];

const roleColors = { admin: "bg-blue-100 text-blue-700", faculty: "bg-emerald-100 text-emerald-700", parent: "bg-amber-100 text-amber-700" };
const statusColors = { active: "bg-green-100 text-green-700", inactive: "bg-slate-100 text-slate-600", suspended: "bg-red-100 text-red-700" };

export default function UserManagement() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [form, setForm] = useState({ name: "", email: "", role: "faculty", status: "active", employee_id: "", password: "" });

  const handleSubmit = () => {
    if (editing) {
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...form } : u));
    } else {
      setUsers(prev => [...prev, { id: Math.max(...prev.map(u => u.id)) + 1, ...form, last_login: "Never" }]);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", email: "", role: "faculty", status: "active", employee_id: "", password: "" });
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status, employee_id: u.employee_id, password: "" });
    setShowForm(true);
  };

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
  };

  const filtered = users.filter(u => {
    const matchSearch = `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "All" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage faculty, admin, and parent accounts"
        action={
          <Button onClick={() => { setEditing(null); setForm({ name: "", email: "", role: "faculty", status: "active", employee_id: "", password: "" }); setShowForm(true); }} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {["admin", "faculty", "parent"].map(role => (
          <Card key={role} className="border-0 shadow-sm p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider capitalize">{role === "admin" ? "Administrators" : role === "faculty" ? "Faculty" : "Parents"}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{users.filter(u => u.role === role).length}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
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
              <TableHead className="text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{u.name[0]}</span>
                    </div>
                    <span className="text-sm font-medium">{u.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{u.email}</TableCell>
                <TableCell><Badge className={roleColors[u.role]}>{u.role}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={u.status === "active"} onCheckedChange={() => toggleStatus(u.id)} className="scale-75" />
                    <Badge className={statusColors[u.status]}>{u.status}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-400">{u.last_login}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setUsers(prev => prev.filter(x => x.id !== u.id))}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "Add New User"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.role === "faculty" && <div><Label>Employee ID</Label>
              <Input value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} placeholder="e.g. FAC001" /></div>}
            <div><Label>{editing ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.email} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              {editing ? "Update" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}