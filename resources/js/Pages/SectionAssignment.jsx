import AppLayout from '@/Layouts/AppLayout';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/utils';
import { LayoutGrid, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

function studentDisplayName(student) {
  if (!student) return '—';
  const parts = [
    student.last_name,
    student.first_name,
    student.middle_name,
  ].filter(Boolean);
  return parts.join(', ') || '—';
}

export default function SectionAssignment() {
  const qc = useQueryClient();
  const [schoolYearId, setSchoolYearId] = useState(null);
  const [gradeLevelId, setGradeLevelId] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: schoolYears = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['school-years', 'section-assignment'],
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

  const { data: gradeLevels = [] } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: async () => {
      const { data } = await http.get('/grade-levels');
      return data?.data ?? [];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', 'section-assignment', schoolYearId],
    queryFn: async () => {
      if (!schoolYearId) return [];
      const { data } = await http.get('/sections', {
        params: { school_year_id: schoolYearId },
      });
      return data?.data ?? [];
    },
    enabled: !!schoolYearId,
  });

  const {
    data: rows = [],
    isLoading: rowsLoading,
    isFetching: rowsFetching,
  } = useQuery({
    queryKey: [
      'section-assignments',
      schoolYearId,
      gradeLevelId,
      unassignedOnly,
      debouncedSearch,
    ],
    queryFn: async () => {
      if (!schoolYearId) return [];
      const params = {
        school_year_id: schoolYearId,
        unassigned_only: unassignedOnly ? 1 : 0,
      };
      if (gradeLevelId) params.grade_level_id = Number(gradeLevelId);
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await http.get('/section-assignments', { params });
      return data?.data ?? [];
    },
    enabled: !!schoolYearId,
  });

  const sectionsByGrade = useMemo(() => {
    const map = new Map();
    for (const s of sections) {
      const gid = s.grade_level_id;
      if (gid == null) continue;
      if (!map.has(gid)) map.set(gid, []);
      map.get(gid).push(s);
    }
    for (const [, list] of map) {
      list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }
    return map;
  }, [sections]);

  const assignMutation = useMutation({
    mutationFn: async ({ enrollmentId, sectionId }) => {
      const { data } = await http.patch(`/section-assignments/${enrollmentId}`, {
        section_id: sectionId,
      });
      return data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['section-assignments'] });
      toast.success('Section updated');
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const handleSectionChange = (enrollment, value) => {
    const next =
      value === '' || value === '__none__' ? null : Number(value);
    const current = enrollment.section_id ?? null;
    if (next === current) return;
    assignMutation.mutate({ enrollmentId: enrollment.id, sectionId: next });
  };

  const loading = yearsLoading || !schoolYearId;
  const tableBusy = rowsLoading || rowsFetching;

  return (
    <AppLayout currentPageName="SectionAssignment">
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          title="Section assignment"
          description="Assign each learner to a section for their grade level and school year. Sections must match the enrollment grade."
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

            <div className="grid gap-2 min-w-[180px]">
              <Label>Grade level</Label>
              <Select
                value={gradeLevelId || 'all'}
                onValueChange={(v) => setGradeLevelId(v === 'all' ? '' : v)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
                  {gradeLevels.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 min-w-[220px] items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-8 bg-white"
                  placeholder="Search name or LRN…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox
                id="unassigned-only"
                checked={unassignedOnly}
                onCheckedChange={(v) => setUnassignedOnly(v === true)}
              />
              <label
                htmlFor="unassigned-only"
                className="text-sm text-slate-700 cursor-pointer"
              >
                Unassigned only
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              className="lg:ml-auto"
              onClick={() =>
                qc.invalidateQueries({ queryKey: ['section-assignments'] })
              }
            >
              Refresh
            </Button>
          </div>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500 text-sm">Loading school years…</div>
          ) : tableBusy ? (
            <div className="p-10 text-center text-slate-500 text-sm">Loading enrollments…</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="No enrollments match your filters"
              description="Adjust school year, grade, or search, or clear “Unassigned only”."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold">Learner</TableHead>
                  <TableHead className="font-semibold">LRN</TableHead>
                  <TableHead className="font-semibold">Grade</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold w-[280px]">Section</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const gid = row.grade_level_id;
                  const options = [...(sectionsByGrade.get(gid) ?? [])];
                  if (
                    row.section_id &&
                    row.section &&
                    !options.some((s) => s.id === row.section_id)
                  ) {
                    options.push({
                      id: row.section_id,
                      name: row.section.name,
                      type: row.section.type,
                    });
                  }
                  const selectValue =
                    row.section_id != null ? String(row.section_id) : '__none__';

                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-800">
                        {studentDisplayName(row.student)}
                      </TableCell>
                      <TableCell className="text-slate-600 tabular-nums">
                        {row.student?.lrn ?? '—'}
                      </TableCell>
                      <TableCell>{row.grade_level?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {row.status ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={selectValue}
                          disabled={assignMutation.isPending}
                          onValueChange={(v) => handleSectionChange(row, v)}
                        >
                          <SelectTrigger className="w-full max-w-[260px] bg-white">
                            <SelectValue placeholder="Choose section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Unassigned</SelectItem>
                            {options.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                                {s.type ? ` (${s.type})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
