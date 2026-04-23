import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Search, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const GRADE_LEVELS_ORDER = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function Form137() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => base44.entities.Grade.list(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list(),
  });

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.lrn}`.toLowerCase().includes(search.toLowerCase())
  );

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

  const downloadForm137 = () => {
    if (!selectedStudent) return;
    const s = selectedStudent;
    const csvRows = [
      [`FORM 137 - Permanent Record`],
      [`Student: ${s.last_name}, ${s.first_name} ${s.middle_name || ""}`],
      [`LRN: ${s.lrn}`],
      [`Birthday: ${s.birthday}`],
      [`Gender: ${s.gender}`],
      [`Address: ${s.address}`],
      [],
    ];

    Object.entries(studentGrades).forEach(([gradeLevel, subjectGrades]) => {
      csvRows.push([gradeLevel]);
      csvRows.push(["Subject", "Q1", "Q2", "Q3", "Q4", "Final", "Remarks"]);
      Object.entries(subjectGrades).forEach(([subjName, quarters]) => {
        let total = 0, count = 0;
        QUARTERS.forEach(q => {
          if (quarters[q]) { total += quarters[q]; count++; }
        });
        const final_grade = count > 0 ? Math.round(total / count) : 0;
        csvRows.push([
          subjName,
          quarters.Q1 || "",
          quarters.Q2 || "",
          quarters.Q3 || "",
          quarters.Q4 || "",
          final_grade,
          final_grade >= 75 ? "Passed" : "Failed"
        ]);
      });
      csvRows.push([]);
    });

    const csv = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Form137_${s.last_name}_${s.first_name}.csv`; a.click();
  };

  return (
    <div>
      <PageHeader
        title="Form 137 – Permanent Record"
        description="Search and view historical student grades across all grade levels"
      />

      {/* Search */}
      <Card className="border-0 shadow-sm p-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search student by name or LRN..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedStudent(null); }}
            className="pl-9"
          />
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
                  <Button onClick={downloadForm137} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
                    <Download className="w-4 h-4 mr-2" /> Download
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
        <EmptyState icon={FileText} title="Search for a student" description="Enter a name or LRN to view their permanent academic record" />
      )}
    </div>
  );
}