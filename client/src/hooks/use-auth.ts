import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        if (response.status === 401) {
          console.log("🔐 User not authenticated");
          return null;
        }
        if (!response.ok) {
          console.error("❌ Error fetching user:", response.status);
          return null;
        }
        const userData = await response.json() as User;
        console.log("✅ User authenticated:", { id: userData.id, email: userData.email, name: userData.name });
        return userData;
      } catch (err) {
        console.error("❌ Error in useAuth:", err);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
  };
}

export async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (response.ok) {
    window.location.href = "/";
  }
}
