import { useState, useCallback } from 'react';

/**
 * Custom hook to manage and strongly persist view modes (e.g. 'table' vs 'cards', 'kanban' vs 'table')
 * in browser localStorage per module, ensuring the user's selected preference stays persistent across sessions,
 * navigation, and page refreshes on mobile and desktop.
 *
 * @param {string} storageKey - Unique identifier for the module/feature (e.g. 'users_mobile_view', 'crm_leads_view')
 * @param {string} defaultMode - Initial fallback mode if no preference has been stored yet (e.g. 'table' or 'cards')
 * @returns {[string, (mode: string | ((prev: string) => string)) => void]} [viewMode, setViewMode]
 */
export function useViewMode(storageKey, defaultMode = 'table') {
  const fullKey = `view_pref_${storageKey}`;

  const [viewMode, setViewModeState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(fullKey);
        if (stored !== null && stored !== undefined && stored !== '') {
          return stored;
        }
      }
    } catch (e) {
      console.warn(`[useViewMode] Failed to read ${fullKey} from localStorage:`, e);
    }
    return defaultMode;
  });

  const setViewMode = useCallback(
    (newMode) => {
      setViewModeState((prev) => {
        const resolved = typeof newMode === 'function' ? newMode(prev) : newMode;
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(fullKey, resolved);
          }
        } catch (e) {
          console.warn(`[useViewMode] Failed to write ${fullKey} to localStorage:`, e);
        }
        return resolved;
      });
    },
    [fullKey]
  );

  return [viewMode, setViewMode];
}

export default useViewMode;
