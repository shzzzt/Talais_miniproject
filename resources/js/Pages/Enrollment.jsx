import AppLayout from '@/Layouts/AppLayout';
import React from "react";
import { Link } from "@inertiajs/react";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/api";
import { Users, BookOpen, Layers, UserPlus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "../components/shared/StatCard";
import PageHeader from "../components/shared/PageHeader";

export default function Enrollment() {
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: sections = [] } = useQuery({ queryKey: ["sections"], queryFn: () => base44.entities.Section.list() });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => base44.entities.Subject.list() });

  const enrolled = students.filter(s => s.status === "enrolled").length;
  const uniqueParents = new Set(students.filter(s => s.parent_name).map(s => s.parent_name.trim().toLowerCase())).size;

  const links = [
    { title: "Students", description: "Manage student enrollment, records & SF1", icon: Users, page: "Students", count: students.length },
    { title: "Sections", description: "Organize class sections per grade level", icon: Layers, page: "Sections", count: sections.length },
    { title: "Subjects", description: "Subject offerings and teacher assignments", icon: BookOpen, page: "Subjects", count: subjects.length },
  ];

  return (
    <div>
      <PageHeader title="Enrollment" description="Manage student enrollment, sections, and subjects" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Enrolled" value={enrolled} icon={Users} color="blue" />
        <StatCard title="Total Students" value={students.length} icon={UserPlus} color="green" />
        <StatCard title="Sections" value={sections.length} icon={Layers} color="purple" />
        <StatCard title="PTA Parents" value={uniqueParents} icon={Users} color="amber" subtitle="Unique count" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {links.map(link => (
          <Link key={link.page} href={createPageUrl(link.page)}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center mb-3">
                    <link.icon className="w-5 h-5 text-[#1e3a5f]" />
                  </div>
                  <h3 className="font-bold text-slate-800">{link.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{link.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-[#1e3a5f]">{link.count}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1e3a5f] group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

Enrollment.layout = (page) => <AppLayout currentPageName="Enrollment">{page}</AppLayout>;
