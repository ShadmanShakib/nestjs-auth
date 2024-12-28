export const validateEmail = (email: string): boolean => {
  const isValid = email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
  if (isValid !== null) return true;
  return false;
};

export const UserRoles = {
  HOMEOWNER: 1,
  CONTRACTOR: 2,
  PROPERTY_MANAGER: 3,
  SOLE_TRADER: 4,
  SUPPLIERS: 5,
  STAFF_TECHNICIAN: 6,
  TENANT: 7,
  ADMIN: 8,
  AI_ASSISTANT: 9,
};
