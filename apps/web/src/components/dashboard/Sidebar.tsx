import { FolderOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SidebarNav } from './SidebarNav';
import { SpaceSelector } from './SpaceSelector';
import { UserFooter } from './UserFooter';

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <FolderOpen className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold">DataRoom</span>
      </div>

      <div className="px-2 pb-2">
        <SpaceSelector />
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto py-2">
        <SidebarNav />
      </div>

      <UserFooter />
    </aside>
  );
}
