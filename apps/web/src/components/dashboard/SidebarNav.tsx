import { useState } from 'react';
import { Files, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Files', icon: Files },
  { label: 'Members', icon: Users },
  { label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const [active, setActive] = useState('Files');

  return (
    <nav className="space-y-0.5 px-2">
      {NAV_ITEMS.map(({ label, icon: Icon }) => (
        <button
          key={label}
          onClick={() => setActive(label)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
            active === label
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
