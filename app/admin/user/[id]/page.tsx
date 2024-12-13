"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import axios from 'axios'
import FooterAdminNav from "@/components/FooterAdminNav"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { theme } from '@/app/theme'

interface UserEmail {
  user_encode_id: string;
  email_encode_id: string;
  ID: number
  SenderEmail: string
  SenderName: string
  Subject: string
  Preview: string
  Body: string
  RelativeTime: string
}

export default function UserDetail() {
  const [emails, setEmails] = useState<UserEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  // const [sentEmails, setSentEmails] = useState(0)
  const params = useParams()
  const router = useRouter()
  // const token = useAuthStore((state) => state.token)
  const [token, setToken] = useState("")

  // Move the token check to useEffect
  useEffect(() => {
    const storedToken = useAuthStore.getState().getStoredToken();
    if (!storedToken) {
      router.replace("/");
      return;
    }

    setToken(storedToken)

    const storedRoleID = useAuthStore.getState().getStoredRoleID();
    // Redirect based on role
    if (storedRoleID === 1) {
      router.push("/not-found");
    }
  }, [router]);

  const handleEmailClick = (uemail: UserEmail) => {
    router.push(`/admin/user/detail/${uemail.email_encode_id}`);
  }

  const fetchUserEmailsWhenNotFound = async () => {
    if (!token) return;
  
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      setEmails(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user emails:', err);
      setError('Failed to load user emails');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = useAuthStore.getState().getStoredToken();
    if (!storedToken) {
      router.replace("/");
      return;
    }
  
    if (!token) {
      setIsLoading(false); // Ensure loading state is updated
      return;
    }
    
    let isSubscribed = true;
    const controller = new AbortController();
  
    // Separate function to fetch user details (runs only once)
    const fetchUserDetails = async (signal?: AbortSignal) => {
      if (!token) {
        router.replace("/");
        return;
      }
  
      try {
        const responseDetailUser = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );
  
        if (responseDetailUser.data && isSubscribed) {
          setEmail(responseDetailUser.data.Email);
        }
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      }
    };
  
    // Function to fetch only emails (will be called repeatedly)
    const fetchUserEmails = async (signal?: AbortSignal) => {
      if (!token) return;
  
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user/${params.id}`,
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
          console.error('Failed to fetch user emails:', err);
          setError('Failed to load user emails');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };
  
    // Initial fetch for both user details and emails
    fetchUserDetails(controller.signal);
    fetchUserEmails(controller.signal);
  
    // Set up interval for auto-refresh of emails only
    const intervalId = setInterval(() => {
      fetchUserEmails();
    }, 3000);
  
    // Cleanup function
    return () => {
      isSubscribed = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [params.id, token, router]); // Only include essential dependencies

  return (
    <>
    <div className="space-y-2" style={{ backgroundColor: theme.colors.background }}>
      <div className="flex-1 overflow-auto pb-20">
        
          <div className="space-y-0.5">
          <div className="flex justify-between items-center p-2" style={{ backgroundColor: theme.colors.primary, boxShadow: theme.shadows.card }}>
              <h1 className="text-xl font-semibold tracking-tight">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </h1>
              <h1 className="text-sm font-semibold tracking-tight">
                {email}
              </h1>
            </div>
            <div className="flex items-center gap-4"></div>
            {isLoading ? (
              <div className="p-4 text-center">Loading...</div>
            ) : error ? (
              <div className="p-4 text-center">{error}</div>
            ) : emails.length > 0 ? (
              <div className="divide-y">
                {emails.map((email) => (
                  <div
                    key={email.ID}
                    className="p-4 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleEmailClick(email)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{email.SenderName}</h3>
                        <span className="text-sm text-gray-500">
                          {email.RelativeTime}
                        </span>
                      </div>
                      <h4 className="font-medium truncate">{email.Subject}</h4>
                      <p className="text-sm text-gray-500 truncate">{email.Preview}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="p-4 text-center cursor-pointer text-blue-500 underline"
                onClick={fetchUserEmailsWhenNotFound}
              >
                No emails found, Please Refresh your browser.
              </div>
            )}
          </div>
        </div>
        <FooterAdminNav />
      </div>
      <Toaster />
    </>
  )
}