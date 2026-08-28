export interface Space {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    files: number;
    folders: number;
  };
}
