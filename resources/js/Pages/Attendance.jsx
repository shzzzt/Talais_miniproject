import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http, base44 } from '@/lib/api';
import { CalendarDays, Save, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', tone: 'bg-emerald-100 text-emerald-700' },
  { value: 'absent', label: 'Absent', tone: 'bg-red-100 text-red-700' },
  { value: 'late', label: 'Late', tone: 'bg-amber-100 text-amber-700' },
  { value: 'excused', label: 'Excused', tone: 'bg-sky-100 text-sky-700' },
];

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function Attendance() {
  const [date, setDate] = useState(todayIso());
  const [sectionId, setSectionId] = useState('');
  const [rows, setRows] = useState({});
  const queryClient = useQueryClient();

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => base44.entities.Section.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const sectionStudents = useMemo(() => {
    if (!sectionId) return [];
    return students
      .filter((s) => String(s.current_section_id) === String(sectionId))
      .filter((s) => s.status === 'enrolled')
      .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
  }, [students, sectionId]);

  const { data: existing = [] } = useQuery({
    enabled: !!sectionId && !!date,
    queryKey: ['attendance', sectionId, date],
    queryFn: async () => {
      const { data } = await http.get('/attendance', {
        params: { section_id: sectionId, date },
      });
      return data?.data ?? [];
    },
  });

  useEffect(() => {
    if (!sectionId || !date) return;
    const seeded = {};
    sectionStudents.forEach((s) => {
      const found = existing.find((r) => String(r.student_id) === String(s.id));
      seeded[s.id] = {
        am_status: found?.am_status ?? 'present',
        pm_status: found?.pm_status ?? 'present',
        remarks: found?.remarks ?? '',
      };
    });
    setRows(seeded);
  }, [sectionId, date, sectionStudents, existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = sectionStudents.map((s) => ({
        student_id: s.id,
        ...rows[s.id],
      }));
      const { data } = await http.post('/attendance/bulk', {
        date,
        section_id: sectionId ? Number(sectionId) : undefined,
        records,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance saved.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save attendance.');
    },
  });

  const setStatus = (studentId, field, value) => {
    setRows((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const ready = !!sectionId && !!date;
  const summary = useMemo(() => {
    const tally = { present: 0, absent: 0, late: 0, excused: 0 };
    sectionStudents.forEach((s) => {
      const r = rows[s.id];
      if (!r) return;
      const am = r.am_status;
      const pm = r.pm_status;
      [am, pm].forEach((status) => {
        if (status && tally[status] !== undefined) tally[status] += 0.5;
      });
    });
    return tally;
  }, [rows, sectionStudents]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Record AM/PM attendance per section, per day"
        action={
          ready && sectionStudents.length > 0 ? (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-[#1e3a5f] hover:bg-[#2c5282]"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Attendance'}
            </Button>
          ) : null
        }
      />

      <Card className="border-0 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Date</span>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Section</span>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.grade_level} – {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1" />
          {ready && sectionStudents.length > 0 && (
            <div className="flex items-end gap-2 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <Badge key={s.value} className={`${s.tone} text-xs`}>
                  {s.label}: {summary[s.value]}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {!ready ? (
        <EmptyState
          icon={CalendarDays}
          title="Pick a section and date"
          description="Select the section and date above to start taking attendance."
        />
      ) : sectionStudents.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No enrolled students"
          description="There are no enrolled students in the selected section."
        />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">LRN</TableHead>
                  <TableHead className="text-xs">AM</TableHead>
                  <TableHead className="text-xs">PM</TableHead>
                  <TableHead className="text-xs">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionStudents.map((s, i) => {
                  const r = rows[s.id] || { am_status: 'present', pm_status: 'present', remarks: '' };
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {s.last_name}, {s.first_name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{s.lrn}</TableCell>
                      <TableCell>
                        <Select
                          value={r.am_status}
                          onValueChange={(v) => setStatus(s.id, 'am_status', v)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.pm_status}
                          onValueChange={(v) => setStatus(s.id, 'pm_status', v)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.remarks ?? ''}
                          onChange={(e) => setStatus(s.id, 'remarks', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Optional"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

Attendance.layout = (page) => <AppLayout currentPageName="Attendance">{page}</AppLayout>;
