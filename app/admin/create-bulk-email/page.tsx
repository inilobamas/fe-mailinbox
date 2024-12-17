'use client'

import { useEffect, useState, Suspense } from "react"
import { Minus, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import FooterAdminNav from "@/components/FooterAdminNav"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuthStore } from "@/stores/useAuthStore"
import axios from 'axios'
import DomainSelector from "@/components/DomainSelector"
import LoadingProcessingPage from "@/components/ProcessLoading"
import { useRouter } from "next/dist/client/components/navigation"
import DOMPurify from 'dompurify';

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-full"></div>
);

const CreateBulkEmailPageContent: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState("mailria.com")
  const [count, setCount] = useState(2)
  const [password, setPassword] = useState("")
  const [baseName, setBaseName] = useState("")
  const { toast } = useToast()
  const router = useRouter();
  const token = useAuthStore((state) => state.token)
  const roleId = useAuthStore((state) => state.roleId);
  const storedToken = useAuthStore.getState().getStoredToken();

  const [receiveEmail, setReceiveEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRandomPasswordActive, setIsRandomPasswordActive] = useState(false);
  const [isRandomNameActive, setIsRandomNameActive] = useState(false);

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

  const toggleRandomPassword = () => {
    if (!isRandomPasswordActive) {
      generateRandomPassword();
      setIsRandomPasswordActive(true);
    } else {
      setPassword("");
      setIsRandomPasswordActive(false);
    }
  };

  const toggleRandomName = () => {
    if (!isRandomNameActive) {
      setIsRandomNameActive(true);
      setBaseName("random");
    } else {
      setIsRandomNameActive(false);
      setBaseName("");
    }
  };

  const updateCount = (newCount: number) => {
    if (newCount >= 1 && newCount <= 100) {
      setCount(newCount)
    }
  }

  // const generateRandomNames = () => {
  //   setIsRandom(true)
  // }

  const generateRandomPassword = () => {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = lower + upper + numbers + symbols;

    // Ensure at least one character from each category
    let password = "";
    password += lower.charAt(Math.floor(Math.random() * lower.length));
    password += upper.charAt(Math.floor(Math.random() * upper.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Fill the remaining characters
    for (let i = 4; i < 8; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password to randomize character positions
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    setPassword(password);
    // setIsPasswordRandom(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast({
        description: "Please provide a password.",
        variant: "destructive",
      })
      return
    }
    if (count < 2 || count > 100) {
      toast({
        description: "Quantity must be between 2 and 100. Please try again.",
        variant: "destructive",
      })
      return
    }
    if (password.length < 6) {
      toast({
        description: "Password must be at least 6 characters long. Please try again.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/bulk`,
        {
          base_name: baseName || "random",
          quantity: count,
          password: password,
          send_to: receiveEmail,
          domain: selectedDomain
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      toast({
        description: `Successfully created ${count} accounts.`,
        variant: "default",
      })
      // Reset the form
      setBaseName("")
      setPassword("")
      setReceiveEmail("")
      // setIsRandom(false)
      // setIsPasswordRandom(false)
    } catch (error) {
      let errorMessage = "Failed to create users. Please try again."
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      toast({
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRandomPasswordActive(false)
      setIsRandomNameActive(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-4 border-b flex items-center justify-between shadow appearance-non">
          <Toaster />
        </div>

        <div className="max-w-md mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={toggleRandomName}
                  className={`shadow appearance-none w-[180px] h-12 font-bold text-black ${isRandomNameActive
                    ? "bg-yellow-300 hover:bg-yellow-400"
                    : "bg-[#ffeeac] hover:bg-yellow-300"
                    }`}
                >
                  {isRandomNameActive ? "Random Name" : "Random Name"}
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2 mt-auto mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="shadow appearance-non h-12 w-12 rounded-none "
                    onClick={() => updateCount(count - 1)}
                    disabled={count <= 2}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="text"
                    value={count}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) { // Allow only digits
                        const numericValue = parseInt(value, 10);
                        if (numericValue < 101) {
                          setCount(numericValue);
                        } else if (value === "") {
                          setCount(0); // Allow clearing the input
                        }
                      }
                    }}
                    className="shadow appearance-non w-full h-12 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shadow appearance-non h-12 w-12 rounded-none"
                    onClick={() => updateCount(count + 1)}
                    disabled={count >= 100}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-center text-xs text-red-500">
                  Minimum 2, max 100
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={isRandomNameActive ? "random" : baseName}
                placeholder="Email (numeric)"
                className={
                  isRandomNameActive
                    ? "shadow appearance-none flex-1 h-12 bg-gray-300"
                    : "shadow appearance-none flex-1 h-12"
                }
                onChange={(e) => {
                  const value = e.target.value.toLowerCase();
                  setBaseName(value.replace(/\s/g, '')); // Remove spaces
                  const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '');
                  const domPurifyValue = DOMPurify.sanitize(sanitizedValue); // Sanitize
                  setBaseName(domPurifyValue);
                }}
                disabled={isRandomNameActive}
              />
              <span className="text-lg">@</span>
              <DomainSelector
                value={selectedDomain}
                onChange={(value) => setSelectedDomain(value)}
                className="shadow appearance-non w-[180px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  const sanitizedValue = DOMPurify.sanitize(value).replace(/\s/g, ''); // Sanitize and remove spaces
                  setPassword(sanitizedValue); // Remove spaces
                }}
                placeholder="Password"
                className={isRandomPasswordActive ? "shadow appearance-non flex-1 h-12 bg-gray-300" : "shadow appearance-non flex-1 h-12"}
                disabled={isRandomPasswordActive}
              />
              <span className="text-lg text-white">@</span>
              <Button
                type="button"
                onClick={toggleRandomPassword}
                className={`shadow appearance-none w-[180px] h-12 font-bold text-black ${isRandomPasswordActive
                  ? "bg-yellow-300 hover:bg-yellow-400"
                  : "bg-[#ffeeac] hover:bg-yellow-300"
                  }`}
              >
                {isRandomPasswordActive ? "Random Password" : "Random Password"}
              </Button>
            </div>

            <Input
              type="email"
              value={receiveEmail}
              onChange={(e) => {
                const value = e.target.value;
                const sanitizedValue = DOMPurify.sanitize(value).replace(/\s/g, ''); // Sanitize and remove spaces
                setReceiveEmail(sanitizedValue); // Remove spaces
              }}
              placeholder="Email for receiving list"
              className="shadow appearance-non h-12"
            />

            <div className="flex justify-center">
              <Button
                type="submit"
                className={`shadow appearance-non h-11 w-3/4 max-w-xs font-bold text-black ${!receiveEmail || !baseName || !password
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#ffeeac] hover:bg-yellow-300"
                  }`}
                disabled={!receiveEmail || !baseName || !password}
              >
                Create
              </Button>
            </div>
          </form>
        </div>
      </div>
      {isLoading && (
        <LoadingProcessingPage />
      )}
      <FooterAdminNav />
    </div>
  )
}

// Wrap the content component with Suspense
const CreateBulkEmailPage: React.FC = () => (
  <Suspense fallback={<LoadingFallback />}>
    <CreateBulkEmailPageContent />
  </Suspense>
);

export default CreateBulkEmailPage