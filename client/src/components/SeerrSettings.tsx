import React, { useEffect, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Input } from './ui/input';

const STORAGE_KEY = 'marquee:seerrUrl';

// Each viewer points at their own Seerr (Overseerr/Jellyseerr) instance, so
// the URL lives in localStorage rather than the build. Unset means no Seerr
// link on poster cards. Same module-level listener pattern as RegionPicker.
let listeners: Array<(url: string) => void> = [];

export function getSeerrUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function setSeerrUrl(url: string): void {
  try {
    if (url) localStorage.setItem(STORAGE_KEY, url);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled — the URL just won't persist.
  }
  listeners.forEach((listener) => listener(url));
}

export function useSeerrUrl(): string {
  const [url, setUrl] = useState<string>(getSeerrUrl());

  useEffect(() => {
    listeners.push(setUrl);
    return () => {
      listeners = listeners.filter((l) => l !== setUrl);
    };
  }, []);

  return url;
}

// Accepts "seerr.example.com" or a full URL; returns '' if it isn't http(s).
// Trailing slashes are dropped so `${url}/movie/123` stays well-formed.
function normalizeSeerrUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.href.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export const SeerrSettings: React.FC = () => {
  const url = useSeerrUrl();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(url);
  const [invalid, setInvalid] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(url);
      setInvalid(false);
    }
    setOpen(next);
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalized = normalizeSeerrUrl(draft);
    if (draft.trim() && !normalized) {
      setInvalid(true);
      return;
    }
    setSeerrUrl(normalized);
    setOpen(false);
  };

  const handleClear = () => {
    setSeerrUrl('');
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 transition hover:bg-slate-800"
        aria-label="Seerr settings"
        title={url ? `Seerr: ${url}` : 'Connect your Seerr'}
      >
        <img
          src="https://seerr.dev/os_logo_filled.svg"
          alt=""
          className={`h-4 w-4 ${url ? '' : 'opacity-40 grayscale'}`}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup className="w-80 rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-300 shadow-xl">
            <Popover.Title className="text-sm font-semibold text-slate-100">Seerr</Popover.Title>
            <Popover.Description className="mt-1 text-xs text-slate-400">
              Add your Seerr address to get a request link on every poster. Saved in this browser only.
            </Popover.Description>
            <form onSubmit={handleSubmit} className="mt-3 space-y-3">
              <Input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setInvalid(false);
                }}
                placeholder="https://seerr.example.com"
                aria-label="Seerr URL"
                aria-invalid={invalid || undefined}
                autoFocus
                className="border-slate-700 bg-slate-800/80 text-slate-100"
              />
              {invalid && <p className="text-xs text-red-400">That doesn't look like a web address.</p>}
              <div className="flex justify-end gap-2">
                {url && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
                >
                  Save
                </button>
              </div>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
