"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Calculator,
  LandPlot,
  PiggyBank,
  Wallet,
  Scale,
  Home,
  Settings,
  ChevronLeft, // Icône pour réduire
  ChevronRight, // Icône pour étendre
} from 'lucide-react';
import { useAppState } from '@/store/useAppState';
import i18n from '@/app/i18n';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onLinkClick?: () => void;
  isCollapsed: boolean; // Nouvelle prop
  onToggleCollapse: () => void; // Nouvelle prop
}

export function Sidebar({ className, onLinkClick, isCollapsed, onToggleCollapse }: SidebarProps) {
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
    <div className={cn("pb-12 border-r bg-sidebar flex flex-col", className)}>
      {/* Bouton de bascule en haut */}
      <div className={cn("flex items-center p-3", isCollapsed ? "justify-center" : "justify-end")}>
        {!isCollapsed && (
          <h2 className="mr-auto text-xl font-semibold tracking-tight text-sidebar-primary">
            {t('appName')}
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.to}
                variant="ghost"
                className={cn(
                  "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
                asChild
                onClick={onLinkClick}
              >
                <Link to={item.to}>
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          {!isCollapsed && (
            <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight text-sidebar-primary">
              {t('tools')}
            </h2>
          )}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className={cn(
                "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              asChild
              onClick={onLinkClick}
            >
              <Link to="/settings">
                <Settings className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && t('settings')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}