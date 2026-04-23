import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Users, UserPlus, ClipboardCheck, BookOpen, HeartPulse,
  TrendingUp, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatCard from "../components/shared/StatCard";

export default function Dashboard() {
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: () => base44.entities.Section.list(),
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ["healthRecords"],
    queryFn: () => base44.entities.HealthRecord.list(),
  });

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["schoolYears"],
    queryFn: () => base44.entities.SchoolYear.list(),
  });

  const activeYear = schoolYears.find(sy => sy.is_active);
  const enrolled = students.filter(s => s.status === "enrolled").length;
  const transferred = students.filter(s => s.status === "transferred_out").length;
  const dropped = students.filter(s => s.status === "dropped").length;
  const feedingProgram = healthRecords.filter(h => h.feeding_program).length;

  // Unique parents count
  const uniqueParents = new Set(students.filter(s => s.parent_name).map(s => s.parent_name.trim().toLowerCase())).size;

  // Grade level distribution
  const gradeLevels = {};
  students.filter(s => s.status === "enrolled").forEach(s => {
    gradeLevels[s.current_grade_level] = (gradeLevels[s.current_grade_level] || 0) + 1;
  });

  const gradeOrder = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"];

  return (
    <div className="space-y-6">
      {/* Active School Year Banner */}
      {activeYear && (
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Active School Year</p>
              <h2 className="text-2xl font-bold mt-1">{activeYear.name}</h2>
              <p className="text-white/60 text-sm mt-1">Musuan Integrated School</p>
            </div>
            <Badge className="bg-amber-400 text-[#1e3a5f] hover:bg-amber-300 font-semibold">
              {activeYear.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enrolled" value={enrolled} icon={Users} color="blue" subtitle="Active students" />
        <StatCard title="Sections" value={sections.length} icon={UserPlus} color="green" subtitle="All grade levels" />
        <StatCard title="PTA Parents" value={uniqueParents} icon={Users} color="purple" subtitle="Unique parents" />
        <StatCard title="Feeding Program" value={feedingProgram} icon={HeartPulse} color="amber" subtitle="Flagged students" />
      </div>

      {/* Content Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment by Grade Level */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Enrollment by Grade Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradeOrder.map(grade => {
                const count = gradeLevels[grade] || 0;
                const max = Math.max(...Object.values(gradeLevels), 1);
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16 shrink-0">{grade.replace("Grade ", "Gr. ")}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] rounded-full flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${Math.max((count / max) * 100, count > 0 ? 10 : 0)}%` }}
                      >
                        {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Student Tracing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-600">Currently Enrolled</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{enrolled}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm text-slate-600">Transferred Out</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{transferred}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-slate-600">Dropped</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{dropped}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <HeartPulse className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-600">In Feeding Program</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{feedingProgram}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}