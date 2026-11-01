import { useEffect } from 'react';

const APP_NAME = 'Marquee';

// Every routed page calls this, so there's no cleanup — the next page sets its
// own title. Pass undefined while data is loading to show just the app name.
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
