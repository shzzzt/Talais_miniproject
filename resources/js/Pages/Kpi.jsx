import AppLayout from '@/Layouts/AppLayout';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http, base44 } from '@/lib/api';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';

export default function Kpi() {
  const queryClient = useQueryClient();

  const { data: kpis = [], isLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => base44.entities.Kpi.list('-computed_at'),
  });

  const computeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await http.post('/kpis/compute');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpis'] }),
  });

  return (
    <div>
      <PageHeader
        title="Key Performance Indicators"
        description="DepEd-aligned KPIs computed from current academic data"
        action={
          <Button
            onClick={() => computeMutation.mutate()}
            disabled={computeMutation.isPending}
            className="bg-[#1e3a5f] hover:bg-[#2c5282]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${computeMutation.isPending ? 'animate-spin' : ''}`} />
            {computeMutation.isPending ? 'Computing...' : 'Recompute KPIs'}
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-8 text-sm text-slate-400">Loading...</div>
      ) : kpis.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No KPIs computed" description="Press 'Recompute KPIs' to generate current values" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {kpis.slice(0, 4).map(k => (
              <Card key={k.id} className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500 uppercase">{k.indicator_name}</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800">{Number(k.value).toFixed(2)}{k.indicator_name?.toLowerCase().includes('rate') ? '%' : ''}</div>
                  <div className="text-xs text-slate-400 mt-1">{k.school_year || '—'}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Indicator</TableHead>
                  <TableHead className="text-xs">Value</TableHead>
                  <TableHead className="text-xs">Formula</TableHead>
                  <TableHead className="text-xs">School Year</TableHead>
                  <TableHead className="text-xs">Computed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="text-sm font-medium">{k.indicator_name}</TableCell>
                    <TableCell className="text-sm font-bold">{Number(k.value).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-md">{k.formula_used}</TableCell>
                    <TableCell className="text-sm">{k.school_year || '—'}</TableCell>
                    <TableCell className="text-xs text-slate-400">{k.computed_at ? new Date(k.computed_at).toLocaleString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

Kpi.layout = (page) => <AppLayout currentPageName="Kpi">{page}</AppLayout>;
