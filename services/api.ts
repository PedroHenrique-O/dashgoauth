import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { AuthTokenError } from "../errors/AuthTokenError";
import { signOut } from "../src/context/AuthContext";

let isRefreshing = false;
let failedRequestsQueue: any[] = [];

export function setUpAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);
  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["nextauth.token"]}`,
    },
  });

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        if (error.response.data?.code === "token.expired") {
          cookies = parseCookies(ctx);

          const { "nextauth.refreshtoken": refreshToken } = cookies;

          const originalConfig = error.config;

          if (!isRefreshing) {
            isRefreshing = true;
            api
              .post("/refresh", {
                refreshToken,
              })
              .then((response) => {
                const { token } = response.data;

                setCookie(ctx, "nextauth.token", token, {
                  maxAge: 60 * 60 * 24 * 30, //30 days
                  path: "/",
                });
                setCookie(
                  ctx,
                  "nextauth.refreshtoken",
                  response.data.refreshtoken,
                  {
                    maxAge: 60 * 60 * 24 * 30, //30 days
                    path: "/",
                  }
                );

                api.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${token}`;

                failedRequestsQueue.forEach((req) => req.onSucess(token));
                failedRequestsQueue = [];
              })
              .catch((err) => {
                failedRequestsQueue.forEach((req) => req.onFailure(err));
                failedRequestsQueue = [];

                if (process.browser) {
                  signOut();
                }
              })
              .finally(() => {
                isRefreshing = false;
              });
          }

          return new Promise((resolve, reject) => {
            failedRequestsQueue.push({
              onSucess: (token: string) => {
                if (!originalConfig?.headers) {
                  return;
                }
                originalConfig.headers["Authorization"] = `Bearer ${token}`;

                resolve(api(originalConfig));
              },
              onFailure: (err: AxiosError) => {
                reject(err);
              },
            });
          });
        } else {
          if (process.browser) {
            signOut();
          } else {
            return Promise.reject(new AuthTokenError());
          }
        }
      }
      return Promise.reject(error);
    }
  );
  return api;
}
