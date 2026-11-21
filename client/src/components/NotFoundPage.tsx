import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/utils/useDocumentTitle';
import { DetailContainer } from './DetailContainer';

export const NotFoundPage: React.FC = () => {
  useDocumentTitle('Page not found');

  return (
    <DetailContainer>
      <div className="rounded-xl bg-slate-900 px-6 py-16 text-center md:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-400">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Page not found</h1>
        <p className="mt-3 text-slate-400">There's nothing at this address.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
        >
          Back to home
        </Link>
      </div>
    </DetailContainer>
  );
};
