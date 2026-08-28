import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Space } from '@/types/space';

interface NavFolder {
  id: string;
  name: string;
}

interface NavigationContextValue {
  spaceId: string | null;
  folderId: string | undefined;
  folderPath: NavFolder[];
  setSpace: (space: Space) => void;
  enterFolder: (folder: NavFolder) => void;
  navigateTo: (index: number) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [folderPath, setFolderPath] = useState<NavFolder[]>([]);

  const spaceId = searchParams.get('spaceId');
  const folderId = searchParams.get('folderId') ?? undefined;

  const setSpace = useCallback(
    (space: Space) => {
      setFolderPath([]);
      setSearchParams({ spaceId: space.id });
    },
    [setSearchParams],
  );

  const enterFolder = useCallback(
    (folder: NavFolder) => {
      setFolderPath((prev) => [...prev, folder]);
      setSearchParams({ spaceId: spaceId!, folderId: folder.id });
    },
    [spaceId, setSearchParams],
  );

  const navigateTo = useCallback(
    (index: number) => {
      if (index === -1) {
        setFolderPath([]);
        setSearchParams({ spaceId: spaceId! });
      } else {
        const newPath = folderPath.slice(0, index + 1);
        setFolderPath(newPath);
        setSearchParams({ spaceId: spaceId!, folderId: newPath[newPath.length - 1].id });
      }
    },
    [spaceId, folderPath, setSearchParams],
  );

  return (
    <NavigationContext.Provider value={{ spaceId, folderId, folderPath, setSpace, enterFolder, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
