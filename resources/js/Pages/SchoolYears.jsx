import AppLayout from '@/Layouts/AppLayout';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import { base44 } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/utils';
import {
  Calendar,
  Plus,
  Check,
  Pencil,
  Trash2,
  RefreshCw,
  BookMarked,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';

const emptyForm = { name: '', start_date: '', end_date: '', enrollment_start: '', enrollment_end: '' };

export default function SchoolYears() {
  const qc = useQueryClient();
  const { hasAnyRole } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [createForm, setCreateForm] = useState(emptyForm);

  const canRunRollover = hasAnyRole(['admin']);

  const {
    data: overview,
    isLoading,
    error: overviewError,
  } = useQuery({
    queryKey: ['school-years-overview'],
    queryFn: async () => {
      const { data } = await http.get('/school-years/overview');
      return data?.data ?? data;
    },
  });

  const schoolYears = overview?.school_years ?? [];

  const hasAnyYear = schoolYears.length > 0;

  const rolloverEligible = useMemo(() => {
    const active = schoolYears.find((y) => y.is_active);
    if (!active?.end_date) return false;
    const end = new Date(active.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return today > end;
  }, [schoolYears]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['school-years-overview'] });
    qc.invalidateQueries({ queryKey: ['schoolYears'] });
  };

  const rolloverMutation = useMutation({
    mutationFn: async () => {
      const { data } = await http.post('/school-years/rollover');
      return data;
    },
    onSuccess: (res) => {
      if (res?.data?.rolled_over) {
        toast.success(`Next school year activated: ${res.data.school_year?.label ?? 'new year'}`);
      } else {
        toast.message(res?.message ?? 'No rollover needed right now.');
      }
      invalidateAll();
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolYear.create(data),
    onSuccess: () => {
      invalidateAll();
      setShowForm(false);
      setCreateForm(emptyForm);
      toast.success('School year created');
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const activateMutation = useMutation({
    mutationFn: async (id) => {
      for (const sy of schoolYears.filter((s) => s.is_active)) {
        await base44.entities.SchoolYear.update(sy.id, { is_active: false });
      }
      await base44.entities.SchoolYear.update(id, { is_active: true });
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Active school year updated');
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SchoolYear.update(id, data),
    onSuccess: () => {
      invalidateAll();
      setEditForm(null);
      toast.success('School year saved');
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SchoolYear.delete(id),
    onSuccess: () => {
      invalidateAll();
      setDeleteId(null);
      toast.success('School year deleted');
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const handleCreateSubmit = () => {
    if (!createForm.name?.trim()) {
      toast.error('Label is required');
      return;
    }
    if (!createForm.start_date || !createForm.end_date) {
      toast.error('Start and end dates are required');
      return;
    }
    const payload = {
      name: createForm.name.trim(),
      start_date: createForm.start_date,
      end_date: createForm.end_date,
      is_active: true,
    };
    if (createForm.enrollment_start) payload.enrollment_start = createForm.enrollment_start;
    if (createForm.enrollment_end) payload.enrollment_end = createForm.enrollment_end;
    createMutation.mutate(payload);
  };

  const handleEditSubmit = () => {
    if (!editForm?.id) return;
    if (!editForm.name?.trim() || !editForm.start_date || !editForm.end_date) {
      toast.error('Label, start, and end are required');
      return;
    }
    updateMutation.mutate({
      id: editForm.id,
      data: {
        name: editForm.name.trim(),
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        enrollment_start: editForm.enrollment_start || null,
        enrollment_end: editForm.enrollment_end || null,
      },
    });
  };

  const statusColors = {
    planning: 'bg-slate-100 text-slate-600',
    active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-600',
  };

  if (overviewError) {
    return (
      <div>
        <PageHeader title="School Year Settings" />
        <p className="text-sm text-red-600">{extractApiError(overviewError)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Year Settings"
        description="Central view of every school year, its calendar, quarters, enrollment window, and section layout by grade."
        action={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {canRunRollover && hasAnyYear && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => rolloverMutation.mutate()}
                disabled={rolloverMutation.isPending}
                title={
                  rolloverEligible
                    ? 'Create the next school year and retire the ended one.'
                    : 'Runs only after the active year’s end date has passed.'
                }
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${rolloverMutation.isPending ? 'animate-spin' : ''}`} />
                Check rollover
              </Button>
            )}
            {!hasAnyYear && (
              <Button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] hover:bg-[#2c5282]">                <Plus className="w-4 h-4 mr-2" /> Initial school year
              </Button>
            )}
          </div>
        }
      />

      {schoolYears.length === 0 && !isLoading ? (
        <EmptyState
          icon={Calendar}
          title="No school years yet"
          description="Create the first (bootstrap) school year. The next years roll forward automatically when this year ends."
          action={

            <Button onClick={() => setShowForm(true)} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
              <Plus className="w-4 h-4 mr-2" /> Create initial year
            </Button>
          }
        />
      ) : (
        <Accordion type="multiple" defaultValue={schoolYears.filter((y) => y.is_active).map((y) => String(y.id))} className="space-y-3">
          {schoolYears.map((sy) => (
            <AccordionItem key={sy.id} value={String(sy.id)} className="border border-slate-200 rounded-xl px-4 bg-white shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left w-full pr-4">
                  <div>
                    <span className="font-bold text-lg text-[#1e3a5f]">{sy.name ?? sy.label}</span>
                    {sy.is_active && (
                      <Badge className="ml-2 bg-amber-400 text-[#1e3a5f]">Active</Badge>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {sy.start_date} — {sy.end_date}                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={statusColors[sy.status] || 'bg-slate-100 text-slate-600'}>{sy.status}</Badge>
                    <span className="text-xs text-slate-400">
                      {sy.enrollments_count ?? 0} enrollments · {sy.sections_count ?? 0} sections
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Instructional calendar</p>
                    <p className="font-medium mt-1">
                      {sy.start_date} → {sy.end_date}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Enrollment window</p>
                    <p className="font-medium mt-1">
                      {sy.enrollment_start || '—'} — {sy.enrollment_end || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Identifiers</p>
                    <p className="font-mono text-xs mt-1">ID {sy.id}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!sy.is_active && (
                    <Button size="sm" variant="outline" onClick={() => activateMutation.mutate(sy.id)} disabled={activateMutation.isPending}>
                      <Check className="w-3 h-3 mr-1" /> Set active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditForm({
                        id: sy.id,
                        name: sy.label ?? sy.name ?? '',
                        start_date: sy.start_date ?? '',
                        end_date: sy.end_date ?? '',
                        enrollment_start: sy.enrollment_start ?? '',
                        enrollment_end: sy.enrollment_end ?? '',
                      })
                    }
                  >
                    <Pencil className="w-3 h-3 mr-1" /> Edit dates
                  </Button>
                  {!sy.is_active && (
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(sy.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Quarters */}
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <BookMarked className="w-4 h-4" /> Quarters
                  </p>
                  {(sy.quarters ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500">No quarters defined for this year.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs">Q#</TableHead>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Start</TableHead>
                            <TableHead className="text-xs">End</TableHead>
                            <TableHead className="text-xs">Grading open</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(sy.quarters ?? []).map((q) => (
                            <TableRow key={q.id}>
                              <TableCell className="text-sm">{q.quarter_number}</TableCell>
                              <TableCell className="text-sm">{q.name}</TableCell>
                              <TableCell className="text-sm">{q.start_date}</TableCell>
                              <TableCell className="text-sm">{q.end_date}</TableCell>
                              <TableCell className="text-sm">{q.is_grading_open ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Sections by grade */}
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Sections by grade</p>
                  {(sy.sections ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500">No sections for this school year.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(sy.sections_by_grade ?? {}).map(([gradeName, rows]) => (
                        <div key={gradeName}>
                          <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">{gradeName}</p>                          <div className="overflow-x-auto rounded-lg border border-slate-100">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50">
                                  <TableHead className="text-xs">Section</TableHead>
                                  <TableHead className="text-xs">Type</TableHead>
                                  <TableHead className="text-xs">Session</TableHead>
                                  <TableHead className="text-xs">Capacity</TableHead>
                                  <TableHead className="text-xs">Adviser</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(rows ?? []).map((sec) => (
                                  <TableRow key={sec.id}>
                                    <TableCell className="text-sm font-medium">{sec.name}</TableCell>
                                    <TableCell className="text-sm">{sec.type}</TableCell>
                                    <TableCell className="text-sm">{sec.session}</TableCell>
                                    <TableCell className="text-sm">{sec.max_capacity ?? '—'}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{sec.adviser ?? '—'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initial school year (one-time)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              This form is only for the very first year. Later years are created when the active year ends.
            </p>
            <div>
              <Label>Label (e.g. 2025-2026)</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="2025-2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date *</Label>
                <Input type="date" value={createForm.start_date} onChange={(e) => setCreateForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>End date *</Label>
                <Input type="date" value={createForm.end_date} onChange={(e) => setCreateForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Enrollment start</Label>
                <Input
                  type="date"
                  value={createForm.enrollment_start}
                  onChange={(e) => setCreateForm((f) => ({ ...f, enrollment_start: e.target.value }))}
                />
              </div>
              <div>
                <Label>Enrollment end</Label>
                <Input
                  type="date"
                  value={createForm.enrollment_end}
                  onChange={(e) => setCreateForm((f) => ({ ...f, enrollment_end: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setCreateForm(emptyForm);
              }}
            >
              Cancel
            </Button>

            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editForm} onOpenChange={(o) => !o && setEditForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit school year</DialogTitle>
          </DialogHeader>
          {editForm && (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Label</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start *</Label>
                    <Input type="date" value={editForm.start_date} onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>End *</Label>
                    <Input type="date" value={editForm.end_date} onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Enrollment start</Label>
                    <Input
                      type="date"
                      value={editForm.enrollment_start}
                      onChange={(e) => setEditForm((f) => ({ ...f, enrollment_start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Enrollment end</Label>
                    <Input
                      type="date"
                      value={editForm.enrollment_end}
                      onChange={(e) => setEditForm((f) => ({ ...f, enrollment_end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditForm(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSubmit} disabled={updateMutation.isPending} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete school year?</AlertDialogTitle>
            <AlertDialogDescription>
              Only allowed when the year is inactive and has no enrollments or sections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

SchoolYears.layout = (page) => <AppLayout currentPageName="SchoolYears">{page}</AppLayout>;
