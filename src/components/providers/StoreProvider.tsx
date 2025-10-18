/**
 * Redux Store Provider Component
 * 
 * Wraps the application with Redux store for state management.
 * Provides access to RTK Query API endpoints for data fetching.
 * 
 * @module components/providers/StoreProvider
 */

"use client";

import { AppStore, makeStore } from "@/lib/store";
import { useRef } from "react";
import { Provider } from "react-redux";

/**
 * Redux Store Provider
 * 
 * Creates and provides a Redux store instance to all child components.
 * Uses a ref to ensure store is only created once per client session.
 * 
 * Features:
 * - RTK Query API integration for sessions, messages, feedback, etc.
 * - Automatic caching and data synchronization
 * - Optimistic updates for better UX
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap with store context
 * 
 * @example
 * ```tsx
 * // In app layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <StoreProvider>
 *       <AuthProvider>
 *         {children}
 *       </AuthProvider>
 *     </StoreProvider>
 *   );
 * }
 * ```
 */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);
  
  // Create store instance only once
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
