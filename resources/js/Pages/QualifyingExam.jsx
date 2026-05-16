import AppLayout from '@/Layouts/AppLayout';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/utils';
import { Save, UserPlus, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';

function displayName(student) {
  if (!student) return '—';
  const parts = [student.last_name, student.first_name, student.middle_name].filter(Boolean);
  return parts.join(', ') || '—';
}

const GRADE_1_6_NAMES = new Set(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);

export default function QualifyingExam() {
  const qc = useQueryClient();
  const [schoolYearId, setSchoolYearId] = useState(null);
  const [gradeLevelId, setGradeLevelId] = useState('');
  const [scoreDrafts, setScoreDrafts] = useState({});

  const { data: schoolYears = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['school-years', 'qualifying-exam'],
    queryFn: async () => {
      const { data } = await http.get('/school-years', { params: { limit: 50 } });
      return data?.data ?? [];
    },
  });

  useEffect(() => {
    if (schoolYears.length === 0) return;
    if (schoolYearId != null) return;
    const active = schoolYears.find((y) => y.is_active);
    setSchoolYearId(active?.id ?? schoolYears[0]?.id ?? null);
  }, [schoolYears, schoolYearId]);

  const { data: gradeLevelsAll = [] } = useQuery({
    queryKey: ['grade-levels', 'qualifying-exam'],
    queryFn: async () => {
      const { data } = await http.get('/grade-levels');
      return data?.data ?? [];
    },
  });

  const gradeLevels16 = useMemo(
    () => gradeLevelsAll.filter((g) => GRADE_1_6_NAMES.has(g.name)),
    [gradeLevelsAll],
  );

  useEffect(() => {
    if (gradeLevels16.length === 0) return;
    if (gradeLevelId) return;
    setGradeLevelId(String(gradeLevels16[0].id));
  }, [gradeLevels16, gradeLevelId]);

  const {
    data: examPayload,
    isLoading: rowsLoading,
    isFetching: rowsFetching,
  } = useQuery({
    queryKey: ['qualifying-exams', schoolYearId, gradeLevelId],
    queryFn: async () => {
      if (!schoolYearId || !gradeLevelId) return { cream_threshold: 85, data: [] };
      const { data } = await http.get('/qualifying-exams', {
        params: {
          school_year_id: schoolYearId,
          grade_level_id: gradeLevelId,
          limit: 1200,
        },
      });
      return {
        cream_threshold: data?.cream_threshold ?? 85,
        rows: data?.data ?? [],
      };
    },
    enabled: !!schoolYearId && !!gradeLevelId,
  });

  const threshold = examPayload?.cream_threshold ?? 85;
  const rows = examPayload?.rows ?? [];

  const scoresFingerprint = useMemo(
    () => rows.map((e) => `${e.id}:${e.qualifying_score ?? ''}:${e.section_id ?? ''}`).join('|'),
    [rows],
  );

  // Sync drafts from server when grade/year or stored scores change (not on every refetch).
  useEffect(() => {
    const next = {};
    for (const e of rows) {
      const v = e.qualifying_score;
      next[e.id] = v === null || v === undefined ? '' : String(v);
    }
    setScoreDrafts(next);
  }, [schoolYearId, gradeLevelId, scoresFingerprint]);

  const parsedRowMeta = useMemo(() => {
    return rows.map((e) => {
      const raw = scoreDrafts[e.id];
      const trimmed = raw === undefined || raw === null ? '' : String(raw).trim();
      const num = trimmed === '' ? null : Number(trimmed);
      const invalid = trimmed !== '' && (Number.isNaN(num) || num < 0 || num > 100);
      let pct = null;
      let band = 'none';
      if (!invalid && num !== null) {
        pct = num;
        band = num >= threshold ? 'cream' : 'regular';
      }
      return { enrollmentId: e.id, invalid, num, pct, band };
    });
  }, [rows, scoreDrafts, threshold]);

  const summary = useMemo(() => {
    let cream = 0;
    let regular = 0;
    let noScore = 0;
    for (const m of parsedRowMeta) {
      if (m.invalid || m.num === null) noScore += 1;
      else if (m.band === 'cream') cream += 1;
      else regular += 1;
    }
    return { cream, regular, noScore };
  }, [parsedRowMeta]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const m of parsedRowMeta) {
        if (m.invalid) throw new Error('Fix invalid scores (0–100) before saving.');
      }
      const items = rows.map((e, i) => ({
        enrollment_id: e.id,
        qualifying_score: parsedRowMeta[i].num === null ? null : parsedRowMeta[i].num,
      }));
      await http.post('/qualifying-exams/bulk-scores', { items });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qualifying-exams'] });
      toast.success('Scores saved');
    },
    onError: (e) => toast.error(e.message || extractApiError(e)),
  });

  const autoAssignMutation = useMutation({
    mutationFn: async () => {
      const { data } = await http.post('/qualifying-exams/auto-assign', {
        school_year_id: schoolYearId,
        grade_level_id: Number(gradeLevelId),
      });
      return data?.data;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['qualifying-exams'] });
      const w = res?.warnings?.length ? ` ${res.warnings.join(' ')}` : '';
      toast.success(
        `Updated placements: ${res?.assigned_or_confirmed ?? 0} learners.${res?.learners_without_score ? ` ${res.learners_without_score} without scores skipped.` : ''}${w}`,
      );
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const loading = yearsLoading || !schoolYearId;
  const tableBusy = rowsLoading || rowsFetching;

  const setScore = (enrollmentId, value) => {
    setScoreDrafts((prev) => ({ ...prev, [enrollmentId]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Qualifying exam"
          description={`Cream class threshold: ${threshold}% and above`}
          action={
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={autoAssignMutation.isPending || !gradeLevelId}
                onClick={() => autoAssignMutation.mutate()}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Auto-assign sections
              </Button>
              <Button
                type="button"
                className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
                disabled={saveMutation.isPending || rows.length === 0}
                onClick={() => saveMutation.mutate()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save scores
              </Button>
            </div>
          }
        />

        <Card className="p-4 mb-4 border-slate-200 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="grid gap-2 min-w-[200px]">
              <Label>School year</Label>
              <Select
                value={schoolYearId != null ? String(schoolYearId) : ''}
                onValueChange={(v) => setSchoolYearId(v ? Number(v) : null)}
                disabled={loading || schoolYears.length === 0}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={yearsLoading ? 'Loading…' : 'Select year'} />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.label}
                      {y.is_active ? ' (active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 min-w-[200px]">
              <Label>Grade level</Label>
              <Select value={gradeLevelId || ''} onValueChange={(v) => setGradeLevelId(v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels16.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 items-center pb-0.5">
              <Badge className="bg-amber-100 text-amber-900 border-amber-200/80 font-medium gap-1">
                <Star className="w-3.5 h-3.5" />
                {summary.cream} Qualified (Cream)
              </Badge>
              <Badge variant="secondary" className="font-medium gap-1 text-slate-700">
                <User className="w-3.5 h-3.5" />
                {summary.regular} Regular
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500 text-sm">Loading school years…</div>
          ) : !gradeLevelId ? (
            <div className="p-10 text-center text-slate-500 text-sm">Select a grade level.</div>
          ) : tableBusy ? (
            <div className="p-10 text-center text-slate-500 text-sm">Loading students…</div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No enrollments for this grade"
              description="Enroll students for this grade in the active school year to enter qualifying scores."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-10 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Student name</TableHead>
                  <TableHead className="font-semibold w-[140px]">Score (out of 100)</TableHead>
                  <TableHead className="font-semibold w-[100px]">Percentage</TableHead>
                  <TableHead className="font-semibold w-[130px]">Result</TableHead>
                  <TableHead className="font-semibold min-w-[140px]">Assigned section</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e, idx) => {
                  const meta = parsedRowMeta[idx];
                  const section = e.section;
                  const typeLabel =
                    section?.type === 'cream' ? 'Cream' : section?.type === 'regular' ? 'Regular' : section?.type;
                  const sectionLabel = section?.name
                    ? `${section.name}${typeLabel ? ` (${typeLabel})` : ''}`
                    : null;

                  return (
                    <TableRow key={e.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-slate-500 tabular-nums">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-slate-800">{displayName(e.student)}</TableCell>
                      <TableCell>
                        <Input
                          className="h-9 max-w-[120px] bg-white"
                          inputMode="numeric"
                          placeholder="0–100"
                          value={scoreDrafts[e.id] ?? ''}
                          onChange={(ev) => setScore(e.id, ev.target.value)}
                        />
                        {meta?.invalid && (
                          <p className="text-[11px] text-red-600 mt-0.5">Enter 0–100</p>
                        )}
                      </TableCell>
                      <TableCell
                        className={
                          meta?.band === 'cream'
                            ? 'font-semibold text-amber-600 tabular-nums'
                            : 'text-slate-600 tabular-nums'
                        }
                      >
                        {meta?.pct === null || meta?.invalid ? '—' : `${Math.round(meta.pct)}%`}
                      </TableCell>
                      <TableCell>
                        {meta?.invalid || meta?.band === 'none' ? (
                          <span className="text-sm text-slate-400">No score</span>
                        ) : meta.band === 'cream' ? (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-200/80 gap-1 font-medium">
                            <Star className="w-3 h-3" />
                            Cream
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 font-medium text-slate-700">
                            <User className="w-3 h-3" />
                            Regular
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {sectionLabel || <span className="text-slate-400">Not assigned</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
  );
}

QualifyingExam.layout = (page) => <AppLayout currentPageName="QualifyingExam">{page}</AppLayout>;
