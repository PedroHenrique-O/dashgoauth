import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue = [];

export const api = axios.create({
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
        cookies = parseCookies();

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

              setCookie(undefined, "nextauth.token", token, {
                maxAge: 60 * 60 * 24 * 30, //30 days
                path: "/",
              });
              setCookie(
                undefined,
                "nextauth.refreshtoken",
                response.data.refreshtoken,
                {
                  maxAge: 60 * 60 * 24 * 30, //30 days
                  path: "/",
                }
              );

              api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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
            onFailure: () => {},
          });
        });
      } else {
        //
      }
    }
  }
);
