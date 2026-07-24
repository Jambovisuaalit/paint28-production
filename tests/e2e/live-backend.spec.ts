import { expect, test } from "@playwright/test";

const LIVE_BACKEND_ENABLED = process.env.E2E_LIVE_BACKEND === "true";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const EDGE_FUNCTION_NAME =
  process.env.VITE_EDGE_FUNCTION_NAME ?? "submit-quote";
const ORIGIN = process.env.E2E_ORIGIN ?? "http://localhost:5173";

const ONE_PIXEL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EB//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EB//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EB//2Q==",
  "base64",
);

function requireLiveEnvironment(): void {
  const missing = [
    !SUPABASE_URL && "VITE_SUPABASE_URL",
    !SUPABASE_PUBLISHABLE_KEY && "VITE_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Live backend E2E configuration is missing: ${missing.join(", ")}`);
  }
}

function multipart(overrides: Record<string, string>) {
  return {
    customerName: "Playwright Backend QA",
    email: "paint28-backend-e2e@example.com",
    phone: "0401234567",
    licensePlate: "ABC-123",
    damageDescription: "Playwright tarkistaa palvelinpuolen validoinnin.",
    preferredContactMethod: "phone",
    privacyConsent: "true",
    website: "",
    images: {
      name: "damage.jpg",
      mimeType: "image/jpeg",
      buffer: ONE_PIXEL_JPEG,
    },
    ...overrides,
  };
}

test.describe("Paint28 live Edge Function validation", () => {
  test.skip(
    !LIVE_BACKEND_ENABLED,
    "Set E2E_LIVE_BACKEND=true to call the deployed Supabase Edge Function.",
  );

  test.beforeAll(() => requireLiveEnvironment());

  test("rejects a malformed Finnish phone number", async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          Origin: ORIGIN,
        },
        multipart: multipart({ phone: "not-a-phone" }),
      },
    );

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Kirjoita suomalainen puhelinnumero.",
    });
  });

  test("rejects a malformed Finnish registration plate", async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          Origin: ORIGIN,
        },
        multipart: multipart({ licensePlate: "INVALID" }),
      },
    );

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Kirjoita suomalainen rekisteritunnus, esimerkiksi ABC-123.",
    });
  });
});
