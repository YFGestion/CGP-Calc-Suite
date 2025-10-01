"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calculator,
  LandPlot,
  PiggyBank,
  Wallet,
  Scale,
  Home,
  Info,
  Globe,
  Settings,
} from 'lucide-react';
import { useAppState } from '@/store/useAppState';
import i18n from '@/app/i18n';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onLinkClick?: () => void; // Nouvelle prop
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useAppState();

  const navItems = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/brut-net', icon: Scale, label: t('brutNet') },
    { to: '/endettement', icon: Wallet, label: t('endettement') },
    { to: '/epargne', icon: PiggyBank, label: t('epargne') },
    { to: '/credit', icon: Calculator, label: t('credit') },
    { to: '/immo', icon: LandPlot, label: t('immo') },
  ];

  const toggleLanguage = () => {
    const newLang = language === 'fr-FR' ? 'en-US' : 'fr-FR';
    setLanguage(newLang);
    i18n.changeLanguage(newLang.split('-')[0]);
  };

  return (
    <div className={cn("pb-12 w-64 border-r bg-sidebar", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight text-sidebar-primary">
            {t('appName')}
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.to}
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                asChild
                onClick={onLinkClick}
              >
                <Link to={item.to}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight text-sidebar-primary">
            {t('tools')}
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              asChild
              onClick={onLinkClick}
            >
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                {t('settings')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}