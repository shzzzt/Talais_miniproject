import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/api';
import { ArrowRightLeft, Plus, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';

const TYPE_COLORS = {
  transferred_in: 'bg-emerald-100 text-emerald-700',
  transferred_out: 'bg-blue-100 text-blue-700',
  dropped: 'bg-red-100 text-red-700',
  section_change: 'bg-purple-100 text-purple-700',
};

export default function Transfers() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const initial = {
    student_id: '', transfer_type: 'transferred_out',
    transfer_date: new Date().toISOString().split('T')[0],
    quarter_at_transfer: '',
    from_school: '', to_school: '', reason: '',
  };
  const [form, setForm] = useState(initial);

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => base44.entities.Student.list() });
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => base44.entities.Transfer.list('-transfer_date'),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.Transfer.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowForm(false);
      setForm(initial);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transfer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
  });

  const downloadCSV = () => {
    const rows = [['Student', 'LRN', 'Type', 'Date', 'From', 'To', 'Reason']];
    transfers.forEach(t => rows.push([
      t.student_name || '', t.lrn || '', t.transfer_type || '', t.transfer_date || '',
      t.from_school || t.from_section || '', t.to_school || t.to_section || '', `"${(t.reason || '').replace(/"/g, '""')}"`,
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Transfer_Records.csv'; a.click();
  };

  const handleSubmit = () => {
    if (!form.student_id || !form.transfer_type) return;
    createMutation.mutate({
      student_id: Number(form.student_id),
      transfer_type: form.transfer_type,
      transfer_date: form.transfer_date,
      quarter_at_transfer: form.quarter_at_transfer || null,
      from_school: form.from_school || null,
      to_school: form.to_school || null,
      reason: form.reason || null,
    });
  };

  return (
    <div>
      <PageHeader
        title="Transfer Records"
        description="Track learner transfers, drop-outs, and section changes"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
            <Button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              <Plus className="w-4 h-4 mr-2" /> Record Transfer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{transfers.length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Transferred In</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{transfers.filter(t => t.transfer_type === 'transferred_in').length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Transferred Out</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{transfers.filter(t => t.transfer_type === 'transferred_out').length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Dropped</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{transfers.filter(t => t.transfer_type === 'dropped').length}</p>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-sm text-slate-400">Loading...</div>
      ) : transfers.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="No transfer records" description="Record a transfer to get started" />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">From</TableHead>
                <TableHead className="text-xs">To</TableHead>
                <TableHead className="text-xs">Reason</TableHead>
                <TableHead className="text-xs w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm font-medium">{t.student_name}</TableCell>
                  <TableCell><Badge className={TYPE_COLORS[t.transfer_type] || ''}>{t.transfer_type}</Badge></TableCell>
                  <TableCell className="text-sm">{t.transfer_date}</TableCell>
                  <TableCell className="text-sm text-slate-600">{t.from_school || t.from_section || '—'}</TableCell>
                  <TableCell className="text-sm text-slate-600">{t.to_school || t.to_section || '—'}</TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-xs truncate">{t.reason}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(t.id)}>
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
          <DialogHeader><DialogTitle>Record Transfer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Student</Label>
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.last_name}, {s.first_name} ({s.lrn})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Transfer Type</Label>
                <Select value={form.transfer_type} onValueChange={v => setForm({ ...form, transfer_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferred_in">Transferred In</SelectItem>
                    <SelectItem value="transferred_out">Transferred Out</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                    <SelectItem value="section_change">Section Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transfer Date</Label>
                <Input type="date" value={form.transfer_date} onChange={e => setForm({ ...form, transfer_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Quarter at Transfer</Label>
              <Select value={form.quarter_at_transfer} onValueChange={v => setForm({ ...form, quarter_at_transfer: v })}>
                <SelectTrigger><SelectValue placeholder="Select quarter (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From School</Label>
                <Input value={form.from_school} onChange={e => setForm({ ...form, from_school: e.target.value })} />
              </div>
              <div>
                <Label>To School</Label>
                <Input value={form.to_school} onChange={e => setForm({ ...form, to_school: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.student_id || createMutation.isPending} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              {createMutation.isPending ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

Transfers.layout = (page) => <AppLayout currentPageName="Transfers">{page}</AppLayout>;
