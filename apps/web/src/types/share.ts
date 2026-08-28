export interface Share {
  id: string;
  token: string;
  mode: 'PUBLIC' | 'PERMISSIONED';
  resourceType: 'SPACE' | 'FOLDER' | 'FILE';
  spaceId?: string;
  folderId?: string;
  fileId?: string;
  allowedEmails: string[];
  revokedAt?: string;
  createdAt: string;
  createdBy: { id: string; email: string; name?: string };
}
