import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/lib/api';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '../components/shared/PageHeader';

const NONE = '__none__';

function openUrl(path) {
  if (!path) return;
  window.open(path, '_blank', 'noopener,noreferrer');
}

export default function Reports() {
  const [sectionId, setSectionId] = useState(NONE);
  const [schoolYearId, setSchoolYearId] = useState(NONE);
  const [studentId, setStudentId] = useState('');
  const [sf2From, setSf2From] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [sf2To, setSf2To] = useState(() => new Date().toISOString().slice(0, 10));
  const [sf4Month, setSf4Month] = useState(() => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => base44.entities.Section.list(),
  });
  const { data: years = [] } = useQuery({
    queryKey: ['school-years'],
    queryFn: () => base44.entities.SchoolYear.list(),
  });
  const { data: students = [] } = useQuery({
    queryKey: ['students-reports'],
    queryFn: () => base44.entities.Student.list(),
  });

  const q = (base) => {
    const p = new URLSearchParams();
    if (sectionId !== NONE) p.set('section_id', sectionId);
    if (schoolYearId !== NONE) p.set('school_year_id', schoolYearId);
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  const buildSf2 = (excel) => {
    if (sectionId === NONE) return null;
    const p = new URLSearchParams();
    p.set('section_id', sectionId);
    if (schoolYearId !== NONE) p.set('school_year_id', schoolYearId);
    p.set('from', sf2From);
    p.set('to', sf2To);
    const prefix = excel ? '/api/v1/reports/excel/sf2' : '/api/v1/reports/sf2';
    return `${prefix}?${p.toString()}`;
  };

  const buildSf4 = (excel) => {
    const p = new URLSearchParams();
    if (schoolYearId !== NONE) p.set('school_year_id', schoolYearId);
    p.set('month', sf4Month);
    const prefix = excel ? '/api/v1/reports/excel/sf4' : '/api/v1/reports/sf4';
    return `${prefix}?${p.toString()}`;
  };

  const buildForm137 = (pdf) => {
    if (!studentId) return null;
    const p = new URLSearchParams({ student_id: studentId });
    return `${pdf ? '/api/v1/reports/form137' : '/api/v1/reports/excel/form137'}?${p.toString()}`;
  };

  const buildForm138 = (pdf) => {
    if (!studentId) return null;
    const p = new URLSearchParams({ student_id: studentId });
    if (schoolYearId !== NONE) p.set('school_year_id', schoolYearId);
    return `${pdf ? '/api/v1/reports/form138' : '/api/v1/reports/excel/form138'}?${p.toString()}`;
  };

  const buildPir = (pdf) => {
    const p = new URLSearchParams();
    if (schoolYearId !== NONE) p.set('school_year_id', schoolYearId);
    const qstr = p.toString();
    const prefix = pdf ? '/api/v1/reports/pir' : '/api/v1/reports/excel/pir';
    return qstr ? `${prefix}?${qstr}` : prefix;
  };

  const rows = [
    { title: 'SF1 — School Register', pdf: () => openUrl(q('/api/v1/reports/sf1')), xlsx: () => openUrl(q('/api/v1/reports/excel/sf1')) },
    { title: 'SF2 — Attendance summary', pdf: () => openUrl(buildSf2(false)), xlsx: () => openUrl(buildSf2(true)), needsSection: true },
    { title: 'SF4 — Learner movement', pdf: () => openUrl(buildSf4(false)), xlsx: () => openUrl(buildSf4(true)) },
    { title: 'SF5 — Promotion', pdf: () => openUrl(q('/api/v1/reports/sf5')), xlsx: () => openUrl(q('/api/v1/reports/excel/sf5')) },
    { title: 'Form 137', pdf: () => openUrl(buildForm137(true)), xlsx: () => openUrl(buildForm137(false)), needsStudent: true },
    { title: 'Form 138', pdf: () => openUrl(buildForm138(true)), xlsx: () => openUrl(buildForm138(false)), needsStudent: true },
    { title: 'PIR', pdf: () => openUrl(buildPir(true)), xlsx: () => openUrl(buildPir(false)) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="DepEd Reports"
        description="Download SF1–SF5, Form 137/138, and PIR as PDF or Excel (same datasets as server-side PDFs)."
      />

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs">Section (SF1, SF2, SF5)</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>All sections (optional)</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name} — {s.grade_level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">School year</Label>
            <Select value={schoolYearId} onValueChange={setSchoolYearId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="School year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Active / default</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Student (Form 137 / 138)</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((st) => (
                  <SelectItem key={st.id} value={String(st.id)}>{st.last_name}, {st.first_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">SF4 reporting month label</Label>
            <Input className="mt-1" value={sf4Month} onChange={(e) => setSf4Month(e.target.value)} placeholder="e.g. June 2026" />
          </div>
          <div className="sm:col-span-2 flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">SF2 from</Label>
              <Input type="date" className="mt-1" value={sf2From} onChange={(e) => setSf2From(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label className="text-xs">SF2 to</Label>
              <Input type="date" className="mt-1" value={sf2To} onChange={(e) => setSf2To(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((row) => (
          <Card key={row.title} className="border-0 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">{row.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={row.needsSection && sectionId === NONE} onClick={row.pdf}>
                <FileText className="w-4 h-4 mr-1" /> PDF
              </Button>
              <Button
                size="sm"
                className="bg-[#1e3a5f] hover:bg-[#2c5282]"
                disabled={(row.needsSection && sectionId === NONE) || (row.needsStudent && !studentId)}
                onClick={row.xlsx}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        SF2 requires a section. Form 137 and Form 138 require a selected student. Other forms use optional section and school year filters.
      </p>
    </div>
  );
}

Reports.layout = (page) => <AppLayout currentPageName="Reports">{page}</AppLayout>;
