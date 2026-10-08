import { describe, expect, it } from "vitest";

import { availabilitySchema, bookingRequestSchema, serviceSchema } from "./validation";

const valid = {
  slug: "demo-coach",
  serviceId: "a0000000-0000-4000-8000-000000000002",
  startsAt: "2024-05-06T14:00:00.000Z",
  name: "Jordan Lee",
  email: "  Jordan.Lee@Example.com ",
  phone: "+1 555-0101",
};

describe("bookingRequestSchema", () => {
  it("accepts and normalizes a valid booking", () => {
    const result = bookingRequestSchema.parse(valid);
    expect(result.email).toBe("jordan.lee@example.com");
    expect(result.phone).toBe("+1 555-0101");
  });

  it("treats an empty phone as missing", () => {
    expect(bookingRequestSchema.parse({ ...valid, phone: "" }).phone).toBeUndefined();
  });

  it("rejects invalid input", () => {
    expect(bookingRequestSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...valid, serviceId: "1" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...valid, startsAt: "tomorrow" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...valid, slug: "../admin" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...valid, name: "J" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...valid, notes: "x".repeat(501) }).success).toBe(false);
  });
});

describe("dashboard forms", () => {
  it("coerces service fields from form data", () => {
    expect(serviceSchema.parse({ name: "Coaching", durationMinutes: "60", price: "90" })).toMatchObject({
      durationMinutes: 60,
      price: 90,
    });
    expect(serviceSchema.safeParse({ name: "Coaching", durationMinutes: "5", price: "90" }).success).toBe(false);
  });

  it("requires availability to end after it starts", () => {
    expect(availabilitySchema.safeParse({ weekday: "1", startTime: "09:00", endTime: "12:00" }).success).toBe(true);
    expect(availabilitySchema.safeParse({ weekday: "1", startTime: "12:00", endTime: "09:00" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ weekday: "7", startTime: "09:00", endTime: "12:00" }).success).toBe(false);
  });
});
