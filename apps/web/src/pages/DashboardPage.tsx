import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentArea } from '@/components/dashboard/ContentArea';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { NavigationProvider } from '@/context/NavigationContext';

const STATS = [
  { label: 'Total files', value: '—' },
  { label: 'Storage used', value: '—' },
  { label: 'Members', value: '—' },
];

export function DashboardPage() {
  return (
    <NavigationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <PageHeader />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {STATS.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} />
              ))}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Files</CardTitle>
              </CardHeader>
              <CardContent>
                <ContentArea />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </NavigationProvider>
  );
}
