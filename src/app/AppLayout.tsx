"use client";

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { ComplianceBanner } from '@/components/ComplianceBanner';
import { Footer } from '@/components/Footer';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppLayout() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCloseMobileSidebar = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {isMobile ? (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onLinkClick={handleCloseMobileSidebar} />
          </SheetContent>
        </Sheet>
      ) : (
        // Sur desktop, la Sidebar est fixe
        <div className="fixed left-0 top-0 h-full">
          <Sidebar />
        </div>
      )}
      {/* Le conteneur principal du contenu a maintenant un padding-left sur desktop */}
      <div className={`flex flex-col flex-1 ${!isMobile ? 'pl-64' : ''}`}>
        <Topbar onOpenMobileSidebar={() => setMobileMenuOpen(true)} isMobile={isMobile} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ComplianceBanner />
    </div>
  );
}