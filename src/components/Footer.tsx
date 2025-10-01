"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MadeWithDyad } from '@/components/made-with-dyad';

export function Footer() {
  const { t } = useTranslation('common'); // Explicitly use 'common' namespace

  return (
    <footer className="border-t bg-background py-4 px-6 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
      <MadeWithDyad />
      <div className="mt-2">
        <Link to="/about" className="hover:underline text-xs">
          {t('disclaimerLink')}
        </Link>
      </div>
    </footer>
  );
}