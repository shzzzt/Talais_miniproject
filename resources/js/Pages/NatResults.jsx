import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/api';
import { GraduationCap, Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';

const PROFICIENCY_COLOR = {
  Beginning: 'bg-red-100 text-red-700',
  Developing: 'bg-amber-100 text-amber-700',
  'Approaching Proficiency': 'bg-blue-100 text-blue-700',
  Proficient: 'bg-emerald-100 text-emerald-700',
  Advanced: 'bg-violet-100 text-violet-700',
};

export default function NatResults() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const initial = {
    school_year_id: '',
    grade_level_id: '',
    subject_id: '',
    mean_percentage_score: '',
    number_of_takers: '',
    remarks: '',
  };
  const [form, setForm] = useState(initial);

  const { data: gradeLevels = [] } = useQuery({ queryKey: ['grade-levels'], queryFn: () => base44.entities.GradeLevel.list() });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => base44.entities.Subject.list() });
  const { data: years = [] } = useQuery({ queryKey: ['school-years'], queryFn: () => base44.entities.SchoolYear.list() });
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['nat-results'],
    queryFn: () => base44.entities.NatResult.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.NatResult.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nat-results'] });
      setShowForm(false);
      setForm(initial);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NatResult.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nat-results'] }),
  });

  const downloadCSV = () => {
    const rows = [['School Year', 'Grade Level', 'Subject', 'MPS', 'Takers', 'Proficiency']];
    results.forEach(r => rows.push([r.school_year || '', r.grade_level || '', r.subject || '', r.mean_percentage_score, r.number_of_takers, r.proficiency_level || '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'NAT_Results.csv'; a.click();
  };

  const handleSubmit = () => {
    if (!form.subject_id || !form.grade_level_id || !form.mean_percentage_score) return;
    createMutation.mutate({
      school_year_id: form.school_year_id ? Number(form.school_year_id) : null,
      grade_level_id: Number(form.grade_level_id),
      subject_id: Number(form.subject_id),
      mean_percentage_score: Number(form.mean_percentage_score),
      number_of_takers: Number(form.number_of_takers || 0),
      remarks: form.remarks || null,
    });
  };

  return (
    <div>
      <PageHeader
        title="NAT / NCAE Results"
        description="National Achievement Test results by grade level and subject"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
            <Button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              <Plus className="w-4 h-4 mr-2" /> Add Result
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="text-center py-8 text-sm text-slate-400">Loading...</div>
      ) : results.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No NAT results recorded" description="Add a NAT result to get started" />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs">School Year</TableHead>
                <TableHead className="text-xs">Grade Level</TableHead>
                <TableHead className="text-xs">Subject</TableHead>
                <TableHead className="text-xs text-center">MPS</TableHead>
                <TableHead className="text-xs text-center">Takers</TableHead>
                <TableHead className="text-xs">Proficiency</TableHead>
                <TableHead className="text-xs w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.school_year || '—'}</TableCell>
                  <TableCell className="text-sm">{r.grade_level || '—'}</TableCell>
                  <TableCell className="text-sm font-medium">{r.subject || '—'}</TableCell>
                  <TableCell className="text-center font-bold">{r.mean_percentage_score}</TableCell>
                  <TableCell className="text-center">{r.number_of_takers}</TableCell>
                  <TableCell><Badge className={PROFICIENCY_COLOR[r.proficiency_level] || ''}>{r.proficiency_level}</Badge></TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(r.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add NAT Result</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>School Year</Label>
              <Select value={form.school_year_id} onValueChange={v => setForm({ ...form, school_year_id: v })}>
                <SelectTrigger><SelectValue placeholder="(active SY)" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grade Level</Label>
                <Select value={form.grade_level_id} onValueChange={v => setForm({ ...form, grade_level_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>MPS (0-100)</Label>
                <Input type="number" min="0" max="100" step="0.01" value={form.mean_percentage_score} onChange={e => setForm({ ...form, mean_percentage_score: e.target.value })} />
              </div>
              <div>
                <Label>Number of Takers</Label>
                <Input type="number" min="0" value={form.number_of_takers} onChange={e => setForm({ ...form, number_of_takers: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Remarks</Label>
              <Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.subject_id || !form.grade_level_id || !form.mean_percentage_score || createMutation.isPending} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

NatResults.layout = (page) => <AppLayout currentPageName="NatResults">{page}</AppLayout>;
