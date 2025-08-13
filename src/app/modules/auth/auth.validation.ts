import { z } from "zod";

const login = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    phone_number: z.string().optional(),
    password: z.string({ message: "Password is required" }),
  })
  .refine((data) => data.email || data.phone_number, {
    message: "Either email or phone number is required",
    path: ["email"],
  });

const register = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

const resetPassword = z.object({
  token: z.string({ message: "Token is required" }),
  password: z.string({ message: "A new 'Password' is required" }),
});
const changePassword = z.object({
  oldPassword: z.string({ message: "oldpassword is required" }),
  password: z.string({ message: "A new 'Password' is required" }),
});

const sendVerificationEmail = z.object({
  email: z.string({ message: "Email is required String" }).email({ message: "Email is invalid" }),
});
export const authValidation = {
  login,
  register,
  resetPassword,
  changePassword,
  sendVerificationEmail,
};
