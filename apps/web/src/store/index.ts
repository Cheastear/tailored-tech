import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './authApi';
import { spacesApi } from './spacesApi';
import { sharesPublicApi } from './sharesPublicApi';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [spacesApi.reducerPath]: spacesApi.reducer,
    [sharesPublicApi.reducerPath]: sharesPublicApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(authApi.middleware, spacesApi.middleware, sharesPublicApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
