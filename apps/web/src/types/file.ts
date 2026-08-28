export interface SpaceFile {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  spaceId: string;
  folderId: string | null;
  uploadedById: string;
  uploadedBy: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}
