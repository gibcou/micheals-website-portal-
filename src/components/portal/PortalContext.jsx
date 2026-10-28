"use client";

import { createContext, useContext } from "react";

const PortalContext = createContext({ effectiveClientId: null, isImpersonating: false });

export const PortalContextProvider = PortalContext.Provider;

export function usePortalContext() {
  return useContext(PortalContext);
}
