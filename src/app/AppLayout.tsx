"use client";

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { ComplianceBanner } from '@/components/ComplianceBanner';
import { Footer } from '@/components/Footer';
import { Sheet, SheetContent } from '@/components/ui/sheet'; // Import Sheet and SheetContent
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile hook

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
          {/* The SheetTrigger (menu button) will be in the Topbar */}
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onLinkClick={handleCloseMobileSidebar} />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar />
      )}
      <div className={`flex flex-col flex-1 ${!isMobile ? 'ml-64' : ''}`}> {/* Adjust margin for desktop sidebar */}
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