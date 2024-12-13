"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import FooterNav from "@/components/FooterNav";
import FooterAdminNav from "@/components/FooterAdminNav";
import { useAuthStore } from "@/stores/useAuthStore"

export default function NotFound() {
  const roleId = useAuthStore((state) => state.roleId)

  return (
    <div className="flex flex-col min-h-screen">
      

      <main className="flex flex-1 flex-col items-center justify-center px-4 space-y-6">
        <h1 className="text-7xl font-bold text-gray-900">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800">Page Not Found</h2>
        <p className="text-center text-gray-600">
        <p>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        </p>
        <Button asChild className="mt-6 bg-[#ffeeac] font-bold hover:bg-yellow-300 text-black">
          <Link href="/">Go Back Home</Link>
        </Button>
      </main>

      {/* Footer */}
      {roleId === 1 ? (
        <FooterNav />
      ) : roleId === 0 || roleId === 2 ? (
        <FooterAdminNav />
      ) : null}
    </div>
  );
}