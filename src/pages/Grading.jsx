import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, Save, Download, Calculator, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

// DepEd Grade Computation Weights (Elementary)
const WEIGHTS = {
  written_work: 0.30,
  performance_task: 0.50,
  quarterly_exam: 0.20,
};

function computeGrade(ww_score, ww_total, pt_score, pt_total, qe_score, qe_total) {
  if (!ww_total || !pt_total || !qe_total) return { ww_ps: 0, pt_ps: 0, qe_ps: 0, ww_ws: 0, pt_ws: 0, qe_ws: 0, grade: 0 };
  const ww_ps = (ww_score / ww_total) * 100;
  const pt_ps = (pt_score / pt_total) * 100;
  const qe_ps = (qe_score / qe_total) * 100;
  const ww_ws = ww_ps * WEIGHTS.written_work;
  const pt_ws = pt_ps * WEIGHTS.performance_task;
  const qe_ws = qe_ps * WEIGHTS.quarterly_exam;
  const grade = Math.round(ww_ws + pt_ws + qe_ws);
  return { ww_ps: Math.round(ww_ps * 100) / 100, pt_ps: Math.round(pt_ps * 100) / 100, qe_ps: Math.round(qe_ps * 100) / 100, ww_ws: Math.round(ww_ws * 100) / 100, pt_ws: Math.round(pt_ws * 100) / 100, qe_ws: Math.round(qe_ws * 100) / 100, grade };
}

export default function Grading() {
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");
  const [gradesMap, setGradesMap] = useState({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: sections = [] } = useQuery({ queryKey: ["sections"], queryFn: () => base44.entities.Section.list() });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => base44.entities.Subject.list() });
  const { data: allGrades = [] } = useQuery({ queryKey: ["grades"], queryFn: () => base44.entities.Grade.list() });

  const section = sections.find(s => s.id === selectedSection);
  const filteredSubjects = subjects.filter(s => section && s.grade_level === section.grade_level);

  const sectionStudents = useMemo(() =>
    students.filter(s => s.current_section_id === selectedSection && s.status === "enrolled")
      .sort((a, b) => a.last_name.localeCompare(b.last_name)),
    [students, selectedSection]
  );

  // Load existing grades
  React.useEffect(() => {
    if (selectedSection && selectedSubject && selectedQuarter) {
      const map = {};
      sectionStudents.forEach(s => {
        const existing = allGrades.find(g =>
          g.student_id === s.id && g.subject_id === selectedSubject && g.quarter === selectedQuarter
        );
        map[s.id] = existing || {
          written_work_score: 0, written_work_total: 100,
          performance_task_score: 0, performance_task_total: 100,
          quarterly_exam_score: 0, quarterly_exam_total: 100,
          is_locked: false
        };
      });
      setGradesMap(map);
    }
  }, [selectedSection, selectedSubject, selectedQuarter, allGrades, sectionStudents]);

  const updateGradeField = (studentId, field, value) => {
    setGradesMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: parseFloat(value) || 0 }
    }));
  };

  const saveGrades = async () => {
    setSaving(true);
    const subject = subjects.find(s => s.id === selectedSubject);

    for (const student of sectionStudents) {
      const g = gradesMap[student.id];
      if (!g) continue;

      const computed = computeGrade(
        g.written_work_score, g.written_work_total,
        g.performance_task_score, g.performance_task_total,
        g.quarterly_exam_score, g.quarterly_exam_total
      );

      const data = {
        student_id: student.id,
        student_name: `${student.last_name}, ${student.first_name}`,
        subject_id: selectedSubject,
        subject_name: subject?.name || "",
        section_id: selectedSection,
        grade_level: section?.grade_level || "",
        quarter: selectedQuarter,
        written_work_score: g.written_work_score,
        written_work_total: g.written_work_total,
        performance_task_score: g.performance_task_score,
        performance_task_total: g.performance_task_total,
        quarterly_exam_score: g.quarterly_exam_score,
        quarterly_exam_total: g.quarterly_exam_total,
        written_work_ps: computed.ww_ps,
        performance_task_ps: computed.pt_ps,
        quarterly_exam_ps: computed.qe_ps,
        written_work_ws: computed.ww_ws,
        performance_task_ws: computed.pt_ws,
        quarterly_exam_ws: computed.qe_ws,
        quarterly_grade: computed.grade,
        remarks: computed.grade >= 75 ? "Passed" : "Failed",
        is_locked: g.is_locked || false,
      };

      const existing = allGrades.find(gr =>
        gr.student_id === student.id && gr.subject_id === selectedSubject && gr.quarter === selectedQuarter
      );

      if (existing) {
        await base44.entities.Grade.update(existing.id, data);
      } else {
        await base44.entities.Grade.create(data);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["grades"] });
    setSaving(false);
    toast.success("Grades saved!");
  };

  // Download Form 138 (Report Card) for all students in section
  const downloadReportCards = () => {
    if (!section) return;
    const csvRows = [["Student Name", "Subject", "Q1", "Q2", "Q3", "Q4", "Final Grade", "Remarks"]];

    sectionStudents.forEach(s => {
      filteredSubjects.forEach(subj => {
        const row = [
          `${s.last_name}, ${s.first_name}`,
          subj.name
        ];
        let total = 0;
        let count = 0;
        QUARTERS.forEach(q => {
          const g = allGrades.find(gr => gr.student_id === s.id && gr.subject_id === subj.id && gr.quarter === q);
          const grade = g?.quarterly_grade || 0;
          row.push(grade);
          if (grade > 0) { total += grade; count++; }
        });
        const final_grade = count > 0 ? Math.round(total / count) : 0;
        row.push(final_grade);
        row.push(final_grade >= 75 ? "Passed" : "Failed");
        csvRows.push(row);
      });
    });

    const csv = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Form138_${section.name}_ReportCards.csv`; a.click();
  };

  const ready = selectedSection && selectedSubject && selectedQuarter;

  return (
    <div>
      <PageHeader
        title="Grading System"
        description="Enter and compute student grades per quarter"
        action={ready && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadReportCards}>
              <Download className="w-4 h-4 mr-2" /> Form 138
            </Button>
            <Button onClick={saveGrades} disabled={saving} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Grades"}
            </Button>
          </div>
        )}
      />

      {/* Controls */}
      <Card className="border-0 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedSection} onValueChange={v => { setSelectedSection(v); setSelectedSubject(""); }}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select Section" /></SelectTrigger>
            <SelectContent>
              {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.grade_level} – {s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedSection}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select Subject" /></SelectTrigger>
            <SelectContent>
              {filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Weight Legend */}
      {ready && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <Badge variant="secondary" className="text-xs">Written Works: 30%</Badge>
          <Badge variant="secondary" className="text-xs">Performance Tasks: 50%</Badge>
          <Badge variant="secondary" className="text-xs">Quarterly Exam: 20%</Badge>
        </div>
      )}

      {!ready ? (
        <EmptyState icon={BookOpen} title="Select section, subject & quarter" description="Choose the filters above to start entering grades" />
      ) : sectionStudents.length === 0 ? (
        <EmptyState icon={BookOpen} title="No students" description="No enrolled students in this section" />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs" rowSpan={2}>#</TableHead>
                  <TableHead className="text-xs" rowSpan={2}>Student</TableHead>
                  <TableHead className="text-xs text-center" colSpan={2}>Written Works (30%)</TableHead>
                  <TableHead className="text-xs text-center" colSpan={2}>Perf. Tasks (50%)</TableHead>
                  <TableHead className="text-xs text-center" colSpan={2}>Quarterly Exam (20%)</TableHead>
                  <TableHead className="text-xs text-center">Grade</TableHead>
                  <TableHead className="text-xs">Remarks</TableHead>
                </TableRow>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-[10px]">Score</TableHead>
                  <TableHead className="text-[10px]">Total</TableHead>
                  <TableHead className="text-[10px]">Score</TableHead>
                  <TableHead className="text-[10px]">Total</TableHead>
                  <TableHead className="text-[10px]">Score</TableHead>
                  <TableHead className="text-[10px]">Total</TableHead>
                  <TableHead className="text-[10px] text-center">QG</TableHead>
                  <TableHead className="text-[10px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionStudents.map((s, i) => {
                  const g = gradesMap[s.id] || {};
                  const computed = computeGrade(
                    g.written_work_score || 0, g.written_work_total || 100,
                    g.performance_task_score || 0, g.performance_task_total || 100,
                    g.quarterly_exam_score || 0, g.quarterly_exam_total || 100
                  );
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{s.last_name}, {s.first_name}</TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 h-8 text-xs" value={g.written_work_score || ""}
                          onChange={e => updateGradeField(s.id, "written_work_score", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 h-8 text-xs" value={g.written_work_total || ""}
                          onChange={e => updateGradeField(s.id, "written_work_total", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 h-8 text-xs" value={g.performance_task_score || ""}
                          onChange={e => updateGradeField(s.id, "performance_task_score", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 h-8 text-xs" value={g.performance_task_total || ""}
                          onChange={e => updateGradeField(s.id, "performance_task_total", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 h-8 text-xs" value={g.quarterly_exam_score || ""}
                          onChange={e => updateGradeField(s.id, "quarterly_exam_score", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-16 h-8 text-xs" value={g.quarterly_exam_total || ""}
                          onChange={e => updateGradeField(s.id, "quarterly_exam_total", e.target.value)} />
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-bold ${computed.grade >= 75 ? "text-emerald-600" : "text-red-600"}`}>
                          {computed.grade}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={computed.grade >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                          {computed.grade >= 75 ? "Passed" : "Failed"}
                        </Badge>
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