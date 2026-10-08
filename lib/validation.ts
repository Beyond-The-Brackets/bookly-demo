import { z } from "zod";

const phonePattern = /^\+?[0-9 ().-]{7,20}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const bookingRequestSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Invalid booking page"),
  serviceId: z.string().uuid("Choose a service"),
  startsAt: z.string().datetime({ offset: true, message: "Choose a time" }),
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  phone: z
    .string()
    .trim()
    .regex(phonePattern, "Enter a valid phone number")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(500).optional(),
});

export const bookingIdSchema = z.string().uuid();

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(300).optional(),
  durationMinutes: z.coerce.number().int().min(10).max(480),
  price: z.coerce.number().min(0).max(10_000),
});

export const availabilitySchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(timePattern, "Use HH:MM"),
    endTime: z.string().regex(timePattern, "Use HH:MM"),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name").max(80),
  profession: z.string().trim().max(60).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}
