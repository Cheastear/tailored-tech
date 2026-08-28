import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Space, SpaceDetail } from '@/types/space';
import type { Folder } from '@/types/folder';
import type { SpaceFile } from '@/types/file';

type UploadArgs = {
  spaceId: string;
  folderId?: string;
  files: File[];
  onProgress?: (loaded: number, total: number) => void;
};

export const spacesApi = createApi({
  reducerPath: 'spacesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
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

    getFiles: builder.query<SpaceFile[], { spaceId: string; folderId?: string }>({
      query: ({ spaceId, folderId }) => ({
        url: `/spaces/${spaceId}/files`,
        params: folderId ? { folderId } : {},
      }),
      providesTags: ['File'],
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
  useGetFoldersQuery,
  useGetFilesQuery,
  useUploadFilesMutation,
} = spacesApi;
