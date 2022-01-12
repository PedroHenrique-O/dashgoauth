import { useContext } from "react";
import { AuthContext } from "../src/context/AuthContext";
import { validateUserPermissions } from "../utils/validateUserPermissions";

interface useCanParams {
  permissions?: string[];
  roles?: string[];
}

export function useCan({ permissions, roles }: useCanParams) {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return false;
  }

  const userhasValidPermissions = validateUserPermissions({
    user,
    permissions,
    roles,
  });

  return userhasValidPermissions;
}
