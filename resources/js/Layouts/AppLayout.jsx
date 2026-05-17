import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard, Users, ClipboardCheck, BookOpen,
  FileText, HeartPulse, Calendar, Menu, Bell, LogOut,
  GraduationCap, ChevronDown, ChevronRight, BarChart3,
  AlertTriangle, Settings, Clock, User, Files, Database, Activity, UserPlus,
  LayoutGrid,
  Award,
  AlertTriangle, Settings, Clock, User, Files, Database, Activity, UserPlus,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";
import { useSchoolSettings } from "@/lib/SchoolSettingsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { http } from "@/lib/api";

const NAV_ADMIN = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "User Management", icon: Users, page: "UserManagement" },
  { name: "Qualifying exam", icon: Award, page: "QualifyingExam" },
  { name: "School Year Settings", icon: Calendar, page: "SchoolYears" },
  { name: "Logs", icon: Activity, page: "Logs" },
  { name: "Database Backup", icon: Database, page: "DatabaseBackup" },
  { name: "System Management", icon: Settings, page: "AdminSettings" },
];

const NAV_FACULTY = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Grading", icon: BookOpen, page: "Grading" },
  { name: "Attendance", icon: ClipboardCheck, page: "Attendance" },
  { name: "My Schedule", icon: Clock, page: "Scheduling" },
  { name: "Feeding Program", icon: HeartPulse, page: "HealthRecords" },
  { name: "Violations", icon: AlertTriangle, page: "Violations" },
];

const NAV_PARENT = [
  { name: "Home", icon: LayoutDashboard, page: "ParentHome" },
  { name: "Enrollment", icon: UserPlus, page: "ParentEnrollment" },
];

const NAV_SCHOOL_ADMIN = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  {
    name: "Enrollment", icon: UserPlus, children: [
      { name: "Students", page: "Students" },
      { name: "Teachers", page: "FacultyManagement" },
      { name: "Sections", page: "Sections" },
      { name: "Subjects", page: "Subjects" },
      { name: "Departments", page: "Departments" },
      { name: "Enroll students", page: "Enrollment" },
      { name: "Qualifying exam", page: "QualifyingExam" },
    ]
  },
  { name: "Scheduling", icon: Clock, page: "Scheduling" },
  { name: "Violations", icon: AlertTriangle, page: "Violations" },
  { name: "Form 137", icon: FileText, page: "Form137" },
  { name: "Reports (PDF/Excel)", icon: Files, page: "Reports" },
  { name: "Analytics", icon: BarChart3, page: "Analytics" },
];

const NAV_FACULTY_HEAD_EXTRA = [
  { name: "Section assignment", icon: LayoutGrid, page: "SectionAssignment" },
  { name: "Form 137", icon: FileText, page: "Form137" },
  { name: "Reports (PDF/Excel)", icon: Files, page: "Reports" },
  { name: "Analytics", icon: BarChart3, page: "Analytics" },
];

const ROLE_NAV = {
  admin: NAV_ADMIN,
  school_admin: NAV_SCHOOL_ADMIN,
  faculty: NAV_FACULTY,
  parent: NAV_PARENT,
};
const ROLE_COLORS = {
  admin: "bg-blue-500",
  school_admin: "bg-violet-500",
  faculty: "bg-emerald-500",
  parent: "bg-amber-500",
};

export default function AppLayout({ children, currentPageName }) {
  const { user, logout, isLoadingAuth, unreadCount, recentNotifications } = useAuth();
  const { settings: schoolSettings } = useSchoolSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState(["Enrollment"]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--theme-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  let navItems = ROLE_NAV[user.role] || NAV_FACULTY;
  if (user.role === "faculty" && user.is_grade_level_head) {
    navItems = [...NAV_FACULTY, ...NAV_FACULTY_HEAD_EXTRA];
  }

  const isActive = (page) => currentPageName === page;

  const toggleExpand = (name) => {
    setExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleLogout = () => {
    logout();
  };

  const markAllRead = async () => {
    try {
      await http.post('/notifications/read-all');
      router.reload({ only: ['auth'] });
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await http.post(`/notifications/${id}/read`);
      router.reload({ only: ['auth'] });
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="ltr">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 text-white flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )} style={{ backgroundColor: schoolSettings.themeColor }}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 overflow-hidden">
              {schoolSettings.logoUrl
                ? <img src={schoolSettings.logoUrl} alt="logo" className="w-full h-full object-contain p-0.5" />
                : <GraduationCap className="w-6 h-6 text-[var(--theme-primary)]" />
              }
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">TALAIS</h1>
              <p className="text-[11px] text-white/50 leading-tight">Musuan Integrated School</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", ROLE_COLORS[user.role] ?? ROLE_COLORS.faculty)} />
              <span className="text-xs text-white/60">{ROLE_LABELS[user.role] ?? user.role}</span>
            </div>
            {user.role === "faculty" && user.is_grade_level_head && user.grade_level_head_label && (
              <p className="text-[10px] text-cyan-200/90 pl-4">
                Grade level head · {user.grade_level_head_label}
              </p>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(item => (
            <div key={item.name}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {expanded.includes(item.name) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expanded.includes(item.name) && (
                    <div className="ml-9 space-y-0.5 mt-0.5">
                      {item.children.map(child => (
                        <Link
                          key={child.page}
                          href={createPageUrl(child.page)}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-sm transition-all",
                            isActive(child.page)
                              ? "bg-amber-400/20 text-amber-300 font-semibold"
                              : "text-white/50 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive(item.page)
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {isActive(item.page) && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[10px] text-white/25 text-center">DepEd Philippines • TALAIS v1.0</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-800 leading-tight">{currentPageName?.replace(/([A-Z])/g, ' $1').trim()}</h2>
                <p className="text-xs text-slate-400">Musuan Integrated School • S.Y. 2025–2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <Bell className="w-4 h-4 text-slate-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 text-[9px] leading-3.5 font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1">
                    <DropdownMenuLabel className="px-1">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[11px] text-[var(--theme-primary)] hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {(!recentNotifications || recentNotifications.length === 0) && (
                    <div className="px-3 py-6 text-center text-xs text-slate-400">
                      You&apos;re all caught up.
                    </div>
                  )}
                  {recentNotifications?.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => !n.read_at && markOneRead(n.id)}
                      className={cn(
                        'flex flex-col items-start gap-0.5 cursor-pointer',
                        !n.read_at && 'bg-blue-50/50',
                      )}
                    >
                      <p className="text-xs font-medium text-slate-700 truncate w-full">
                        {n.message ?? n.type}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[var(--theme-primary)] flex items-center justify-center overflow-hidden">
                      {user.avatar
                        ? <img src={user.avatar} alt={user.name ?? "Profile"} className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-white">{user.name?.[0]}</span>}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-slate-700 leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-400">{ROLE_LABELS[user.role] ?? user.role}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Change Password</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
