import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http, base44 } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Download, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function BackupManagement() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["backup-logs"],
    queryFn: () => base44.entities.BackupLog.list(),
  });

  const runMutation = useMutation({
    mutationFn: async (type = "database") => {
      const { data } = await http.post("/backup-logs/run", { type });
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["backup-logs"] });
      if (res?.data?.status === "success") toast.success("Backup completed successfully");
      else toast.error("Backup failed: " + (res?.error || res?.data?.notes || "unknown error"));
    },
    onError: (e) => toast.error(e?.response?.data?.error || e.message || "Backup failed"),
  });

  const successCount = logs.filter(l => l.status === "success").length;
  const failedCount = logs.filter(l => l.status === "failed").length;

  const exportCsv = () => {
    const rows = [["Date", "Type", "Triggered By", "Status", "Size (MB)", "File"]];
    logs.forEach(l => rows.push([
      l.created_at || "",
      l.backup_type || "",
      l.triggered_by || "",
      l.status || "",
      l.file_size_mb ?? "",
      l.file_path ?? "",
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "backup_log.csv";
    a.click();
  };

  return (
    <div className="space-y-5">
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
            <div><p className="text-xl font-bold text-slate-800">{logs.length}</p><p className="text-xs text-slate-400">Total Backups</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4" /> Manual Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">
            Triggers a `pg_dump` of the active PostgreSQL database via spatie/laravel-backup. The resulting zip is stored on the configured filesystem.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runMutation.mutate("database")} disabled={runMutation.isPending} className="bg-[#1e3a5f] hover:bg-[#2c5282]">
              {runMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running...</> : <><Database className="w-4 h-4 mr-2" /> DB Only</>}
            </Button>
            <Button variant="outline" onClick={() => runMutation.mutate("full")} disabled={runMutation.isPending}>
              Full (Files + DB)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Backup History</CardTitle>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-slate-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No backups yet. Press "Run" to trigger one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>{["Date & Time", "Type", "Triggered By", "Status", "Size", "File"].map(h => (
                    <th key={h} className="text-left text-xs px-4 py-3 text-slate-500 font-semibold">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs text-slate-500">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2.5"><Badge variant="secondary" className="text-xs">{log.backup_type}</Badge></td>
                      <td className="px-4 py-2.5"><Badge variant="secondary" className="text-xs">{log.triggered_by}</Badge></td>
                      <td className="px-4 py-2.5">
                        <Badge className={`text-xs ${log.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{log.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs">{log.file_size_mb !== null ? `${log.file_size_mb} MB` : '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[300px] truncate">{log.file_path || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
