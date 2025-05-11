import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "./queryClient";

export type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  location?: string;
  avatarUrl?: string;
  planType?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  email: string;
  location?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/auth/current-user", {
          credentials: "include",
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await res.json();
      setUser(userData);
      toast({
        title: "ログイン成功",
        description: `${userData.name}さん、おかえりなさい！`,
      });
      // スクロール位置をリセットしてからリダイレクト
      window.scrollTo(0, 0);
      setLocation("/");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "ログイン失敗",
        description: "ユーザー名またはパスワードが正しくありません",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      const newUser = await res.json();
      setUser(newUser);
      toast({
        title: "登録成功",
        description: `${newUser.name}さん、ようこそメンタルAIへ！`,
      });
      // スクロール位置をリセットしてからリダイレクト
      window.scrollTo(0, 0);
      setLocation("/");
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "登録失敗",
        description: "アカウント登録中にエラーが発生しました",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      toast({
        title: "ログアウト",
        description: "正常にログアウトしました",
      });
      setLocation("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "ログアウト失敗",
        description: "ログアウト中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // Fixed JSX syntax
  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoading, login, register, logout } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
