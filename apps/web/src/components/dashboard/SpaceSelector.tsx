import { useState } from 'react';
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
import { CreateSpaceDialog } from './CreateSpaceDialog';

function SpaceAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
      {name[0].toUpperCase()}
    </div>
  );
}

export function SpaceSelector() {
  const { data: spaces = [], isLoading } = useGetSpacesQuery();
  const { spaceId, setSpace } = useNavigation();
  const [createOpen, setCreateOpen] = useState(false);

  const activeSpace: Space | undefined = spaces.find((s) => s.id === spaceId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading spaces…
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus:outline-none">
          {activeSpace ? (
            <>
              <SpaceAvatar name={activeSpace.name} />
              <span className="flex-1 truncate text-left font-medium">{activeSpace.name}</span>
            </>
          ) : (
            <>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-dashed border-muted-foreground/40" />
              <span className="flex-1 truncate text-left text-muted-foreground">
                {spaces.length === 0 ? 'No spaces yet' : 'Select a space'}
              </span>
            </>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="start">
          {spaces.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Spaces
              </DropdownMenuLabel>
              {spaces.map((space) => (
                <DropdownMenuItem key={space.id} onSelect={() => setSpace(space)} className="gap-2">
                  <SpaceAvatar name={space.name} />
                  <span className="flex-1 truncate">{space.name}</span>
                  {activeSpace?.id === space.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            className="gap-2 text-muted-foreground"
            onSelect={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New space
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateSpaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
