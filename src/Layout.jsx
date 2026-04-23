import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard, UserPlus, Users, ClipboardCheck, BookOpen,
  FileText, HeartPulse, Calendar, Menu, Bell, LogOut,
  GraduationCap, ChevronDown, ChevronRight, BarChart3,
  AlertTriangle, Settings, Shield, Clock, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchoolSettings } from "@/lib/SchoolSettingsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const NAV_ADMIN = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "School Year", icon: Calendar, page: "SchoolYears" },
  {
    name: "Enrollment", icon: UserPlus, children: [
      { name: "Students", page: "Students" },
      { name: "Sections", page: "Sections" },
      { name: "Subjects", page: "Subjects" },
    ]
  },
  { name: "Attendance", icon: ClipboardCheck, page: "Attendance" },
  { name: "Grading", icon: BookOpen, page: "Grading" },
  { name: "Scheduling", icon: Clock, page: "Scheduling" },
  { name: "Health Records", icon: HeartPulse, page: "HealthRecords" },
  { name: "Violations", icon: AlertTriangle, page: "Violations" },
  { name: "Form 137", icon: FileText, page: "Form137" },
  { name: "Analytics", icon: BarChart3, page: "Analytics" },
  { name: "User Management", icon: Users, page: "UserManagement" },
  { name: "Settings", icon: Settings, page: "AdminSettings" },
];

const NAV_FACULTY = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "My Classes", icon: BookOpen, page: "Grading" },
  { name: "Attendance", icon: ClipboardCheck, page: "Attendance" },
  { name: "My Schedule", icon: Clock, page: "Scheduling" },
  { name: "Health Records", icon: HeartPulse, page: "HealthRecords" },
  { name: "Violations", icon: AlertTriangle, page: "Violations" },
];

const NAV_PARENT = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Parent Portal", icon: User, page: "ParentPortal" },
];

const ROLE_NAV = { admin: NAV_ADMIN, faculty: NAV_FACULTY, parent: NAV_PARENT };
const ROLE_COLORS = { admin: "bg-blue-500", faculty: "bg-emerald-500", parent: "bg-amber-500" };

export default function Layout({ children, currentPageName }) {
  const { user, logout, isLoadingAuth } = useAuth();
  const { settings: schoolSettings } = useSchoolSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState(["Enrollment"]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = ROLE_NAV[user.role] || NAV_FACULTY;
  const isActive = (page) => currentPageName === page;

  const toggleExpand = (name) => {
    setExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="ltr">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 text-white flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )} style={{ backgroundColor: schoolSettings.themeColor }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 overflow-hidden">
              {schoolSettings.logoUrl
                ? <img src={schoolSettings.logoUrl} alt="logo" className="w-full h-full object-contain p-0.5" />
                : <GraduationCap className="w-6 h-6 text-[#1e3a5f]" />
              }
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">TALAIS</h1>
              <p className="text-[11px] text-white/50 leading-tight">Musuan Integrated School</p>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", ROLE_COLORS[user.role])} />
            <span className="text-xs text-white/60 capitalize">{user.role === 'admin' ? 'Administrator' : user.role}</span>
          </div>
        </div>

        {/* Nav */}
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
                          to={createPageUrl(child.page)}
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
                  to={createPageUrl(item.page)}
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
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
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{user.name?.[0]}</span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-slate-700 leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Change Password</DropdownMenuItem>
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