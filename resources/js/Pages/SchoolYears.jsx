import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { Calendar, Plus, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

export default function SchoolYears() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", status: "planning" });
  const queryClient = useQueryClient();

  const { data: schoolYears = [], isLoading } = useQuery({
    queryKey: ["schoolYears"],
    queryFn: () => base44.entities.SchoolYear.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolYear.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["schoolYears"] }); setShowForm(false); resetForm(); },
  });

  const activateMutation = useMutation({
    mutationFn: async (id) => {
      // Deactivate all first
      for (const sy of schoolYears.filter(s => s.is_active)) {
        await base44.entities.SchoolYear.update(sy.id, { is_active: false, status: "completed" });
      }
      await base44.entities.SchoolYear.update(id, { is_active: true, status: "active" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schoolYears"] }),
  });

  const resetForm = () => setForm({ name: "", start_date: "", end_date: "", status: "planning" });

  const handleSubmit = () => {
    createMutation.mutate({ ...form, is_active: false });
  };

  const statusColors = {
    planning: "bg-slate-100 text-slate-600",
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-blue-100 text-blue-700",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <div>
      <PageHeader
        title="School Years"
        description="Manage academic school years"
        action={
          <Button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
            <Plus className="w-4 h-4 mr-2" /> New School Year
          </Button>
        }
      />

      {schoolYears.length === 0 && !isLoading ? (
        <EmptyState
          icon={Calendar}
          title="No school years"
          description="Create your first school year to get started"
          action={<Button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] hover:bg-[#2c5282]"><Plus className="w-4 h-4 mr-2" /> Create</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolYears.map(sy => (
            <Card key={sy.id} className={`border-0 shadow-sm ${sy.is_active ? "ring-2 ring-amber-400" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{sy.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {sy.start_date} — {sy.end_date || "TBD"}
                    </p>
                  </div>
                  <Badge className={statusColors[sy.status]}>{sy.status}</Badge>
                </div>
                {!sy.is_active && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => activateMutation.mutate(sy.id)}
                    className="w-full mt-2"
                  >
                    <Check className="w-3 h-3 mr-1" /> Set as Active
                  </Button>
                )}
                {sy.is_active && (
                  <div className="mt-2 text-center">
                    <Badge className="bg-amber-400 text-[#1e3a5f]">Active Year</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New School Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name (e.g. 2025-2026)</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="2025-2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name} className="bg-[#1e3a5f] hover:bg-[#2c5282]">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

SchoolYears.layout = (page) => <AppLayout currentPageName="SchoolYears">{page}</AppLayout>;
