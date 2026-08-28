import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Space } from '@/types/space';
import { useGetFolderAncestorsQuery } from '@/store/spacesApi';

export type ActiveView = 'files' | 'members' | 'settings';

interface NavFolder {
  id: string;
  name: string;
}

interface NavigationContextValue {
  spaceId: string | null;
  folderId: string | undefined;
  folderPath: NavFolder[];
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setSpace: (space: Space) => void;
  enterFolder: (folder: NavFolder) => void;
  navigateTo: (index: number) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [folderPath, setFolderPath] = useState<NavFolder[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('files');

  const spaceId = searchParams.get('spaceId');
  const folderId = searchParams.get('folderId') ?? undefined;

  // Rebuild folderPath from the API when folderId is in the URL but state is empty
  // (happens on page load/refresh with a deep link)
  const needsHydration = !!folderId && folderPath.length === 0;
  const { data: ancestors } = useGetFolderAncestorsQuery(
    { spaceId: spaceId!, folderId: folderId! },
    { skip: !needsHydration || !spaceId },
  );

  useEffect(() => {
    if (ancestors && ancestors.length > 0 && folderPath.length === 0) {
      setFolderPath(ancestors);
    }
  }, [ancestors]);

  const setSpace = useCallback(
    (space: Space) => {
      setFolderPath([]);
      setActiveView('files');
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
    <NavigationContext.Provider
      value={{
        spaceId,
        folderId,
        folderPath,
        activeView,
        setActiveView,
        setSpace,
        enterFolder,
        navigateTo,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
