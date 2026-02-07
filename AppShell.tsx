'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, HeartPulse, ClipboardList } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Health', href: '/health', icon: HeartPulse },
  { name: 'Check-ins', href: '/checkins', icon: ClipboardList },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 glass-card border-b border-stroke">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-text flex items-center justify-center">
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-bg rounded-sm"></div>
                    <div className="bg-bg rounded-sm"></div>
                    <div className="bg-bg rounded-sm"></div>
                    <div className="bg-bg rounded-sm"></div>
                  </div>
                </div>
                <span className="text-xl font-bold text-text">Polychrome</span>
              </Link>

              <div className="hidden md:flex space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-glass2 text-text'
                          : 'text-muted hover:text-text hover:bg-glass2/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon size={16} />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-stroke z-30">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-glass2 text-text'
                    : 'text-muted'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};