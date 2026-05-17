import AppLayout from '@/Layouts/AppLayout';
import React, { useState, useRef } from "react";
import { Settings, Save, School, Shield, Bell, Database, FileText, Activity, Upload, Palette, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { base44 } from "@/lib/api";
import PageHeader from "../components/shared/PageHeader";
import AuditLog from "../components/settings/AuditLog";
import BackupManagement from "../components/settings/BackupManagement";
import DocumentTemplates from "../components/settings/DocumentTemplates";
import { useSchoolSettings } from "@/lib/SchoolSettingsContext";

const THEME_PRESETS = [
  { label: "Navy Blue", color: "#1e3a5f" },
  { label: "Forest Green", color: "#14532d" },
  { label: "Deep Red", color: "#7f1d1d" },
  { label: "Dark Purple", color: "#3b0764" },
  { label: "Slate Gray", color: "#1e293b" },
  { label: "Ocean Teal", color: "#134e4a" },
  { label: "Burgundy", color: "#4a1942" },
  { label: "Midnight", color: "#0f172a" },
];

export default function AdminSettings() {
  const { settings: schoolSettings, updateSettings } = useSchoolSettings();
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateSettings({ logoUrl: file_url });
      toast.success("School logo updated!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to upload school logo.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    updateSettings({ logoUrl: null });
    toast.success("Logo removed");
  };

  const handleThemeColor = (color) => {
    updateSettings({ themeColor: color });
    toast.success("Theme color updated!");
  };

  const [school, setSchool] = useState({
    name: "Musuan Integrated School",
    division: "Division of Bukidnon",
    district: "Maramag District",
    municipality: "Maramag",
    province: "Bukidnon",
    principal: "Dr. Weenkie Jhon A. Marcelo",
    school_id: "300003",
    region: "Region X – Northern Mindanao",
  });


  const [security, setSecurity] = useState({
    account_lockout: true,
    lockout_attempts: 5,
    session_timeout: 30,
    password_min: 8,
  });

  const [notif, setNotif] = useState({
    absence_alert: true,
    grade_submission: true,
    report_card_notif: true,
    backup_alerts: true,
    email_smtp: "smtp.gmail.com",
    smtp_port: "587",
  });

  const handleSave = (section) => toast.success(`${section} settings saved!`);

  return (
    <div>
      <PageHeader title="System Settings" description="Configure TALAIS system settings and preferences" />

      <Tabs defaultValue="school">
        <TabsList className="mb-5 flex-wrap h-auto gap-1">
          <TabsTrigger value="school"><School className="w-3.5 h-3.5 mr-1" />School Info</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-3.5 h-3.5 mr-1" />Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-3.5 h-3.5 mr-1" />Notifications</TabsTrigger>
          <TabsTrigger value="backup"><Database className="w-3.5 h-3.5 mr-1" />Backup</TabsTrigger>
          <TabsTrigger value="audit"><Activity className="w-3.5 h-3.5 mr-1" />Audit Log</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="w-3.5 h-3.5 mr-1" />Templates</TabsTrigger>
        </TabsList>

        {/* School Settings */}
        <TabsContent value="school">
          <div className="space-y-5">
            {/* Logo Upload */}
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Upload className="w-4 h-4" />School Logo</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Preview */}
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                    {schoolSettings.logoUrl
                      ? <img src={schoolSettings.logoUrl} alt="School logo" className="w-full h-full object-contain p-1" />
                      : <span className="text-3xl font-black text-slate-300">S</span>
                    }
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Upload your school's official logo. It will appear in the sidebar and printed documents.</p>
                    <p className="text-xs text-slate-400">Recommended: PNG with transparent background, at least 200×200px</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()} isLoading={uploading} loadingText="Uploading...">
                        <Upload className="w-3.5 h-3.5 mr-1" /> Upload Logo
                      </Button>
                      {schoolSettings.logoUrl && (
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={handleRemoveLogo}>
                          <X className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Color */}
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" />System Theme Color</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">Choose the primary color used throughout the system (sidebar, buttons, accents).</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.color}
                      onClick={() => handleThemeColor(preset.color)}
                      title={preset.label}
                      className={`w-10 h-10 rounded-xl transition-all ring-offset-2 ${schoolSettings.themeColor === preset.color ? "ring-2 ring-slate-800 scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: preset.color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-slate-500">Custom color:</Label>
                  <input
                    type="color"
                    value={schoolSettings.themeColor}
                    onChange={e => handleThemeColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-500">{schoolSettings.themeColor}</span>
                </div>
              </CardContent>
            </Card>

            {/* School Info */}
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-sm">School Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(school).map(([key, val]) => (
                    <div key={key}>
                      <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                      <Input value={val} onChange={e => setSchool({ ...school, [key]: e.target.value })} className="mt-1" />
                    </div>
                  ))}
                </div>
                <Button onClick={() => handleSave("School")} className="mt-5" style={{ backgroundColor: schoolSettings.themeColor }}>
                  <Save className="w-4 h-4 mr-2" /> Save School Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        {/* Security */}
        <TabsContent value="security">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Security Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: "account_lockout", label: "Account Lockout", desc: "Lock after failed attempts" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <Switch checked={security[item.key]} onCheckedChange={v => setSecurity({ ...security, [item.key]: v })} />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Max Failed Attempts</Label>
                  <Input type="number" value={security.lockout_attempts} onChange={e => setSecurity({ ...security, lockout_attempts: e.target.value })} className="mt-1" /></div>
                <div><Label>Session Timeout (min)</Label>
                  <Input type="number" value={security.session_timeout} onChange={e => setSecurity({ ...security, session_timeout: e.target.value })} className="mt-1" /></div>
                <div><Label>Min Password Length</Label>
                  <Input type="number" value={security.password_min} onChange={e => setSecurity({ ...security, password_min: e.target.value })} className="mt-1" /></div>
              </div>
              <Button onClick={() => handleSave("Security")} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
                <Save className="w-4 h-4 mr-2" /> Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Notification Settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: "absence_alert", label: "Absence Threshold Alert", desc: "Alert at 15% and 20% absences" },
                { key: "grade_submission", label: "Grade Submission Reminder", desc: "Notify teachers before deadline" },
                { key: "report_card_notif", label: "Report Card Notification", desc: "Notify parents when cards are ready" },
                { key: "backup_alerts", label: "Backup Status Alerts", desc: "Email on backup success/failure" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <Switch checked={notif[item.key]} onCheckedChange={v => setNotif({ ...notif, [item.key]: v })} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div><Label>SMTP Host</Label><Input value={notif.email_smtp} onChange={e => setNotif({ ...notif, email_smtp: e.target.value })} className="mt-1" /></div>
                <div><Label>SMTP Port</Label><Input value={notif.smtp_port} onChange={e => setNotif({ ...notif, smtp_port: e.target.value })} className="mt-1" /></div>
              </div>
              <Button onClick={() => handleSave("Notification")} className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
                <Save className="w-4 h-4 mr-2" /> Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup */}
        <TabsContent value="backup">
          <BackupManagement />
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit">
          <AuditLog />
        </TabsContent>

        {/* Document Templates */}
        <TabsContent value="templates">
          <DocumentTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}

AdminSettings.layout = (page) => <AppLayout currentPageName="AdminSettings">{page}</AppLayout>;
