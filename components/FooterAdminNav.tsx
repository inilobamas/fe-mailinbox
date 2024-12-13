import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Settings, Plus, Database, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

const buttonClass = (isActive: boolean) => `
  flex-1 flex flex-col items-center justify-center py-2 text-black transition-colors
  ${isActive ? 'bg-[#ffeeac]' : 'bg-transparent hover:bg-[#F5E193]'}
  active:bg-[#ffeeac]
`;

const FooterAdminNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { roleId } = useAuthStore();

  const isAdminActive = /^\/admin(\/user(\/.*)?)?$/.test(pathname);

  const allowedPathsForRole2 = [
    '/admin',
    '/admin/create-single-email',
    '/admin/create-bulk-email',
  ];

  const handleNavigation = (path: string) => {
    if (roleId === 2) {
      if (allowedPathsForRole2.includes(path)) {
        router.push(path);
      } else {
        router.push('/admin/settings/account');
      }
    } else {
      router.push(path);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t bg-background">
      <div className="flex">
        <button
          className={buttonClass(isAdminActive)}
          onClick={() => handleNavigation('/admin')}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-xs mt-1">Dashboard</span>
        </button>
        <button
          className={buttonClass(pathname === '/admin/create-single-email')}
          onClick={() => handleNavigation('/admin/create-single-email')}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs mt-1">Create Single</span>
        </button>
        <button
          className={buttonClass(pathname === '/admin/create-bulk-email')}
          onClick={() => handleNavigation('/admin/create-bulk-email')}
        >
          <Database className="h-5 w-5" />
          <span className="text-xs mt-1">Create Bulk</span>
        </button>
        <button
          className={buttonClass(pathname === '/admin/settings' || pathname === '/admin/settings/account')}
          onClick={() => handleNavigation('/admin/settings')}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </footer>
  );
};

export default FooterAdminNav;