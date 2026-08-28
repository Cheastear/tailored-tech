import { FilesCard } from '@/components/dashboard/FilesCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SpaceStats } from '@/components/dashboard/SpaceStats';
import { NavigationProvider } from '@/context/NavigationContext';

export function DashboardPage() {
  return (
    <NavigationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <PageHeader />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <SpaceStats />
            <FilesCard />
          </main>
        </div>
      </div>
    </NavigationProvider>
  );
}
