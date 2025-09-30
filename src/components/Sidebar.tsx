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
  Sun,
  Moon,
} from 'lucide-react';
import { useAppState } from '@/store/useAppState';
import { useTheme } from 'next-themes';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useAppState();

  const navItems = [
    { to: '/', icon: Home, label: t('common.home') },
    { to: '/brut-net', icon: Scale, label: t('common.brutNet') },
    { to: '/endettement', icon: Wallet, label: t('common.endettement') },
    { to: '/epargne', icon: PiggyBank, label: t('common.epargne') },
    { to: '/credit', icon: Calculator, label: t('common.credit') },
    { to: '/immo', icon: LandPlot, label: t('common.immo') },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    const newLang = language === 'fr-FR' ? 'en-US' : 'fr-FR'; // Example toggle
    setLanguage(newLang);
    i18n.changeLanguage(newLang.split('-')[0]); // Update i18next
  };

  return (
    <div className={cn("pb-12 w-64 border-r bg-sidebar", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-sidebar-primary">
            {t('common.appName')}
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.to}
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                asChild
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
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-sidebar-primary">
            {t('common.tools')}
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : (
                <Sun className="mr-2 h-4 w-4" />
              )}
              {t('common.themeToggle')}
            </Button>
            {/* <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={toggleLanguage}
            >
              <Globe className="mr-2 h-4 w-4" />
              {t('common.languageToggle')}
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
}