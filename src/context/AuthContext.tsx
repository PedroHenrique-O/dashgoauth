import { useRouter } from "next/router";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../../services/api";
import { setCookie, parseCookies } from "nookies";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  user: User | undefined;
  isAuthenticated: boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    const { "nextauth.token": token } = parseCookies();
    if (token) {
      api.get("/me").then((response) => {
        const { email, permissions, roles } = response.data;
        setUser({ email, permissions, roles });
      });
    }
  }, []);

  async function signIn({ email, password }: SignInCredentials) {
    const response = await api.post("/sessions", {
      email,
      password,
    });
    const { permissions, roles, token, refreshToken } = response.data;
    setUser({
      email,
      permissions,
      roles,
    });

    setCookie(undefined, "nextauth.token", token, {
      maxAge: 60 * 60 * 24 * 30, //30 days
      path: "/",
    });
    setCookie(undefined, "nextauth.refreshtoken", refreshToken, {
      maxAge: 60 * 60 * 24 * 30, //30 days
      path: "/",
    });
    console.log("token: ", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    router.push("/dashboard");
    console.log(response.data);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
