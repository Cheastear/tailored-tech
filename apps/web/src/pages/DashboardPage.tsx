import { useEffect } from 'react';
import { FilesCard } from '@/components/dashboard/FilesCard';
import { MembersView } from '@/components/dashboard/MembersView';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { SettingsView } from '@/components/dashboard/SettingsView';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SpacePickerView } from '@/components/dashboard/SpacePickerView';
import { SpaceStats } from '@/components/dashboard/SpaceStats';
import { useNavigation } from '@/context/NavigationContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { useSpaceSync } from '@/hooks/useSpaceSync';
import { useUserSync } from '@/hooks/useUserSync';
import { useGetSpacesQuery } from '@/store/spacesApi';

function DashboardContent() {
  const { spaceId, activeView, clearSpace } = useNavigation();
  const { data: spaces } = useGetSpacesQuery();

  useSpaceSync(spaceId);
  useUserSync();

  // If the current space is no longer accessible (e.g. user was removed),
  // navigate back to the space picker.
  useEffect(() => {
    if (!spaceId || !spaces) return;
    if (!spaces.find((s) => s.id === spaceId)) {
      clearSpace();
    }
  }, [spaces, spaceId, clearSpace]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {!spaceId ? (
            <SpacePickerView />
          ) : (
            <>
              {activeView === 'files' && (
                <>
                  <SpaceStats />
                  <FilesCard />
                </>
              )}
              {activeView === 'members' && <MembersView />}
              {activeView === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <NavigationProvider>
      <DashboardContent />
    </NavigationProvider>
  );
}
