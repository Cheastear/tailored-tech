import { Files, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ActiveView, useNavigation } from '@/context/NavigationContext';

const NAV_ITEMS: { label: string; view: ActiveView; icon: React.ElementType }[] = [
  { label: 'Files', view: 'files', icon: Files },
  { label: 'Members', view: 'members', icon: Users },
  { label: 'Settings', view: 'settings', icon: Settings },
];

export function SidebarNav() {
  const { activeView, setActiveView } = useNavigation();

  return (
    <nav className="space-y-0.5 px-2">
      {NAV_ITEMS.map(({ label, view, icon: Icon }) => (
        <button
          key={view}
          onClick={() => setActiveView(view)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
            activeView === view
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  );
}
