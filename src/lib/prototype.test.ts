import { describe, expect, it } from "bun:test";
import { prototypeRequestSchema } from "./prototype";

describe("prototype input limits", () => {
  it("accepts a 500-character prompt and rejects 501 characters", () => {
    expect(prototypeRequestSchema.safeParse({ prompt: "a".repeat(500) }).success).toBe(true);
    expect(prototypeRequestSchema.safeParse({ prompt: "a".repeat(501) }).success).toBe(false);
  });
  it("limits refinement requests to 500 characters", () => {
    expect(prototypeRequestSchema.safeParse({ prompt: "Salon website", html: "<html></html>", refinement: "a".repeat(501) }).success).toBe(false);
  });
});