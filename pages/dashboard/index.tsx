import { redirect } from "next/dist/server/api-utils";
import { destroyCookie } from "nookies";
import { useContext, useEffect } from "react";
import { Can } from "../../component/can";
import { AuthTokenError } from "../../errors/AuthTokenError";
import { useCan } from "../../hooks/useCan";
import { setUpAPIClient } from "../../services/api";
import { api } from "../../services/apiClient";

import { AuthContext } from "../../src/context/AuthContext";
import { withSSRAuth } from "../../utils/withSSRAuth";

export default function Dashboard() {
  const { user, signOut } = useContext(AuthContext);

  const useCanSeeMetrics = useCan({
    permissions: ["metrics.list"],
  });

  useEffect(() => {
    api
      .get("/me")
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <h1> Dashboard: {user?.email} </h1>
      <button onClick={signOut}> Sign out </button>

      <Can permissions={["metrics.list"]}>
        <div> Métricas</div>
      </Can>
    </>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setUpAPIClient(ctx);

  const response = await apiClient.get("/me");
  // try {
  // } catch (err) {
  //   destroyCookie(ctx, "nextauth.token");
  //   destroyCookie(ctx, "nextauth.refreshtoken");
  //   return {
  //     redirect: {
  //       destination: "/",
  //       permanent: false,
  //     },
  //   };
  // }

  return {
    props: {},
  };
});
