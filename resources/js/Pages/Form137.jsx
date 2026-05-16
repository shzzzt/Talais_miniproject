import AppLayout from '@/Layouts/AppLayout';
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44, http } from "@/lib/api";
import { FileText, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

const GRADE_LEVELS_ORDER = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const ALL_SECTIONS = "all";

function filenameFromDisposition(disposition, fallback) {
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

export default function Form137() {
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState(ALL_SECTIONS);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });
  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: () => base44.entities.Section.list(),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => base44.entities.Grade.list(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list(),
  });

  const filteredStudents = useMemo(() => (
    students
      .filter((s) => s.status === "enrolled")
      .filter((s) => selectedSection === ALL_SECTIONS || String(s.current_section_id) === selectedSection)
      .filter((s) => `${s.first_name} ${s.last_name} ${s.lrn}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
  ), [students, selectedSection, search]);

  // Get all grades for selected student grouped by grade level
  const studentGrades = useMemo(() => {
    if (!selectedStudent) return {};
    const studentGradeRecords = grades.filter(g => g.student_id === selectedStudent.id);
    const grouped = {};

    GRADE_LEVELS_ORDER.forEach(gl => {
      const levelGrades = studentGradeRecords.filter(g => g.grade_level === gl);
      if (levelGrades.length > 0) {
        // Group by subject
        const bySubject = {};
        levelGrades.forEach(g => {
          if (!bySubject[g.subject_name]) bySubject[g.subject_name] = {};
          bySubject[g.subject_name][g.quarter] = g.quarterly_grade;
        });
        grouped[gl] = bySubject;
      }
    });

    return grouped;
  }, [selectedStudent, grades]);

  const downloadReport = async (type) => {
    if (!selectedStudent) return;
    setDownloading(type);
    try {
      const path = type === "form137" ? "/reports/form137" : "/reports/form138";
      const response = await http.get(`${path}?student_id=${selectedStudent.id}`, { responseType: "blob" });
      const filename = filenameFromDisposition(response.headers?.["content-disposition"], `${type}.pdf`);
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to download report.");
    } finally {
      setDownloading(null);
    }

  };

  return (
    <div>
      <PageHeader
        title="Form 137 – Permanent Record"
        description="Search and view historical student grades across all grade levels"
      />

      {/* Selectors */}
      <Card className="border-0 shadow-sm p-4 mb-5">
        <div className="grid md:grid-cols-[240px_1fr_1fr] gap-3">
          <Select value={selectedSection} onValueChange={(value) => { setSelectedSection(value); setSelectedStudent(null); }}>
            <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SECTIONS}>All sections</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={String(section.id)}>{section.name} - {section.grade_level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStudent ? String(selectedStudent.id) : ""} onValueChange={(value) => setSelectedStudent(students.find((s) => String(s.id) === value) ?? null)}>
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {filteredStudents.map((student) => (
                <SelectItem key={student.id} value={String(student.id)}>
                  {student.last_name}, {student.first_name} - {student.current_section_name || "No section"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search within selection..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedStudent(null); }}
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Student List */}
      {search && !selectedStudent && (
        <Card className="border-0 shadow-sm mb-5 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No students found</div>
          ) : (
            <div className="divide-y">
              {filteredStudents.slice(0, 10).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStudent(s); setSearch(""); }}
                  className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.last_name}, {s.first_name} {s.middle_name}</p>
                    <p className="text-xs text-slate-400">LRN: {s.lrn} • {s.current_grade_level}</p>
                  </div>
                  <Badge variant="secondary">{s.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Student Record */}
      {selectedStudent && (
        <div className="space-y-5">
          {/* Student Header */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {selectedStudent.last_name}, {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.suffix}
                  </h2>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    <span>LRN: {selectedStudent.lrn}</span>
                    <span>Birthday: {selectedStudent.birthday}</span>
                    <span>Gender: {selectedStudent.gender}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedStudent(null)}>Back to Search</Button>
                  <Button variant="outline" onClick={() => downloadReport("form138")} isLoading={downloading === "form138"} loadingText="Downloading...">
                    <Download className="w-4 h-4 mr-2" /> Form 138
                  </Button>
                  <Button onClick={() => downloadReport("form137")} isLoading={downloading === "form137"} loadingText="Downloading..." className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
                    <Download className="w-4 h-4 mr-2" /> Form 137 PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade Records by Level */}
          {Object.keys(studentGrades).length === 0 ? (
            <EmptyState icon={FileText} title="No grade records" description="No grades have been recorded for this student yet" />
          ) : (
            Object.entries(studentGrades).map(([gradeLevel, subjectGrades]) => (
              <Card key={gradeLevel} className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 py-3 px-5">
                  <CardTitle className="text-sm">{gradeLevel}</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs text-center">Q1</TableHead>
                      <TableHead className="text-xs text-center">Q2</TableHead>
                      <TableHead className="text-xs text-center">Q3</TableHead>
                      <TableHead className="text-xs text-center">Q4</TableHead>
                      <TableHead className="text-xs text-center">Final</TableHead>
                      <TableHead className="text-xs">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(subjectGrades).map(([subjName, quarters]) => {
                      let total = 0, count = 0;
                      QUARTERS.forEach(q => { if (quarters[q]) { total += quarters[q]; count++; } });
                      const final_grade = count > 0 ? Math.round(total / count) : 0;
                      return (
                        <TableRow key={subjName}>
                          <TableCell className="text-sm font-medium">{subjName}</TableCell>
                          {QUARTERS.map(q => (
                            <TableCell key={q} className="text-center text-sm">
                              {quarters[q] || "—"}
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <span className={`font-bold ${final_grade >= 75 ? "text-emerald-600" : "text-red-600"}`}>
                              {final_grade || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {final_grade > 0 && (
                              <Badge className={final_grade >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                {final_grade >= 75 ? "Passed" : "Failed"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            ))
          )}
        </div>
      )}

      {!selectedStudent && !search && (
        <EmptyState icon={FileText} title="Select a student" description="Choose a section, then select a student to view their permanent academic record" />
      )}
    </div>
  );
}

Form137.layout = (page) => <AppLayout currentPageName="Form137">{page}</AppLayout>;
