'use client';

import React, { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FooterAdminNav from "@/components/FooterAdminNav";
import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import DomainSelector from "@/components/DomainSelector";
import LoadingProcessingPage from "@/components/ProcessLoading";
import { useRouter } from "next/navigation";

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-full"></div>
);

const CreateSingleEmailPageContent: React.FC = () => {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const roleId = useAuthStore((state) => state.roleId);
  const storedToken = useAuthStore.getState().getStoredToken();
  const { toast } = useToast();

  // State variables
  const [selectedDomain, setSelectedDomain] = useState("mailria.com");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRandomPasswordActive, setIsRandomPasswordActive] = useState(false);

  // Authentication loaded state
  const [authLoaded, setAuthLoaded] = useState(false);

  // Initialize authLoaded on component mount
  useEffect(() => {
    setAuthLoaded(true);
  }, []);

  // Redirect users based on authentication and role
  useEffect(() => {
    if (!authLoaded) return;

    if (!storedToken) {
      router.replace("/");
      return;
    }

    if (roleId === 1) {
      router.replace("/not-found");
    }
  }, [authLoaded, storedToken, roleId, router]);

  // If auth is not loaded yet or user is not authorized, show loading
  if (!authLoaded || roleId === 1) {
    return <LoadingFallback />;
  }

  // Toggle random password generation
  const toggleRandomPassword = () => {
    if (!isRandomPasswordActive) {
      generateRandomPassword();
      setIsRandomPasswordActive(true);
    } else {
      setPassword("");
      setIsRandomPasswordActive(false);
    }
  };

  // Generate a random password
  const generateRandomPassword = () => {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = lower + upper + numbers + symbols;

    // Ensure at least one character from each category
    let pwd = "";
    pwd += lower.charAt(Math.floor(Math.random() * lower.length));
    pwd += upper.charAt(Math.floor(Math.random() * upper.length));
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Fill the remaining characters
    for (let i = 4; i < 12; i++) {
      pwd += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password to randomize character positions
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');

    setPassword(pwd);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Additional role check in case the roleId changes after component mount
      if (roleId === 1) {
        router.push("/not-found");
      }

      if (password.length < 6) {
        toast({
          description: "Password must be at least 6 characters long. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      // API call to create the user
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/`,
        {
          email: `${username}@${selectedDomain}`,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show success toast
      toast({
        description: `Email: ${username}@${selectedDomain} Password: ${password} successfully created!`,
        variant: "default",
      });

      // Reset form fields
      setUsername("");
      setPassword("");
      setIsRandomPasswordActive(false);
    } catch (error) {
      let errorMessage = "Failed to create user. Please try again.";
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data &&
        error.response.data.error
      ) {
        errorMessage = error.response.data.error;
      }
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-4 border-b flex items-center justify-between shadow appearance-non">
          <Toaster />
        </div>

        <div className="max-w-md mx-auto p-6">
          {/* You can uncomment the heading if needed */}
          {/* <h2 className="text-xl font-bold text-center mb-8">Create Single Email</h2> */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="flex items-center gap-2">
              <Input
                value={username}
                onChange={(e) => {
                  let value = e.target.value.toLowerCase();
                  value = value.replace(/\s/g, ''); // Remove spaces
                  value = value.replace(/[^a-zA-Z0-9]/g, ''); // Remove special chars
                  setUsername(value);
                }}
                placeholder="Email"
                className="shadow appearance-non flex-1 h-12"
                required
              />
              <span className="text-lg">@</span>
              <DomainSelector
                value={selectedDomain}
                onChange={(value) => setSelectedDomain(value)}
                className="shadow appearance-non w-[180px] h-12"
              />
            </div>

            {/* Password Input */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={password}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, ''); // Remove spaces
                  setPassword(value);
                }}
                placeholder="Password"
                className={
                  isRandomPasswordActive
                    ? "shadow appearance-non flex-1 h-12 bg-gray-300"
                    : "shadow appearance-non flex-1 h-12"
                }
                disabled={isRandomPasswordActive}
                required
              />
              <Button
                type="button"
                onClick={toggleRandomPassword}
                className={`shadow appearance-none w-[180px] h-12 font-bold text-black ${
                  isRandomPasswordActive
                    ? "bg-yellow-300 hover:bg-yellow-400"
                    : "bg-[#ffeeac] hover:bg-yellow-300"
                }`}
              >
                {isRandomPasswordActive ? "Random Password" : "Random Password"}
              </Button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                className={`shadow appearance-none h-11 w-3/4 max-w-xs font-bold text-black ${
                  !username || !password
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#ffeeac] hover:bg-yellow-300"
                }`}
                disabled={!username || !password}
              >
                Create
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && <LoadingProcessingPage />}

      {/* Footer */}
      <FooterAdminNav />
    </div>
  );
};

// Wrap the content component with Suspense
const CreateSingleEmailPage: React.FC = () => (
  <Suspense fallback={<LoadingFallback />}>
    <CreateSingleEmailPageContent />
  </Suspense>
);

export default CreateSingleEmailPage;