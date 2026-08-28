export interface Folder {
  id: string;
  name: string;
  spaceId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    children: number;
    files: number;
  };
}
