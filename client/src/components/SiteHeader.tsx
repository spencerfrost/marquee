import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { OmniSearch } from './OmniSearch';
import { RegionPicker } from './RegionPicker';
import { SeerrSettings } from './SeerrSettings';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-100'
  }`;

// Shared top bar for the browse pages (home, discover, search). Detail pages
// use DetailContainer's back-button chrome instead.
export const SiteHeader: React.FC = () => (
  <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-6">
      <Link to="/" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-100">
        <img src="/logo192.png" alt="" className="h-16 w-16" />
        Marquee
      </Link>
      <nav className="flex items-center gap-1">
        <NavLink to="/" end className={navLinkClass}>Home</NavLink>
        <NavLink to="/discover" className={navLinkClass}>Discover</NavLink>
      </nav>
    </div>
    <div className="flex items-center gap-3">
      <OmniSearch />
      <RegionPicker />
      <SeerrSettings />
    </div>
  </header>
);

// Page shell for the browse pages: dark background, dotted ambient texture,
// centered max-width column with the site header on top.
export const BrowseLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-slate-950">
    {/* Ambient backdrop texture - subtle, fixed, doesn't scroll with content */}
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.04]"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }}
    />
    <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <SiteHeader />
      {children}
    </div>
  </div>
);
