import { useContext, useEffect } from "react";
import { api } from "../../services/api";
import { AuthContext } from "../../src/context/AuthContext";

export default function DashBoar() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get("/me").then((response) => console.log(response));
  }, []);

  return <h1> Dashboard: {user?.email} </h1>;
}
