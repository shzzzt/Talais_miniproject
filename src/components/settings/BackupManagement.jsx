import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Download, RefreshCw, Clock, Mail, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const INITIAL_LOGS = [
  { id: 1, date: "2026-04-23 02:00", type: "Scheduled", status: "success", size: "47.8 MB", duration: "1m 12s" },
  { id: 2, date: "2026-04-22 02:00", type: "Scheduled", status: "success", size: "47.1 MB", duration: "1m 08s" },
  { id: 3, date: "2026-04-21 14:30", type: "Manual", status: "success", size: "46.9 MB", duration: "1m 05s" },
  { id: 4, date: "2026-04-20 02:00", type: "Scheduled", status: "failed", size: "—", duration: "—" },
  { id: 5, date: "2026-04-19 02:00", type: "Scheduled", status: "success", size: "45.4 MB", duration: "1m 02s" },
  { id: 6, date: "2026-04-18 02:00", type: "Scheduled", status: "success", size: "45.0 MB", duration: "58s" },
  { id: 7, date: "2026-04-17 09:00", type: "Manual", status: "success", size: "44.6 MB", duration: "55s" },
];

export default function BackupManagement() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [isRunning, setIsRunning] = useState(false);
  const [schedule, setSchedule] = useState({ enabled: true, frequency: "daily", time: "02:00", email: "admin@musuan.edu.ph", retention: "30" });

  const runBackup = () => {
    setIsRunning(true);
    setTimeout(() => {
      const newLog = {
        id: Date.now(),
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
        type: "Manual",
        status: "success",
        size: "48.2 MB",
        duration: "1m 15s",
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRunning(false);
      toast.success("Backup completed successfully! Email notification sent.");
    }, 2500);
  };

  const successCount = logs.filter(l => l.status === "success").length;
  const failedCount = logs.filter(l => l.status === "failed").length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div><p className="text-xl font-bold text-slate-800">{successCount}</p><p className="text-xs text-slate-400">Successful</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <div><p className="text-xl font-bold text-slate-800">{failedCount}</p><p className="text-xs text-slate-400">Failed</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-400" />
            <div><p className="text-xl font-bold text-slate-800">{schedule.retention}</p><p className="text-xs text-slate-400">Day Retention</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Manual Backup */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4" /> Manual Backup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500">Create an immediate backup of the entire database including student records, grades, and attendance.</p>
            <Button onClick={runBackup} disabled={isRunning} className="w-full bg-[#1e3a5f] hover:bg-[#2c5282]">
              {isRunning ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running Backup...</> : <><Database className="w-4 h-4 mr-2" /> Run Manual Backup</>}
            </Button>
            {logs[0]?.type === "Manual" && (
              <div className="p-3 bg-green-50 rounded-lg text-xs text-green-700">
                Last manual backup: {logs[0].date} ({logs[0].size})
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Config */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Scheduled Backup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Scheduled Backups</Label>
              <Switch checked={schedule.enabled} onCheckedChange={v => setSchedule({ ...schedule, enabled: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Frequency</Label>
                <Select value={schedule.frequency} onValueChange={v => setSchedule({ ...schedule, frequency: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Run at</Label>
                <Input type="time" className="mt-1" value={schedule.time} onChange={e => setSchedule({ ...schedule, time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Notification Email</Label>
              <Input className="mt-1" value={schedule.email} onChange={e => setSchedule({ ...schedule, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Retention Period (days)</Label>
              <Input type="number" className="mt-1" value={schedule.retention} onChange={e => setSchedule({ ...schedule, retention: e.target.value })} />
            </div>
            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2c5282]" onClick={() => toast.success("Backup schedule saved!")}>Save Schedule</Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup Log */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Backup History (Last 30 Days)</CardTitle>
          <Button size="sm" variant="outline" onClick={() => {
            const csv = "Date,Type,Status,Size,Duration\n" + logs.map(l => `"${l.date}","${l.type}","${l.status}","${l.size}","${l.duration}"`).join("\n");
            const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "backup_log.csv"; a.click();
          }}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>{["Date & Time", "Type", "Status", "Size", "Duration"].map(h => <th key={h} className="text-left text-xs px-4 py-3 text-slate-500 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs text-slate-500">{log.date}</td>
                    <td className="px-4 py-2.5"><Badge variant="secondary" className="text-xs">{log.type}</Badge></td>
                    <td className="px-4 py-2.5">
                      <Badge className={`text-xs ${log.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{log.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs">{log.size}</td>
                    <td className="px-4 py-2.5 text-xs">{log.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}