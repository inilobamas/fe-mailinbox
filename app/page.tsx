"use client";

import React, { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import PasswordInput from "@/components/PasswordInput";
import DOMPurify from 'dompurify';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  // const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  // const [countdown, setCountdown] = useState<number>(0);
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { setToken, setEmail, setRoleId } = useAuthStore();
  const token = useAuthStore(state => state.token)

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return; // Skip if no token

    const checkToken = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/get_user_me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userData = response.data;
        setEmail(userData.Email);
        setRoleId(userData.RoleID);

        // Redirect based on role
        if (userData.RoleID === 0 || userData.RoleID === 2) {
          router.push("/admin");
        } else if (userData.RoleID === 1) {
          router.push("/inbox");
        }
      } catch (error) {
        // If token is invalid, clear it
        setToken(null);
        console.error("Token validation failed:", error);
      }
    };

    checkToken();
  }, [token, setEmail, setRoleId, router]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (lockoutTime) return;

    // const formData = new FormData(e.currentTarget);
    // const email = formData.get("email")?.toString();
    // const password = formData.get("password")?.toString();

    if (!loginEmail || !password) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,
        { email: loginEmail, password: password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { token } = response.data;
      setToken(token);

      // // Get user details
      // const userResponse = await axios.get(
      //   `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/get_user_me`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   }
      // );

      // const userData = userResponse.data;
      // setEmail(userData.Email);
      // setRoleId(userData.RoleID);

      // // Redirect based on role
      // if (userData.RoleID === 0) {
      //   router.push("/admin");
      // } else {
      //   router.push("/inbox");
      // }
    } catch (error) {
        let errorMessage = "Incorrect email or password. Please try again."
        if (axios.isAxiosError(error) && error.response?.data?.error) {
          errorMessage = error.response.data.error
        }
        toast({
          description: errorMessage,
          variant: "destructive",
        })
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!lockoutTime) return;

    const interval = setInterval(() => {
      const remaining = lockoutTime - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        setLockoutTime(null);
        // setFailedAttempts(0);
        // setCountdown(0);
      } 
      // else {
      //   // setCountdown(Math.ceil(remaining / 1000));
      // }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutTime]);

  return (
    <>
      <div className="flex flex-col min-h-screen justify-between bg-white p-4 pt-8">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Where Simplicity Meets Speed.
            </h1>
          </div>
          <form onSubmit={onSubmit} className="space-y-6 p-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  placeholder="example@mailria.com"
                  required
                  value={loginEmail}
                  onChange={(e) => {
                    const value = e.target.value;
                    const sanitizedValue = DOMPurify.sanitize(value).replace(/\s/g, ''); // Sanitize and remove spaces
                    setLoginEmail(sanitizedValue);
                  }}
                  type="text"
                  className="pl-10 h-12 text-base border-gray-200 shadow appearance-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">
                Password
              </Label>
              <div className="relative">
                <PasswordInput
                  id="password"
                  placeholder="Input Password"
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    const sanitizedValue = DOMPurify.sanitize(value).replace(/\s/g, ''); // Sanitize and remove spaces
                    setPassword(sanitizedValue);
                  }}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              </div>
            </div>
            <Button
              className={`shadow appearance-non w-full h-12 text-base font-bold ${ !loginEmail || !password
                ? "bg-gray-400 cursor-not-allowed text-black"
                : "bg-[#ffeeac] hover:bg-yellow-300 text-black"
                }`}
              type="submit"
              disabled={isLoading || !loginEmail || !password}
            >
              {isLoading
                  ? "Signing in..."
                  : "Login"}
            </Button>
            {/* {failedAttempts === 3 && (
              <p className="text-xs text-red-600 text-center">
                Careful! One more failed attempt will disable login for 10 minutes.
              </p>
            )} */}
            {/* {lockoutTime ? (
              <p className="text-xs text-red-600 text-left">
                Too many failed attempts. Try again in {Math.ceil(countdown / 60)} minutes.
              </p>
            ) : null} */}
          </form>
        </div>
        <div className="w-full max-w-sm mx-auto mb-2 space-y-4 p-8 text-left fixed bottom-0 left-0 right-0" >
          <h2 className="text-l font-semibold">
            Looking for reliable email services?
          </h2>
          <p className="text-sm" >
            Mailria has you covered! Drop us a message at{" "}
            <a
              href="mailto:support@mailria.com"
              className="text-blue-600 hover:underline"
            >
              support@mailria.com
            </a>{" "}
            for more details.
          </p>
        </div>
      </div>
      <Toaster />
    </>
  );
}

