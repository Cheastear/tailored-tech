import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBase } from '@/lib/api';
import type { Share } from '@/types/share';
import type { Folder } from '@/types/folder';
import type { SpaceFile } from '@/types/file';

export const sharesPublicApi = createApi({
  reducerPath: 'sharesPublicApi',
  baseQuery: fetchBaseQuery({ baseUrl: apiBase }),
  endpoints: (builder) => ({
    resolveShareToken: builder.query<Share, { token: string; email?: string }>({
      query: ({ token, email }) => ({
        url: `/shares/resolve/${token}`,
        params: email ? { email } : {},
      }),
    }),

    sharePublicFolders: builder.query<
      Folder[],
      { token: string; parentId?: string; email?: string }
    >({
      query: ({ token, parentId, email }) => ({
        url: `/shares/resolve/${token}/folders`,
        params: { ...(parentId ? { parentId } : {}), ...(email ? { email } : {}) },
      }),
    }),

    sharePublicFiles: builder.query<
      SpaceFile[],
      { token: string; folderId?: string; email?: string }
    >({
      query: ({ token, folderId, email }) => ({
        url: `/shares/resolve/${token}/files`,
        params: { ...(folderId ? { folderId } : {}), ...(email ? { email } : {}) },
      }),
    }),
  }),
});

export const { useResolveShareTokenQuery, useSharePublicFoldersQuery, useSharePublicFilesQuery } =
  sharesPublicApi;
