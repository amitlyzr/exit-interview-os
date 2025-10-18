/**
 * Redux Store Configuration
 * Configures RTK store with API middleware for exit interview application
 */

import { configureStore } from "@reduxjs/toolkit";
import api from "./features/api/api";

/**
 * Create Redux store instance
 * @returns Configured Redux store with API slice
 */
export const makeStore = () => {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
};

/** Redux store type */
export type AppStore = ReturnType<typeof makeStore>;

/** Root state type */
export type RootState = ReturnType<AppStore["getState"]>;

/** Dispatch type */
export type AppDispatch = AppStore["dispatch"];
