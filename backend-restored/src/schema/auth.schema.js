import { z } from "zod";

const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email format");

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

const passwordSchema = z
    .string()
    .min(12, "Password must be at least 12 characters long")
    .max(128, "Password must not exceed 128 characters")
    .regex(
        strongPasswordRegex,
        "Password must include uppercase, lowercase, number, and special character"
    );

const usernameSchema = z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must not exceed 30 characters")
    .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers and underscores"
    );

export const registerSchema = z.object({
    body: z.object({
        username: usernameSchema,

        email: emailSchema,

        password: passwordSchema,
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: emailSchema,

        password: passwordSchema,
    }),
});

export const passwordResetRequestSchema = z.object({
    body: z.object({
        email: emailSchema,
    }),
});

export const passwordResetConfirmSchema = z.object({
    body: z.object({
        email: emailSchema,
        otp: z.coerce
            .string()
            .trim()
            .regex(/^\d{6}$/, "OTP must be a 6-digit number"),
        newPassword: passwordSchema,
    }),
});

export const organizerRegisterSchema = registerSchema;

export const adminRegisterSchema = z.object({
    body: z.object({
        username: usernameSchema,
        email: emailSchema,
        password: passwordSchema,
        registrationKey: z.string().min(16),
    }),
});