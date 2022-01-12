import router, { useRouter } from "next/router";
import React, { createContext, ReactNode, useEffect, useState } from "react";

import { setCookie, parseCookies, destroyCookie } from "nookies";

import { setUpAPIClient } from "../../services/api";
import { api } from "../../services/apiClient";
import Router from "next/router";

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
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  user: User | undefined;
  isAuthenticated: boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

let authChannels: BroadcastChannel;

export const signOut = () => {
  destroyCookie(undefined, "nextauth.refreshtoken");
  destroyCookie(undefined, "nextauth.token");

  //const authChannels = new BroadcastChannel("auth");

  authChannels.postMessage("signOut");

  router.push("/");
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;
  const router = useRouter();

  useEffect(() => {
    authChannels = new BroadcastChannel("auth");
    authChannels.onmessage = (message) => {
      switch (message.data) {
        case "signOut":
          signOut();
          break;

        // case "signIn":
        //   Router.push("/dashboard");
        //   break;

        default:
          break;
      }
    };
  }, []);

  useEffect(() => {
    const { "nextauth.token": token } = parseCookies();
    if (token) {
      api

        .get("/me")
        .then((response) => {
          const { email, permissions, roles } = response.data;
          setUser({ email, permissions, roles });
        })
        .catch(() => {
          signOut();
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
    api.defaults.headers["Authorization"] = ` Bearer ${token}`;

    router.push("/dashboard");
    console.log(response.data);

    // authChannels.postMessage("signIn");
  }

  return (
    <AuthContext.Provider value={{ user, signOut, signIn, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
