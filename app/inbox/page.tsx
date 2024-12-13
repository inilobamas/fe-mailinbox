"use client";

import React, { Suspense } from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { Email } from "@/types/email";
import FooterNav from "@/components/FooterNav";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";
import { theme } from "../theme";

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-full">Loading...</div>
);

const InboxPageContent: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const roleId = useAuthStore((state) => state.roleId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sentStatus = searchParams.get('sent');
  const [sentEmails, setSentEmails] = useState(0);
  const [email, setEmailLocal] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const storedToken = useAuthStore.getState().getStoredToken();
  const { setEmail } = useAuthStore();

  // Check if the auth store is ready
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    // Wait for the auth store to load and set the state
    setAuthLoaded(true);
  }, []);

  // Redirect logic inside useEffect
  useEffect(() => {
    if (!authLoaded) return; // Wait until auth is loaded

    if (!storedToken) {
      router.replace("/");
    } else if (roleId === 0 || roleId === 2) {
      router.replace("/not-found");
    }
  }, [authLoaded, storedToken, roleId, router]);

  const fetchCountSentEmails = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/sent/by_user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        setSentEmails(response.data.SentEmails);
        setEmail(response.data.Email);
        setEmailLocal(response.data.Email);
      }
    } catch (err) {
      console.error("Failed to fetch sent emails count:", err);
    }
  };

  useEffect(() => {
    if (!authLoaded) return; // Wait until auth is loaded
    if (!storedToken || roleId === 0 || roleId === 2) return; // Don't proceed if not authorized

    let isSubscribed = true;
    const controller = new AbortController();

    if (sentStatus === 'success') {
      toast({
        description: "Send email successful!",
        variant: "default",
      });
      // Remove the query parameter from the URL
      router.replace('/inbox');
    }

    const fetchEmails = async (signal?: AbortSignal) => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );

        if (isSubscribed) {
          setEmails(response.data);
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          console.error("Failed to fetch emails:", err);
          setError("Failed to load emails");
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchCountSentEmails();
    fetchEmails(controller.signal);

    // Set up interval for auto-refresh
    const intervalId = setInterval(() => {
      fetchEmails();
    }, 3000);

    // Cleanup function
    return () => {
      isSubscribed = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [authLoaded, storedToken, roleId, sentStatus, token, router, setEmail]);

  // Conditional rendering based on authLoaded and roleId is handled inside useEffect

  return (
    <div className="flex h-[100dvh] flex-col" style={{ backgroundColor: theme.colors.background }}>
      {/* Fixed Header */}
      <header
        className="flex justify-between items-center p-2"
        style={{ backgroundColor: theme.colors.primary, boxShadow: theme.shadows.card }}
      >
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: theme.colors.textPrimary }}
        >
          {email}
        </h1>
        <h1
          className="text-sm font-semibold tracking-tight"
          style={{ color: theme.colors.textPrimary }}
        >
          Daily Send {sentEmails}/3
        </h1>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-0.5">
          {isLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center" style={{ color: theme.colors.error }}>
              {error}
            </div>
          ) : emails.length > 0 ? (
            <div className="divide-y">
              {emails.map((email) => (
                <div
                  key={email.ID}
                  className={`p-4 cursor-pointer transform transition duration-300 ease-in-out hover:scale-101 hover:shadow-lg hover:bg-gray-100 
                      ${!email.IsRead ? 'bg-[#F2F6FC]' : ''}`}
                  onClick={() => router.push(`/inbox/${email.email_encode_id}`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className="font-semibold truncate"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        {email.SenderName}
                      </h3>
                      <span
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {email.RelativeTime}
                      </span>
                    </div>
                    <h4
                      className="font-medium truncate"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {email.Subject}
                    </h4>
                    <p
                      className="text-sm truncate"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {email.Preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="p-4 text-center cursor-pointer text-blue-500 underline"
              onClick={() => window.location.reload()}
            >
              No emails found. Please refresh your browser.
            </div>
          )}
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="w-full z-10">
        <FooterNav />
      </footer>

      <Toaster />
    </div>
  );
};

// Wrap InboxPageContent with Suspense
const InboxPage: React.FC = () => (
  <Suspense fallback={<LoadingFallback />}>
    <InboxPageContent />
  </Suspense>
);

export default InboxPage;