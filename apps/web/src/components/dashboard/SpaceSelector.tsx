import { Check, ChevronDown, Loader2, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigation } from '@/context/NavigationContext';
import { useGetSpacesQuery } from '@/store/spacesApi';
import type { Space } from '@/types/space';

function SpaceAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
      {name[0]}
    </div>
  );
}

export function SpaceSelector() {
  const { data: spaces = [], isLoading } = useGetSpacesQuery();
  const { spaceId, setSpace } = useNavigation();

  const activeSpace: Space | undefined =
    spaces.find((s) => s.id === spaceId) ?? spaces[0];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading spaces…
      </div>
    );
  }

  if (!activeSpace) {
    return (
      <div className="px-2 py-1.5 text-sm text-muted-foreground">No spaces yet</div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus:outline-none">
        <SpaceAvatar name={activeSpace.name} />
        <span className="flex-1 truncate text-left font-medium">{activeSpace.name}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Spaces</DropdownMenuLabel>

        {spaces.map((space) => (
          <DropdownMenuItem key={space.id} onSelect={() => setSpace(space)} className="gap-2">
            <SpaceAvatar name={space.name} />
            <span className="flex-1 truncate">{space.name}</span>
            {activeSpace.id === space.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem className="gap-2 text-muted-foreground">
          <Plus className="h-4 w-4" />
          New space
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
