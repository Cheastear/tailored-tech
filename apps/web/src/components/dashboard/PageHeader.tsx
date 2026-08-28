import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useNavigation } from '@/context/NavigationContext';
import { useGetSpacesQuery } from '@/store/spacesApi';

export function PageHeader() {
  const { spaceId, folderPath, navigateTo, activeView, setActiveView } = useNavigation();
  const { data: spaces = [] } = useGetSpacesQuery();

  const spaceName = spaces.find((s) => s.id === spaceId)?.name ?? '…';

  // Space name is a link (not a page) whenever there's somewhere to go back to:
  // - inside a folder in files view
  // - on members or settings view
  const spaceNameIsLink =
    (activeView === 'files' && folderPath.length > 0) || activeView !== 'files';

  const handleSpaceClick = () => {
    if (activeView !== 'files') {
      setActiveView('files');
    } else {
      navigateTo(-1);
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center border-b bg-background px-6">
      <Breadcrumb>
        <BreadcrumbList>
          {!spaceId ? (
            <BreadcrumbItem>
              <BreadcrumbPage>Spaces</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            <>
              <BreadcrumbItem>
                {spaceNameIsLink ? (
                  <BreadcrumbLink className="cursor-pointer" onClick={handleSpaceClick}>
                    {spaceName}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{spaceName}</BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {/* Folder path — only in files view */}
              {activeView === 'files' &&
                folderPath.map((folder, index) => {
                  const isLast = index === folderPath.length - 1;
                  return (
                    <Fragment key={folder.id}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            className="cursor-pointer"
                            onClick={() => navigateTo(index)}
                          >
                            {folder.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  );
                })}

              {/* Members / Settings suffix */}
              {activeView !== 'files' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize">{activeView}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
