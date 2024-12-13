"use client";

import React, { useEffect, useState } from 'react';
import { CircleXIcon, X, SendIcon, Paperclip } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { Toaster } from "@/components/ui/toaster";
import axios from "axios";
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import LoadingProcessingPage from './ProcessLoading';
import FooterNav from './FooterNav';
import LoadingUploadingPage from './UploadLoading ';

// Interfaces
interface UploadedAttachment {
  name: string;
  url: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  url: string;
}

// Constants
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 10;

const Send: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailId = searchParams.get('emailId');
  const [isLoading, setIsLoading] = useState(true);

  const email = useAuthStore((state) => state.email);

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const { toast } = useToast();
  const [uploading, setUploading] = useState<UploadingFile[]>([]);

  const token = useAuthStore.getState().getStoredToken();

  // Function to Fetch Email Details for Reply
  const fetchEmailDetail = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user/detail/${emailId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;

        setTo(data.SenderEmail || ''); // Set 'To' as the original sender
        setSubject(data.Subject ? `Re: ${data.Subject}` : 'Re:'); // Prefix subject with 'Re:'
        // setMessage(`\n\n--- Original Message ---\n${data.body || ''}`); // Include original message
      } else {
        toast({
          description: "Failed to fetch email details.",
          variant: "destructive",
        });
        router.push('/inbox');
      }
    } catch (error) {
      console.error("Failed to fetch email:", error);
      toast({
        description: "An error occurred while fetching email details.",
        variant: "destructive",
      });
      router.push('/inbox');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace("/");
      return;
    }

    if (emailId) {
      fetchEmailDetail();
    } else {
      setIsLoading(false);
    }
  }, [emailId, token, router]);

  // Handle sending email with JSON payload
  const handleSendEmail = async () => {
    if (!to || !subject || !message) {
      toast({
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(to)) {
      toast({
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        to,
        subject,
        body: message,
        attachments: attachments.map(att => att.url),
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/send/url_attachment`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        description: "Email sent successfully!",
        variant: "default",
      });

      router.push("/inbox?sent=success");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        toast({
          description: "Daily send email limit reached. Try again tomorrow.",
          variant: "destructive",
        });
      } else {
        let errorMessage = "Failed to send email. Please try again.";
        if (axios.isAxiosError(error) && error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        toast({
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection with validation and upload to S3
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      if (attachments.length + uploading.length + selectedFiles.length > MAX_FILES) {
        toast({
          description: "You can only send up to 10 files.",
          variant: "destructive",
        });
        return;
      }

      for (const file of selectedFiles) {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast({
            description: `The file "${file.name}" exceeds 10 MB.`,
            variant: "destructive",
          });
          continue;
        }

        const fileId = `${file.name}-${Date.now()}`;

        setUploading(prev => [...prev, { id: fileId, name: file.name, progress: 0, url: '' }]);

        const formData = new FormData();
        formData.append('attachment', file);

        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/upload/attachment`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / (progressEvent.total || 1)
                );
                setUploading(prevUploading =>
                  prevUploading.map(upload =>
                    upload.id === fileId ? { ...upload, progress: percentCompleted } : upload
                  )
                );
              },
            }
          );

          const fileUrl = response.data.url;

          setAttachments(prev => [...prev, { name: file.name, url: fileUrl }]);
          setUploading(prevUploading => prevUploading.filter(upload => upload.id !== fileId));

        } catch (error) {
          let errorMsg = `Failed to upload "${file.name}".`;
          if (axios.isAxiosError(error) && error.response?.data?.error) {
            errorMsg += ` ${error.response.data.error}`;
          }
          toast({
            description: errorMsg,
            variant: "destructive",
          });

          setUploading(prevUploading => prevUploading.filter(upload => upload.id !== fileId));
        }
      }

      e.target.value = '';
    }
  };

  // Remove uploaded attachment
  const handleRemoveAttachment = async (index: number) => {
    const attachmentToRemove = attachments[index];

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/delete-attachment`,
        { url: [attachmentToRemove.url] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAttachments(attachments.filter((_, i) => i !== index));
    } catch (error) {
      let errorMsg = `Failed to remove "${attachmentToRemove.name}".`;
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMsg += ` ${error.response.data.error}`;
      }
      toast({
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Remove all uploaded attachments
  const handleCancel = async () => {
    try {
      const urls = attachments.map(att => att.url);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/delete-attachment`,
        { url: urls },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAttachments([]);
    } catch (error) {
      let errorMsg = `Failed to remove attachments.`;
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMsg += ` ${error.response.data.error}`;
      }
      toast({
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Fixed Header */}
      <header className="flex justify-between items-center p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 [&_svg]:size-5 hover:bg-gray-100"
            onClick={() => {
              handleCancel();
              router.push('/inbox');
            }}
          >
            <CircleXIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className='flex items-center gap-2'>
          <div>
            <input
              className="hidden"
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .rtf, .odt, .ods, .odp, .jpg, .jpeg, .png, .gif, .bmp, .tiff, .mp3, .wav, .aac, .ogg, .mp4, .mov, .avi, .mkv, .zip, .rar, .7z, .tar, .gz"
            />
            <label htmlFor="attachments" className="cursor-pointer flex items-center gap-2 hover:bg-gray-100 p-2 rounded">
              <Paperclip className="h-5 w-5" />
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 [&_svg]:size-5 hover:bg-gray-100"
            onClick={handleSendEmail}
            disabled={isLoading || uploading.length > 0}
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Send Email Loading Indicator */}
          {isLoading && (
            <LoadingProcessingPage />
          )}

          <div className="flex justify-center h-screen pl-4 pr-4">
            <form className="w-full max-w-lg">

              {/* Email Composition Form */}
              <div className="flex bg-white text-sm">
                <div className="flex items-center gap-2 w-12">
                  <label className="mt-2 text-gray-700 text-sm mb-2" htmlFor="from">
                    From
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="ml-2 text-gray-700 text-sm">{email}</span>
                </div>
              </div>
              <div className="flex bg-white text-sm w-full">
                <div className="flex items-center gap-2 w-12">
                  <label className="mt-3 text-gray-700 text-sm mb-2" htmlFor="to">
                    To
                  </label>
                </div>
                <div className="mt-2 flex-1">
                  <Input
                    className="text-sm shadow appearance-none border w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="to"
                    type="email"
                    placeholder="Recipient's email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-2 mt-2">
                <Input
                  className="text-sm shadow appearance-none border w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="subject"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <Textarea
                  className="text-sm shadow appearance-none border w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="message"
                  rows={13}
                  placeholder="Compose email"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="mt-4 space-y-2">

                {/* Uploading Files with Individual Progress Bars */}
                {uploading.length > 0 && (
                  <LoadingUploadingPage />
                )}

                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50"
                  >
                    <span className="text-sm text-gray-600 truncate">
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>
        <Toaster />
      </main>
      <FooterNav />
    </>
  );
};

export default Send;