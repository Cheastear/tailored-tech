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

export interface SpaceMember {
  id: string;
  role: 'OWNER' | 'WRITER' | 'READER';
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

export interface SpaceDetail extends Space {
  members: SpaceMember[];
  totalSize: number;
}
