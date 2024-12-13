"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleX, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import FooterAdminNav from "@/components/FooterAdminNav";
import axios from "axios";
import { saveAs } from 'file-saver';
import LoadingDownloadPage from "@/components/DownloadLoading";
import { theme } from "@/app/theme";
import { useToast } from "@/hooks/use-toast"

interface EmailDetail {
  ID: number;
  SenderEmail: string;
  SenderName: string;
  From: string;
  Subject: string;
  Body: string;
  BodyEml: string;
  RelativeTime: string;
  ListAttachments: { Filename: string; URL: string }[];
}

const EmailDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  // Move the token check to useEffect
  useEffect(() => {
    const storedToken = useAuthStore.getState().getStoredToken();
    if (!storedToken) {
      router.replace("/");
      return;
    }

    const storedRoleID = useAuthStore.getState().getStoredRoleID();
    // Redirect based on role
    if (storedRoleID === 1) {
      router.push("/not-found");
    }
  }, [router]);

  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false); // State for loading indicator
  const [iframeHeight, setIframeHeight] = useState('0px');
  const { toast } = useToast();

  // Function to handle file download
  const handleDownload = async (url: string, filename: string) => {
    if (!token) return;

    setIsDownloading(true);
    try {

      const payload = {
        email_id: params.id,
        file_url: url,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user/download/file`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob', // Important to handle binary data
        }
      );

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      saveAs(blob, filename);
    } catch (error) {
      let errorMessage = "Failed to download file. Please try again."
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      toast({
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false);
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
    
    const fetchEmailDetail = async () => {
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user/detail/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch email");
        }

        const data = await response.json();
        setEmail(data);
      } catch (err) {
        console.error("Failed to fetch email:", err);
        setError("Failed to load email");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailDetail();
  }, [params.id, token, router]);

  if (isLoading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
  if (!email) return <div className="p-4 text-center">Email not found</div>;

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = e.target as HTMLIFrameElement;
    if (iframe.contentWindow) {
      const iframeDoc = iframe.contentWindow.document;
  
      // Add meta viewport tag
      const meta = iframeDoc.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1';
      iframeDoc.head.appendChild(meta);
  
      // Apply styles to iframe content
      const style = iframeDoc.createElement('style');
      style.textContent = `
        /* General styles */
        body {
          margin: 0;
          padding: 16px;
          font-family: system-ui, -apple-system, roboto;
          font-size: 14px;
          line-height: 1.5;
          color: ${theme.colors.textPrimary};
          width: 100%;
          box-sizing: border-box;
          overflow-y: auto !important;
        }
        img, table {
          max-width: 100%;
          height: auto;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow: hidden !important; /* Prevent scroll */
        }
        /* Override fixed widths */
        table, tr, td, th, div, p, img {
          max-width: 100% !important;
          width: auto !important;
          box-sizing: border-box;
        }
      `;
      iframeDoc.head.appendChild(style);
  
      // Adjust iframe height
      const height = iframeDoc.body.scrollHeight + 32;
      setIframeHeight(`${height}px`);
    }
  };

  return (
    <div style={{ backgroundColor: theme.colors.background }}>
      {isDownloading && (
        <LoadingDownloadPage />
      )}
      <div className="flex-1 overflow-auto pb-20">
        <div className="flex justify-between items-center p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 [&_svg]:size-5"
            onClick={() => router.back()}
          >
            <CircleX className="h-6 w-6" />
          </Button>
          <h1 className="text-sm font-semibold tracking-tight">
            {email.From}
          </h1>

        </div>

        <div className="space-y-2 p-4">
          <div className="border space-y-2 text-xs" style={{ borderColor: theme.colors.border, borderRadius: theme.borders.radius, boxShadow: theme.shadows.card }}>
            <div className="grid grid-cols-[50px_1fr] pl-1 pr-4">
              <span className="text-gray-500">From</span>
              <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                {email.SenderName} - {email.SenderEmail}
              </span>
            </div>
            <div className="grid grid-cols-[50px_1fr] pl-1 pr-4">
              <span className="text-gray-500">Subject</span>
              <span className="font-medium" style={{ color: theme.colors.textPrimary }}>{email.Subject}</span>
            </div>
            <div className="pl-1 pr-1">
              <span className="font-medium" style={{ color: theme.colors.textSecondary }}>{email.RelativeTime}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pl-4 pr-4">
          <div className="border bg-white shadow-sm" style={{ borderColor: theme.colors.border, borderRadius: theme.borders.radius, boxShadow: theme.shadows.card }}>
            <iframe
              srcDoc={email.Body}
              className="w-full"
              style={{
                height: iframeHeight,
                border: 'none',
                display: 'block'
              }}
              onLoad={handleIframeLoad}
              title="Email content"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        {/* Attachments Section */}
        {email.ListAttachments && email.ListAttachments.length > 0 && (
          <div className="pl-5 pr-5 pt-4">
            {/* <h5 className="font-medium">Attachments:</h5> */}
            <div className="space-y-1">
              {email.ListAttachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center"
                >
                  <span className="text-sm text-gray-700 pr-4">
                    {attachment.Filename.split('_').pop()}
                  </span>
                  <button
                    onClick={() => handleDownload(attachment.URL, attachment.Filename.split('_').pop()!)}
                    aria-label={`Download ${attachment.Filename.split('_').pop()}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <FooterAdminNav />
    </div>
  );
};

export default EmailDetailPage;