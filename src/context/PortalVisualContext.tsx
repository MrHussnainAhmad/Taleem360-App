import { createContext, useContext } from 'react';

const PortalVisualContext = createContext(false);

export const PortalVisualProvider = PortalVisualContext.Provider;
export function usePortalVisuals() {
  return useContext(PortalVisualContext);
}
