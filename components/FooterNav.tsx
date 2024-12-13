import React from 'react';
import { Mail, Send, Settings } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const FooterNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Update the regular expression to match /inbox and /inbox/randombase64, but not /inbox/setting or /inbox/send
  const isInboxActive = pathname === '/inbox' || /^\/inbox\/(?!setting|send)[A-Za-z0-9+/=]+$/.test(pathname);

  const buttonClass = (isActive: boolean) => `
    flex-1 flex flex-col items-center justify-center py-2 text-black transition-colors
    ${isActive ? 'bg-[#ffeeac]' : 'bg-transparent hover:bg-[#F5E193]'}
  active:bg-[#ffeeac]
  `;

  return (
    <footer className="border-t bg-background">
      <div className="flex">
        <button
          className={buttonClass(isInboxActive)}
          onClick={() => router.push('/inbox')}
        >
          <Mail className="h-6 w-6" />
          <span className="text-xs mt-1">INBOX</span>
        </button>
        <button
          className={buttonClass(pathname === '/inbox/send')}
          onClick={() => router.push('/inbox/send')}
        >
          <Send className="h-6 w-6" />
          <span className="text-xs mt-1">SEND</span>
        </button>
        <button
          className={buttonClass(pathname === '/inbox/setting')}
          onClick={() => router.push('/inbox/setting')}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs mt-1">SETTINGS</span>
        </button>
      </div>
    </footer>
  );
};

export default FooterNav;