"use client";

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Footer } from '@/components/Footer';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppLayout() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Nouvel état pour la barre latérale

  const handleCloseMobileSidebar = () => {
    setMobileMenuOpen(false);
  };

  const toggleSidebarCollapse = () => { // Nouvelle fonction pour basculer l'état
    setIsSidebarCollapsed(prev => !prev);
  };

  const sidebarWidthClass = isSidebarCollapsed ? 'w-20' : 'w-64'; // Définir la classe de largeur

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {isMobile ? (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            {/* La sidebar mobile est toujours étendue */}
            <Sidebar onLinkClick={handleCloseMobileSidebar} isCollapsed={false} onToggleCollapse={toggleSidebarCollapse} />
          </SheetContent>
        </Sheet>
      ) : (
        // Sur desktop, la Sidebar est fixe et prend toute la hauteur
        <Sidebar className={`fixed left-0 top-0 h-full ${sidebarWidthClass}`} isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} />
      )}
      {/* Le conteneur principal du contenu a maintenant un padding-left dynamique sur desktop */}
      <div className={`flex flex-col flex-1 ${!isMobile ? (isSidebarCollapsed ? 'pl-20' : 'pl-64') : ''}`}>
        <Topbar onOpenMobileSidebar={() => setMobileMenuOpen(true)} isMobile={isMobile} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}