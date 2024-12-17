"use client";


import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import axios from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import PasswordInput from './PasswordInput';
import { useRouter } from "next/navigation";
import DOMPurify from 'dompurify';

const Settings: React.FC = () => {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  // const roleId = useAuthStore((state) => state.roleId);

  useEffect(() => {
    const storedToken = useAuthStore.getState().getStoredToken();
    if (!storedToken) {
      router.replace("/");
      return;
    }
  }, [router]);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oldPasswordError, setOldPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const { toast } = useToast();

  const validatePasswords = () => {
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Your confirmation password doesn't match.");
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handleSubmit = async () => {
    setOldPasswordError(null);
    setConfirmPasswordError(null);

  if (newPassword.length < 6) {
      toast({
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
      });
      return;
  }

    if (!validatePasswords()) return;

    setIsLoading(true);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/change_password`,
        {
          old_password: currentPassword,
          new_password: newPassword
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        description: "Password successfully updated!",
        variant: "default",
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setOldPasswordError("The password you entered is incorrect.");
        } else if (err.response?.data?.error) {
          toast({
            description: `Failed to update password. ${err.response.data.error}`,
            variant: "destructive",
          });
        } else {
          toast({
            description: `Failed to update password. ${err.message}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          description: "Failed to update password. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   // Redirect based on role
  //   if (roleId === 0  || roleId === 2) {
  //     router.push("/not-found");
  //   }
  // }, [router]);

  return (
    <>
      <header className="flex justify-between items-center p-2">
        <div className="flex items-center gap-2">
          <label className="text-xl font-bold">
            Change Password
          </label>
        </div>
      </header>
      <main className="flex-1">
        <div className="flex justify-center items-start p-4 overflow-auto">
          <form className="w-full max-w-lg text-sm p-4" onSubmit={(e) => e.preventDefault()}>
            <PasswordInput
              id="current-password"
              placeholder="Old Password"
              value={currentPassword}
              onChange={(e) => {
                const value = e.target.value;
                const sanitizedValue = DOMPurify.sanitize(value).replace(/\s/g, ''); // Sanitize and remove spaces
                setCurrentPassword(sanitizedValue); // Remove spaces
              }}
              showPassword={showCurrentPassword}
              setShowPassword={setShowCurrentPassword}
              error={oldPasswordError}
            />
            <PasswordInput
              id="new-password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                const value = e.target.value;
                const sanitizedValue = DOMPurify.sanitize(value).replace(/\s/g, ''); // Sanitize and remove spaces
                setNewPassword(sanitizedValue);
              }}
              showPassword={showNewPassword}
              setShowPassword={setShowNewPassword}
            />
            <PasswordInput
              id="confirm-password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => {
                const value = e.target.value;
                const sanitizedValue = DOMPurify.sanitize(value).replace(/\s/g, ''); // Sanitize and remove spaces
                setConfirmPassword(sanitizedValue);
              }}
              showPassword={showConfirmPassword}
              setShowPassword={setShowConfirmPassword}
              error={confirmPasswordError}
            />
            <div className="flex items-center justify-center mt-6">
              <Button
                className={`w-3/4 py-2 px-4 shadow appearance-non font-bold rounded focus:outline-none focus:shadow-outline ${
                  isLoading || !currentPassword || !newPassword || !confirmPassword
                    ? 'bg-gray-300 text-black cursor-not-allowed'
                    : 'bg-[#ffeeac] hover:bg-yellow-300 text-black'
                }`}
                onClick={handleSubmit}
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                Submit
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Toaster />
    </>
  );
};

export default Settings;