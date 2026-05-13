import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '../components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import EmptyState from '../components/shared/EmptyState';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import { base44 } from '@/lib/api';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/utils';
import { usePage, Link } from '@inertiajs/react';
import { UserRound, GraduationCap, UserPlus } from 'lucide-react';
import React from 'react';

export default function ParentEnrollment() {
  const qc = useQueryClient();
  const { props } = usePage();
  const flashSuccess =
    props?.flash?.success ?? props?.flash?.info ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-onboarding-summary'],
    queryFn: async () => {
      const { data: payload } = await http.get('/parent/onboarding-summary');
      return payload?.data ?? payload;
    },
  });

  const { data: schoolYearsForForm = [], isFetching: loadingYears } =
    useQuery({
      queryKey: ['schoolYears', 'parent-enroll'],
      queryFn: () => base44.entities.SchoolYear.list('-created_date'),
    });

  const activeYearShared = props?.active_school_year;
  const [formOpen, setFormOpen] = React.useState(false);
  const [selectedStudentId, setSelectedStudentId] = React.useState(null);

  const [form, setForm] = React.useState({
    school_year_id: '',
    grade_level_id: '',
    section_id: '',
    enrollment_date: new Date().toISOString().slice(0, 10),
    enrollment_type: 'new',
  });

  const selectedStudent = React.useMemo(
    () =>
      (data?.children ?? []).find(
        (row) =>
          Number(row.student.id) === Number(selectedStudentId),
      ),
    [data, selectedStudentId],
  );

  const { data: gradeLevels = [] } = useQuery({
    queryKey: ['gradeLevels'],
    queryFn: () => base44.entities.GradeLevel.list(),
  });

  const { data: sections = [] } = useQuery({
    queryKey: [
      'sections',
      form.school_year_id,
      form.grade_level_id,
    ],
    queryFn: () =>
      base44.entities.Section.filter({
        school_year_id: Number(form.school_year_id),
        grade_level_id: form.grade_level_id
          ? Number(form.grade_level_id)
          : undefined,
      }),
    enabled: !!form.school_year_id && !!form.grade_level_id,
  });

  const enrollmentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await http.post('/enrollments', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      toast.success('School enrollment submitted');
      qc.invalidateQueries({ queryKey: ['parent-onboarding-summary'] });
      setFormOpen(false);
      await qc.invalidateQueries({ queryKey: ['parent-portal'] });
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const openForStudent = (row) => {
    // Prevent opening if enrollment is already submitted
    if (row.enrollment_for_active_year?.grade_level) {
      toast.error('This enrollment has been submitted and cannot be modified.');
      return;
    }

    const syId =
      data?.active_school_year?.id ||
      activeYearShared?.id ||
      schoolYearsForForm.find((y) => y.is_active)?.id ||
      '';

    setSelectedStudentId(row.student.id);
    setForm({
      school_year_id: syId ? String(syId) : '',
      grade_level_id: '',
      section_id: '',
      enrollment_date: new Date().toISOString().slice(0, 10),
      enrollment_type: 'new',
    });
    setFormOpen(true);
  };

  const submitEnrollment = () => {
    const studentId = selectedStudent?.student?.id;
    if (!studentId || !form.school_year_id || !form.grade_level_id || !form.enrollment_date) {
      toast.error('School year, grade level, and date are required.');
      return;
    }

    enrollmentMutation.mutate({
      student_id: Number(studentId),
      school_year_id: Number(form.school_year_id),
      grade_level_id: Number(form.grade_level_id),
      section_id: form.section_id ? Number(form.section_id) : null,
      enrollment_date: form.enrollment_date,
      enrollment_type: form.enrollment_type,
      status: 'enrolled',
    });
  };

  const guardian = data?.guardian;

  const needsList = React.useMemo(() => {
    return (data?.children ?? []).filter((c) => c.needs_school_enrollment);
  }, [data]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="School enrollment" description="Loading profile…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="School enrollment" />
        <EmptyState icon={GraduationCap} title="Something went wrong" description={extractApiError(error)} />
      </div>
    );
  }

  if (!guardian && !(data?.children ?? []).length) {
    return (
      <div>
        <PageHeader title="School enrollment" />
        <EmptyState
          icon={UserRound}
          title="Profile not linked"
          description="We could not find guardian details for your account yet. Contact the registrar if this continues."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="School enrollment"
          description="Complete grade and section assignments for each learner registered under your guardian profile. Names and demographics were captured during online registration."
        />
        <Link href="/ParentEnrollStudent">
          <Button className="bg-[#1e3a5f] hover:bg-[#2c5282]">
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll Student
          </Button>
        </Link>
      </div>

      {flashSuccess && (
        <Card className="border-emerald-200 bg-emerald-50 shadow-none">
          <CardContent className="py-3 text-sm text-emerald-900">
            {String(flashSuccess)}
          </CardContent>
        </Card>
      )}

      {!data.active_school_year && (
        <Card className="border-amber-200 bg-amber-50 shadow-none">
          <CardContent className="py-3 text-xs text-amber-900">
            No active school year is marked in TALAIS yet—you can still draft an enrollment row by
            picking a listed school year.
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Guardian on file</p>
          <p className="font-medium text-[#1e3a5f]">
            {guardian.first_name} {guardian.middle_name} {guardian.last_name}{' '}
            <Badge variant="outline">{guardian.relationship}</Badge>
          </p>
          <p className="text-sm text-slate-600">
            {guardian.contact_number} · {guardian.email}
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {(data.children ?? []).length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UserRound}
                title="No learners linked"
                description="Add learner profiles via registration or notify the registrar."
              />
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Learner</th>
                  <th className="text-left px-4 py-3 font-semibold">Demographics</th>
                  <th className="text-left px-4 py-3 font-semibold">Grade level</th>
                  <th className="text-left px-4 py-3 font-semibold">Enrollment Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data.children ?? []).map((row) => {
                  const meta = [];
                  meta.push(`${row.student.gender ?? ''}`);
                  if (row.student.birth_date)
                    meta.push(`DOB ${row.student.birth_date}`);
                  const enroll = row.enrollment_for_active_year;
                  const needs = row.needs_school_enrollment;
                  const statusLabel =
                    enroll?.grade_level ??
                    (needs ? 'Awaiting guardian submission' : '—');

                  return (
                    <tr key={row.student.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">
                        {row.student.last_name}, {row.student.first_name}
                        {row.student.lrn ? (
                          <p className="text-xs text-slate-400 mt-1">LRN {row.student.lrn}</p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">LRN pending</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{meta.filter(Boolean).join(' · ')}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                        {enroll?.grade_level ? enroll.grade_level : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {enroll?.grade_level && (
                          <Badge className="bg-emerald-100 text-emerald-800">Submitted</Badge>
                        )}
                        {!enroll?.grade_level && needs && (
                          <Badge className="bg-amber-100 text-amber-800">Awaiting submission</Badge>
                        )}
                        {!enroll?.grade_level && !needs && (
                          <Badge variant="secondary">Other year on file</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href="/ParentPortal">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {needsList.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/40 shadow-none">
          <CardContent className="py-3 text-sm text-blue-950">
            {needsList.length} learner{needsList.length > 1 ? 's' : ''}{' '}
            still require school-year enrollment. Once submitted, registrar staff validate the assignments in the main enrollment module alongside your saved learner profiles.
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => setFormOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add school enrollment</DialogTitle>
            <p className="text-xs text-slate-500">
              Selecting grade and section for{' '}
              <span className="font-semibold">
                {selectedStudent?.student?.first_name}{' '}
                {selectedStudent?.student?.last_name}
              </span>
              . Registrar staff use the staff enrollment dashboard to reconcile with official records if needed.
            </p>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5">
              <Label>School year</Label>
              <Select
                value={form.school_year_id || undefined}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, school_year_id: v, grade_level_id: '', section_id: '' }))
                }
              >
                <SelectTrigger disabled={loadingYears}>
                  <SelectValue placeholder="Select school year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYearsForForm.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.label}{y.is_active ? ' (active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Grade level</Label>
              <Select
                value={form.grade_level_id || undefined}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, grade_level_id: v, section_id: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((gl) => (
                    <SelectItem key={gl.id} value={String(gl.id)}>
                      {gl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Section (optional)</Label>
              <Select
                value={form.section_id ? String(form.section_id) : '_none'}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    section_id: v === '_none' ? '' : v,
                  }))
                }
                disabled={!form.grade_level_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assigned later" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Not assigned yet</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Enrollment date</Label>
                <Input
                  type="date"
                  value={form.enrollment_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, enrollment_date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Enrollment type</Label>
                <Select
                  value={form.enrollment_type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, enrollment_type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New learner</SelectItem>
                    <SelectItem value="continuing">Continuing</SelectItem>
                    <SelectItem value="transfer_in">Transfer in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEnrollment}
              disabled={enrollmentMutation.isPending}
              className="bg-[#1e3a5f]"
            >
              {enrollmentMutation.isPending ? 'Saving…' : 'Save enrollment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

ParentEnrollment.layout = (page) => (
  <AppLayout currentPageName="ParentEnrollment">{page}</AppLayout>
);
