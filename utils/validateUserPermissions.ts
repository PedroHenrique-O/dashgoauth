type User = {
  permissions: string[];
  roles: string[];
};
type ValidateUserPermissions = {
  user: User;
  permissions?: string[];
  roles?: string[];
};

export function validateUserPermissions({
  user,
  permissions,
  roles,
}: ValidateUserPermissions) {
  if (permissions?.length > 0) {
    const hasAllPermissions = permissions.every((permissions) => {
      return user.permissions.includes(permissions);
    });

    if (!hasAllPermissions) {
      return false;
    }
  }

  //   if (!isAuthenticated) {
  //     return false;
  //   }
  if (roles?.length > 0) {
    const hasAllRoles = roles.some((role) => {
      return user.roles.includes(role);
    });

    if (!hasAllRoles) {
      return false;
    }
  }

  return true;
}
