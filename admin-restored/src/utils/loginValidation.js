export const validateLoginForm = (form) => {
  const email = String(form?.email ?? "").trim();
  const password = String(form?.password ?? "").trim();

  if (!email && !password) return "Email and password are required";
  if (!email) return "Email is required";
  if (!password) return "Password is required";
  return "";
};
