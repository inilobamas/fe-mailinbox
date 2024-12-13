"use client";
import React, { useEffect, Suspense } from 'react';
import Send from '@/components/Send';
import { theme } from "@/app/theme";
import LoadingProcessingPage from '@/components/ProcessLoading';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const router = useRouter();

  // Move the token check to useEffect
  useEffect(() => {
    const storedToken = useAuthStore.getState().getStoredToken();
    if (!storedToken) {
      router.replace("/");
      return;
    }
  }, [router]);

  const roleId = useAuthStore((state) => state.roleId);
  // Redirect based on role
  if (roleId === 0 || roleId === 2) {
    router.push("/not-found");
  }

  return (
    <Suspense fallback={<LoadingProcessingPage />}>
    <div className="flex h-[100dvh] flex-col " style={{ backgroundColor: theme.colors.background }}>
      <Send />
    </div>
    </Suspense>
  );
};

export default Page;