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
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogIn,
  LogOut,
  UserCircle,
  ShieldCheck, // Added ShieldCheck icon for admin
} from 'lucide-react';
import { useAppState } from '@/store/useAppState';
import i18n from '@/app/i18n';
import { useUser } from '@/hooks/useUser';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onLinkClick?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ className, onLinkClick, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useAppState();
  const { id: userId, signOut } = useUser();
  const { role: currentUserRole, isPremium } = useUserRole(); // Get current user's role

  const handleLogout = async () => {
    await signOut();
    if (onLinkClick) onLinkClick();
  };

  const navItems = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/epargne', icon: PiggyBank, label: t('epargne') },
    { to: '/endettement', icon: Wallet, label: t('endettement') },
    { to: '/credit', icon: Calculator, label: t('credit') },
    { to: '/immo', icon: LandPlot, label: t('immo') },
    { to: '/autres-calculs', icon: LayoutGrid, label: t('autresCalculs') },
    { to: '/settings', icon: Settings, label: t('settings') },
  ];

  const toggleLanguage = () => {
    const newLang = language === 'fr-FR' ? 'en-US' : 'fr-FR';
    setLanguage(newLang);
    i18n.changeLanguage(newLang.split('-')[0]);
  };

  return (
    <div className={cn("pb-12 border-r bg-sidebar flex flex-col", className)}>
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
          <h2 className={cn("mb-2 px-4 text-lg font-semibold tracking-tight text-sidebar-foreground", isCollapsed && "sr-only")}>
            {t('mySpace')}
          </h2>
          <div className="space-y-1">
            {userId ? (
              <>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed ? "justify-center" : "justify-start"
                  )}
                  asChild
                  onClick={onLinkClick}
                >
                  <Link to="/profile">
                    <UserCircle className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && (
                      <span className="flex items-center">
                        {t('profile')}
                        {currentUserRole === 'admin' && <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white">{t('admin')}</Badge>}
                        {currentUserRole === 'premium' && <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white">{t('premium')}</Badge>}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed ? "justify-center" : "justify-start"
                  )}
                  asChild
                  onClick={onLinkClick}
                >
                  <Link to="/scenarios">
                    <LayoutGrid className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && t('myScenarios')}
                  </Link>
                </Button>
                {currentUserRole === 'admin' && ( // Conditional rendering for admin link
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isCollapsed ? "justify-center" : "justify-start"
                    )}
                    asChild
                    onClick={onLinkClick}
                  >
                    <Link to="/admin">
                      <ShieldCheck className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                      {!isCollapsed && t('adminDashboard')}
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed ? "justify-center" : "justify-start"
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && t('logout')}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
                asChild
                onClick={onLinkClick}
              >
                <Link to="/login">
                  <LogIn className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && t('login')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}