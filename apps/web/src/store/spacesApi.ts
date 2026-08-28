import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Space, SpaceDetail, SpaceMember } from '@/types/space';
import type { Folder } from '@/types/folder';
import type { SpaceFile } from '@/types/file';

type UploadArgs = {
  spaceId: string;
  folderId?: string;
  files: File[];
  onProgress?: (loaded: number, total: number) => void;
};

const apiBase = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export const spacesApi = createApi({
  reducerPath: 'spacesApi',
  baseQuery: fetchBaseQuery({ baseUrl: apiBase, credentials: 'include' }),
  tagTypes: ['Space', 'Folder', 'File'],
  endpoints: (builder) => ({
    getSpaces: builder.query<Space[], void>({
      query: () => '/spaces',
      providesTags: ['Space'],
    }),

    getSpace: builder.query<SpaceDetail, string>({
      query: (id) => `/spaces/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Space', id }],
    }),

    createSpace: builder.mutation<Space, { name: string }>({
      query: (body) => ({ url: '/spaces', method: 'POST', body }),
      invalidatesTags: ['Space'],
    }),

    getFolders: builder.query<Folder[], { spaceId: string; parentId?: string }>({
      query: ({ spaceId, parentId }) => ({
        url: `/spaces/${spaceId}/folders`,
        params: parentId ? { parentId } : {},
      }),
      providesTags: ['Folder'],
    }),

    getFolderAncestors: builder.query<{ id: string; name: string }[], { spaceId: string; folderId: string }>({
      query: ({ spaceId, folderId }) => `/spaces/${spaceId}/folders/${folderId}/ancestors`,
    }),

    createFolder: builder.mutation<Folder, { spaceId: string; name: string; parentId?: string }>({
      query: ({ spaceId, name, parentId }) => ({
        url: `/spaces/${spaceId}/folders`,
        method: 'POST',
        body: { name, parentId },
      }),
      invalidatesTags: ['Folder'],
    }),

    getFiles: builder.query<SpaceFile[], { spaceId: string; folderId?: string }>({
      query: ({ spaceId, folderId }) => ({
        url: `/spaces/${spaceId}/files`,
        params: folderId ? { folderId } : {},
      }),
      providesTags: ['File'],
    }),

    renameSpace: builder.mutation<Space, { id: string; name: string }>({
      query: ({ id, name }) => ({ url: `/spaces/${id}`, method: 'PATCH', body: { name } }),
      invalidatesTags: (_r, _e, { id }) => ['Space', { type: 'Space', id }],
    }),

    deleteSpace: builder.mutation<void, string>({
      query: (id) => ({ url: `/spaces/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Space'],
    }),

    addMember: builder.mutation<
      SpaceMember,
      { spaceId: string; email: string; role: 'READER' | 'WRITER' }
    >({
      query: ({ spaceId, email, role }) => ({
        url: `/spaces/${spaceId}/members`,
        method: 'POST',
        body: { email, role },
      }),
      invalidatesTags: (_r, _e, { spaceId }) => [{ type: 'Space', id: spaceId }],
    }),

    removeMember: builder.mutation<void, { spaceId: string; userId: string }>({
      query: ({ spaceId, userId }) => ({
        url: `/spaces/${spaceId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { spaceId }) => [{ type: 'Space', id: spaceId }],
    }),

    moveFile: builder.mutation<SpaceFile, { spaceId: string; fileId: string; folderId: string | null }>({
      query: ({ spaceId, fileId, folderId }) => ({
        url: `/spaces/${spaceId}/files/${fileId}/move`,
        method: 'PATCH',
        body: { folderId },
      }),
      invalidatesTags: ['File'],
    }),

    deleteFile: builder.mutation<void, { spaceId: string; fileId: string }>({
      query: ({ spaceId, fileId }) => ({
        url: `/spaces/${spaceId}/files/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['File', 'Space'],
    }),

    moveFolder: builder.mutation<Folder, { spaceId: string; folderId: string; parentId: string | null }>({
      query: ({ spaceId, folderId, parentId }) => ({
        url: `/spaces/${spaceId}/folders/${folderId}/move`,
        method: 'PATCH',
        body: { parentId },
      }),
      invalidatesTags: ['Folder'],
    }),

    deleteFolder: builder.mutation<void, { spaceId: string; folderId: string }>({
      query: ({ spaceId, folderId }) => ({
        url: `/spaces/${spaceId}/folders/${folderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Folder', 'File', 'Space'],
    }),

    uploadFiles: builder.mutation<SpaceFile[], UploadArgs>({
      queryFn: ({ spaceId, folderId, files, onProgress }, { signal }) =>
        new Promise((resolve) => {
          const formData = new FormData();
          files.forEach((f) => formData.append('files', f));
          const params = folderId ? `?folderId=${folderId}` : '';

          const xhr = new XMLHttpRequest();
          xhr.open('POST', `/api/spaces/${spaceId}/files${params}`);
          xhr.withCredentials = true;

          if (onProgress) {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) onProgress(e.loaded, e.total);
            };
          }

          signal?.addEventListener('abort', () => xhr.abort());

          xhr.onload = () => {
            const body = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve({ data: body });
            else resolve({ error: { status: xhr.status, data: body } });
          };
          xhr.onerror = () => resolve({ error: { status: 'FETCH_ERROR', error: 'Network error' } });
          xhr.onabort = () => resolve({ error: { status: 'FETCH_ERROR', error: 'Aborted' } });

          xhr.send(formData);
        }),
      invalidatesTags: ['File', 'Space'],
    }),
  }),
});

export const {
  useGetSpacesQuery,
  useGetSpaceQuery,
  useCreateSpaceMutation,
  useRenameSpaceMutation,
  useDeleteSpaceMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useGetFoldersQuery,
  useGetFolderAncestorsQuery,
  useCreateFolderMutation,
  useGetFilesQuery,
  useMoveFileMutation,
  useDeleteFileMutation,
  useMoveFolderMutation,
  useDeleteFolderMutation,
  useUploadFilesMutation,
} = spacesApi;
