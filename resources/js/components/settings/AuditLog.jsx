import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Search } from "lucide-react";
import { format } from "date-fns";

const eventColors = {
    created: "bg-emerald-100 text-emerald-700",
    updated: "bg-blue-100 text-blue-700",
    deleted: "bg-red-100 text-red-700",
};

export default function AuditLog() {
    const [search, setSearch] = useState("");
    const [event, setEvent] = useState("All");

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["audit-logs", { search, event }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (event !== "All") params.append("event", event);
            params.append("limit", "200");
            const { data } = await http.get(`/audit-logs?${params.toString()}`);
            return data?.data ?? [];
        },
    });

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Audit Trail
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search description…"
                            className="pl-9"
                        />
                    </div>
                    <Select value={event} onValueChange={setEvent}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Event" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All events</SelectItem>
                            <SelectItem value="created">Created</SelectItem>
                            <SelectItem value="updated">Updated</SelectItem>
                            <SelectItem value="deleted">Deleted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="border rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {isLoading ? (
                        <div className="p-6 text-sm text-slate-400 text-center">Loading audit log…</div>
                    ) : logs.length === 0 ? (
                        <div className="p-6 text-sm text-slate-400 text-center">No log entries.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-slate-50">
                                <Badge className={eventColors[log.event] ?? "bg-slate-100 text-slate-700"}>
                                    {log.event ?? log.log_name ?? "log"}
                                </Badge>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-700">{log.description}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {log.causer
                                            ? `${log.causer.name} • ${log.causer.role ?? "user"}`
                                            : "System"}
                                        {log.subject_type
                                            ? ` • ${log.subject_type.split("\\").pop()}#${log.subject_id}`
                                            : ""}
                                    </p>
                                </div>
                                <div className="text-xs text-slate-400 whitespace-nowrap">
                                    {log.created_at &&
                                        format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
