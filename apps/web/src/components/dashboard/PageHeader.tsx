import { Fragment, useState } from 'react';
import { Filter, Upload } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigation } from '@/context/NavigationContext';
import { useGetSpacesQuery } from '@/store/spacesApi';
import { UploadModal } from './UploadModal';

export function PageHeader() {
  const { spaceId, folderPath, navigateTo, activeView } = useNavigation();
  const { data: spaces = [] } = useGetSpacesQuery();
  const [uploadOpen, setUploadOpen] = useState(false);

  const spaceName = spaces.find((s) => s.id === spaceId)?.name ?? '…';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {activeView === 'files' && folderPath.length === 0 ? (
              <BreadcrumbPage>{spaceName}</BreadcrumbPage>
            ) : activeView === 'files' ? (
              <BreadcrumbLink className="cursor-pointer" onClick={() => navigateTo(-1)}>
                {spaceName}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{spaceName}</BreadcrumbPage>
            )}
          </BreadcrumbItem>

          {activeView === 'files' && folderPath.map((folder, index) => {
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

          {activeView !== 'files' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize">{activeView}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {activeView === 'files' && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!spaceId}
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      )}

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </header>
  );
}
