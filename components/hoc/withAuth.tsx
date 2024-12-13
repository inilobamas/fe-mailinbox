import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";
import LoadingPage from "../Loading";

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthenticatedComponent: React.FC = (props) => {
    const { token, setEmail, setRoleId } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkToken = async () => {
        if (!token) {
          router.replace("/");
          return;
        }

        try {
          console.log("Checking token...");
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
        } catch (error) {
          console.error("Token validation failed:", error);
          router.replace("/");
        } finally {
          setIsLoading(false);
        }
      };

      checkToken();
    }, [token, setEmail, setRoleId, router]);

    if (isLoading) {
      return <LoadingPage />;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;