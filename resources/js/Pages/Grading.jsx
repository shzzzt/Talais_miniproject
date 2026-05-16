import AppLayout from '@/Layouts/AppLayout';
import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44, http } from "@/lib/api";
import { BookOpen, FileSpreadsheet, FileText, Save, Users } from "lucide-react";
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const PRIMARY_ADVISER_GRADES = new Set(["Grade 1", "Grade 2", "Grade 3"]);
const GRADE_LEVEL_ORDER = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
const SF9_SUBJECT_ORDER = {
  "Grade 1": ["GMRC", "Reading and Literacy", "Mathematics", "Makabansa", "Language"],
  "Grade 2": ["GMRC", "Filipino", "English", "Mathematics", "Makabansa"],
  "Grade 3": ["Filipino", "English", "Mathematics", "Science", "Makabansa", "GMRC"],
  "Grade 4": ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "TLE", "MAPEH", "GMRC"],
  "Grade 5": ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "TLE", "MAPEH", "GMRC"],
  "Grade 6": ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "TLE", "Music", "Arts", "PE", "Health", "GMRC"],
};

function normalizeLabel(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getGradeLevelSortIndex(gradeLevel) {
  const index = GRADE_LEVEL_ORDER.findIndex((item) => normalizeLabel(item) === normalizeLabel(gradeLevel));
  return index === -1 ? GRADE_LEVEL_ORDER.length : index;
}

function getSf9SubjectSortIndex(gradeLevel, subjectName) {
  const order = SF9_SUBJECT_ORDER[gradeLevel] ?? [];
  const normalizedSubject = normalizeLabel(subjectName);
  const exactIndex = order.findIndex((item) => normalizeLabel(item) === normalizedSubject);
  if (exactIndex !== -1) return exactIndex;

  const aliasIndex = order.findIndex((item) => {
    const normalizedItem = normalizeLabel(item);
    if (normalizedItem === 'tle') return normalizedSubject.includes('technology and livelihood education') || normalizedSubject === 'tle';
    if (normalizedItem === 'mapeh') return normalizedSubject === 'mapeh';
    if (normalizedItem === 'gmrc') return normalizedSubject === 'gmrc' || normalizedSubject === 'good manners and right conduct';
    if (normalizedItem === 'reading and literacy') return normalizedSubject.includes('reading') || normalizedSubject.includes('literacy');
    if (normalizedItem === 'language') return normalizedSubject === 'language' || normalizedSubject === 'mother tongue';
    return false;
  });

  return aliasIndex !== -1 ? aliasIndex : order.length;
}

function gradeRemark(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return numeric >= 75 ? "Passed" : "Failed";
}

function filenameFromDisposition(disposition, fallback) {
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

function gradeKey(studentId, subjectId) {
  return `${studentId}:${subjectId}`;
}

export default function Grading() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");
  const [gradesMap, setGradesMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(null);

  const isFaculty = user?.role === "faculty";
  const isSchoolAdmin = user?.role === "school_admin";
  const isAdmin = user?.role === "admin";

  const { data: currentUserFaculty = null } = useQuery({
    queryKey: ["faculty-roster-self", user?.id],
    enabled: !!user?.id && isFaculty,
    queryFn: async () => {
      const faculty = await base44.entities.Faculty.list();
      return faculty.find((f) => String(f.user_id) === String(user?.id ?? "")) ?? null;
    },
  });

  const { data: sections = [] } = useQuery({ queryKey: ["sections"], queryFn: () => base44.entities.Section.list() });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => base44.entities.Subject.list() });
  const { data: allGrades = [] } = useQuery({ queryKey: ["grades"], queryFn: () => base44.entities.Grade.list() });
  const { data: mySchedules = [] } = useQuery({
    queryKey: ["faculty-class-schedules", currentUserFaculty?.id],
    enabled: !!currentUserFaculty?.id && isFaculty,
    queryFn: async () => {
      const { data } = await http.get('/class-schedules', { params: { faculty_id: currentUserFaculty.id, limit: 500 } });
      return data?.data ?? [];
    },
  });

  const section = sections.find((item) => String(item.id) === String(selectedSection));
  const sectionSubjects = useMemo(() => (
    subjects
      .filter((subject) => section && subject.grade_level === section.grade_level)
      .sort((a, b) => {
        const orderDiff = getSf9SubjectSortIndex(section.grade_level, a.name) - getSf9SubjectSortIndex(section.grade_level, b.name);
        return orderDiff || a.name.localeCompare(b.name);
      })
  ), [subjects, section]);

  const facultySectionAccess = useMemo(() => {
    if (!isFaculty) return [];
    const map = new Map();

    mySchedules.forEach((schedule) => {
      if (!schedule.section_id || !schedule.subject_id) return;
      const sectionId = String(schedule.section_id);
      if (!map.has(sectionId)) {
        map.set(sectionId, {
          section_id: sectionId,
          section_label: schedule.section || schedule.section_name || "Unknown section",
          grade_level: schedule.grade_level || "",
          subject_ids: new Set(),
          advisory_all_subjects: false,
        });
      }
      map.get(sectionId).subject_ids.add(String(schedule.subject_id));
    });

    sections
      .filter((item) => String(item.adviser_id ?? "") === String(user?.id ?? ""))
      .forEach((advisorySection) => {
        const sectionId = String(advisorySection.id);
        if (!map.has(sectionId)) {
          map.set(sectionId, {
            section_id: sectionId,
            section_label: `${advisorySection.name}${advisorySection.grade_level ? ` (${advisorySection.grade_level})` : ""}`,
            grade_level: advisorySection.grade_level || "",
            subject_ids: new Set(),
            advisory_all_subjects: false,
          });
        }
        const entry = map.get(sectionId);
        if (PRIMARY_ADVISER_GRADES.has(advisorySection.grade_level)) {
          entry.advisory_all_subjects = true;
        }
      });

    return [...map.values()].sort((a, b) => {
      const gradeDiff = getGradeLevelSortIndex(a.grade_level) - getGradeLevelSortIndex(b.grade_level);
      return gradeDiff || a.section_label.localeCompare(b.section_label);
    });
  }, [isFaculty, mySchedules, sections, user?.id]);

  const selectableSections = isFaculty
    ? facultySectionAccess
    : sections.map((item) => ({
        section_id: String(item.id),
        section_label: `${item.grade_level} - ${item.name}`,
        grade_level: item.grade_level,
        subject_ids: new Set(),
        advisory_all_subjects: true,
      }));

  const selectedAccess = selectableSections.find((item) => String(item.section_id) === String(selectedSection));

  const visibleSubjects = useMemo(() => {
    if (!section) return [];
    if (!isFaculty || selectedAccess?.advisory_all_subjects) return sectionSubjects;
    return sectionSubjects.filter((subject) => selectedAccess?.subject_ids?.has(String(subject.id)));
  }, [isFaculty, section, sectionSubjects, selectedAccess]);

  const sectionStudents = useMemo(() => (
    students
      .filter((student) => String(student.current_section_id) === String(selectedSection) && student.status === "enrolled")
      .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
  ), [students, selectedSection]);

  React.useEffect(() => {
    if (!selectedSection && selectableSections.length > 0) {
      setSelectedSection(selectableSections[0].section_id);
    }
  }, [selectedSection, selectableSections]);

  React.useEffect(() => {
    if (!selectedSection || !selectedQuarter || visibleSubjects.length === 0) {
      setGradesMap({});
      return;
    }

    const nextMap = {};
    sectionStudents.forEach((student) => {
      visibleSubjects.forEach((subject) => {
        const existing = allGrades.find((grade) =>
          String(grade.student_id) === String(student.id) &&
          String(grade.subject_id) === String(subject.id) &&
          grade.quarter === selectedQuarter
        );
        nextMap[gradeKey(student.id, subject.id)] = existing?.quarterly_grade ?? existing?.final_grade ?? "";
      });
    });
    setGradesMap(nextMap);
  }, [selectedSection, selectedQuarter, visibleSubjects, sectionStudents, allGrades]);

  React.useEffect(() => {
    if (selectedSection) {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  }, [selectedSection, queryClient]);

  const ready = !!selectedSection && !!selectedQuarter && visibleSubjects.length > 0;

  const updateGrade = (studentId, subjectId, value) => {
    const cleaned = value === "" ? "" : Math.max(0, Math.min(100, Number(value)));
    setGradesMap((prev) => ({ ...prev, [gradeKey(studentId, subjectId)]: cleaned }));
  };

  const saveGrades = async () => {
    if (!ready) return;
    setSaving(true);
    try {
      for (const student of sectionStudents) {
        for (const subject of visibleSubjects) {
          const value = gradesMap[gradeKey(student.id, subject.id)];
          if (value === "" || value == null) continue;
          const numeric = Number(value);
          if (!Number.isFinite(numeric)) continue;

          const payload = {
            student_id: student.id,
            subject_id: subject.id,
            section_id: selectedSection,
            quarter: selectedQuarter,
            quarterly_grade: numeric,
            final_grade: numeric,
            remarks: gradeRemark(numeric),
          };

          const existing = allGrades.find((grade) =>
            String(grade.student_id) === String(student.id) &&
            String(grade.subject_id) === String(subject.id) &&
            grade.quarter === selectedQuarter
          );

          if (existing) {
            await base44.entities.Grade.update(existing.id, payload);
          } else {
            await base44.entities.Grade.create(payload);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Grades saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save grades.");
    } finally {
      setSaving(false);
    }
  };

  const downloadForm138 = async (studentId, format) => {
    const params = new URLSearchParams({ student_id: String(studentId) });
    const student = students.find((item) => String(item.id) === String(studentId));
    if (student?.school_year_id) params.set("school_year_id", String(student.school_year_id));
    const path = format === "pdf" ? "/api/v1/reports/form138" : "/api/v1/reports/excel/form138";
    const key = `${studentId}-${format}`;

    setDownloadingReport(key);
    try {
      const response = await http.get(`${path.replace(/^\/api\/v1/, "")}?${params.toString()}`, { responseType: "blob" });
      const extension = format === "pdf" ? "pdf" : "xlsx";
      const filename = filenameFromDisposition(response.headers?.["content-disposition"], `Form138.${extension}`);
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Form 138 downloaded");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to download Form 138.");
    } finally {
      setDownloadingReport(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Grading"
        description="Record quarterly final grades by section."
        action={ready && (
          <div className="flex gap-2">
            <Button
              onClick={saveGrades}
              isLoading={saving}
              loadingText="Saving..."
              className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
            >
              <Save className="w-4 h-4 mr-2" /> Save Grades
            </Button>
          </div>
        )}
      />

      <Card className="border-0 shadow-sm p-4 mb-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Users className="w-4 h-4" /> Assigned grading sections
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {selectableSections.map((item) => (
                  <SelectItem key={item.section_id} value={item.section_id}>
                    {item.section_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUARTERS.map((quarter) => <SelectItem key={quarter} value={quarter}>{quarter}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {section && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <Badge variant="secondary">{section.grade_level}</Badge>
              <span>
                {selectedAccess?.advisory_all_subjects
                  ? "Adviser view: all subjects are available."
                  : "Subject teacher view: only assigned subject columns are available."}
              </span>
            </div>
          )}
        </div>
      </Card>

      {!selectedSection ? (
        <EmptyState icon={BookOpen} title="Select a section" description="Choose an assigned section to start grading." />
      ) : visibleSubjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects available" description="This account is not assigned to any gradable subject for the selected section." />
      ) : sectionStudents.length === 0 ? (
        <EmptyState icon={BookOpen} title="No students" description="No enrolled students in this section." />
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs w-10">#</TableHead>
                  <TableHead className="text-xs min-w-[220px]">Student</TableHead>
                  {visibleSubjects.map((subject) => (
                    <TableHead key={subject.id} className="text-xs min-w-[150px] text-center">
                      {subject.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs min-w-[120px] text-center">Form 138</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-xs text-slate-400">{index + 1}</TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {student.last_name}, {student.first_name}
                    </TableCell>
                    {visibleSubjects.map((subject) => {
                      const value = gradesMap[gradeKey(student.id, subject.id)] ?? "";
                      return (
                        <TableCell key={subject.id}>
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              className="h-8 w-20 text-center text-xs"
                              value={value}
                              onChange={(e) => updateGrade(student.id, subject.id, e.target.value)}
                            />
                            <span className={`text-[10px] ${Number(value) >= 75 ? "text-emerald-600" : Number(value) > 0 ? "text-red-600" : "text-slate-400"}`}>
                              {gradeRemark(value) || "No grade"}
                            </span>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Export Form 138 PDF"
                          onClick={() => downloadForm138(student.id, "pdf")}
                          isLoading={downloadingReport === `${student.id}-pdf`}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Export Form 138 Excel"
                          onClick={() => downloadForm138(student.id, "excel")}
                          isLoading={downloadingReport === `${student.id}-excel`}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

Grading.layout = (page) => <AppLayout currentPageName="Grading">{page}</AppLayout>;
