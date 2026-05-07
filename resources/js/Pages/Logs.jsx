import AppLayout from '@/Layouts/AppLayout';
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Activity, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../components/shared/PageHeader";

export default function Logs() {
  const [search, setSearch] = useState("");

  const { data: authLogs = [], isLoading: loadingAuth } = useQuery({
    queryKey: ["logs-auth", search],
    queryFn: async () => {
      const { data } = await http.get("/system-logs/auth", { params: { search, limit: 120 } });
      return data?.data ?? [];
    },
  });

  const { data: accessLogs = [], isLoading: loadingAccess } = useQuery({
    queryKey: ["logs-access", search],
    queryFn: async () => {
      const { data } = await http.get("/system-logs/access", { params: { search, limit: 120 } });
      return data?.data ?? [];
    },
  });

  const { data: transactionLogs = [], isLoading: loadingTx } = useQuery({
    queryKey: ["logs-transactions", search],
    queryFn: async () => {
      const { data } = await http.get("/audit-logs", { params: { search, limit: 150 } });
      return data?.data ?? [];
    },
  });

  const { data: errorLogs = [], isLoading: loadingErrors } = useQuery({
    queryKey: ["logs-errors", search],
    queryFn: async () => {
      const { data } = await http.get("/system-logs/errors", { params: { search, lines: 150 } });
      return data?.data ?? [];
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Logs"
        description="Authentication, transaction, error, and access logs"
      />

      <Card className="border-0 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by user, message, route, or event"
            className="pl-9"
          />
        </div>
      </Card>

      <Tabs defaultValue="auth">
        <TabsList className="mb-4">
          <TabsTrigger value="auth">Auth Logs</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Logs</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="access">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="auth">
          <LogList
            icon={Shield}
            title="Login/Logout and Authentication Logs"
            logs={authLogs}
            loading={loadingAuth}
            renderMeta={(l) => `${l.causer?.name ?? "System"} • ${l.causer?.role ?? "n/a"}`}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" />Transaction Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTx ? <p className="text-sm text-slate-400">Loading…</p> : transactionLogs.length === 0 ? <p className="text-sm text-slate-400">No entries.</p> : (
                <div className="space-y-3">
                  {transactionLogs.map((log) => {
                    const attrs = log?.properties?.attributes || {};
                    const old = log?.properties?.old || {};
                    const changedKeys = Object.keys(attrs).filter((k) => old[k] !== attrs[k]);
                    return (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{log.event || log.log_name || "event"}</Badge>
                            <span className="text-sm text-slate-700">{log.description}</span>
                          </div>
                          <span className="text-xs text-slate-400">{log.created_at ? format(new Date(log.created_at), "MMM d, yyyy HH:mm") : "—"}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {log.causer?.name ?? "System"} • {log.subject_type?.split("\\").pop() || "Record"}#{log.subject_id || "n/a"}
                        </p>
                        {changedKeys.length > 0 && (
                          <div className="mt-2 text-xs text-slate-600">
                            {changedKeys.slice(0, 6).map((k) => (
                              <p key={k}>{k}: <span className="text-red-500">{String(old[k] ?? "null")}</span> → <span className="text-emerald-600">{String(attrs[k] ?? "null")}</span></p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Error Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingErrors ? <p className="text-sm text-slate-400">Loading…</p> : errorLogs.length === 0 ? <p className="text-sm text-slate-400">No errors found.</p> : (
                <div className="space-y-2">
                  {errorLogs.map((line, idx) => (
                    <div key={`${line.timestamp}-${idx}`} className="p-3 rounded-xl bg-red-50 border border-red-100">
                      <div className="flex items-center justify-between gap-3">
                        <Badge className="bg-red-100 text-red-700">{line.level || "ERROR"}</Badge>
                        <span className="text-xs text-slate-500">{line.timestamp || "—"}</span>
                      </div>
                      <p className="text-sm text-red-900 mt-1 break-words">{line.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <LogList
            icon={Clock}
            title="Access Logs"
            logs={accessLogs}
            loading={loadingAccess}
            renderMeta={(l) => `${l.causer?.name ?? "System"} • ${l.properties?.method || "GET"} ${l.properties?.url || ""}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LogList({ icon: Icon, title, logs, loading, renderMeta }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><Icon className="w-4 h-4" />{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-slate-400">Loading…</p> : logs.length === 0 ? <p className="text-sm text-slate-400">No entries.</p> : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-700">{l.description || l.message}</p>
                  <span className="text-xs text-slate-400">{l.created_at ? format(new Date(l.created_at), "MMM d, yyyy HH:mm") : "—"}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{renderMeta?.(l)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

Logs.layout = (page) => <AppLayout currentPageName="Logs">{page}</AppLayout>;
