import { expect, test, type Page } from "@playwright/test";

const QUOTE_REFERENCE = "11111111-2222-4333-8444-555555555555";
const ONE_PIXEL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EB//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EB//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EB//2Q==",
  "base64",
);

const TEST_IMAGES = [
  {
    name: "paint28-damage-1.jpg",
    mimeType: "image/jpeg",
    buffer: ONE_PIXEL_JPEG,
  },
  {
    name: "paint28-damage-2.jpg",
    mimeType: "image/jpeg",
    buffer: ONE_PIXEL_JPEG,
  },
] as const;

async function openQuoteForm(page: Page): Promise<void> {
  await page.goto("/#quote", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Lähetä vauriosta 1–3 kuvaa." }),
  ).toBeVisible();
}

async function fillRequiredFields(page: Page): Promise<void> {
  const form = page.locator("form.quote-form");
  await form.getByLabel("Nimi").fill("Playwright QA");
  await form.getByLabel("Rekisterinumero").fill("ABC123");
  await form.getByLabel("Puhelin").fill("040 123 4567");
  await form.getByLabel("Sähköposti").fill("paint28-e2e@example.com");
  await form
    .getByLabel("Vauriokuvaus")
    .fill("Oikean takaoven lommo ja maalipinnan naarmu.");
}

test.describe("Paint28 public quote flow", () => {
  test("Successful Quote Submission", async ({ page }) => {
    await page.route("**/functions/v1/submit-quote", async (route) => {
      expect(route.request().method()).toBe("POST");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Tarjouspyyntö vastaanotettu.",
          reference: QUOTE_REFERENCE,
        }),
      });
    });

    await openQuoteForm(page);
    await fillRequiredFields(page);

    const form = page.locator("form.quote-form");
    await page.locator("#damage-images").setInputFiles([...TEST_IMAGES]);
    await expect(form.locator(".preview-grid figure")).toHaveCount(2);
    await form.getByRole("checkbox").check();

    await form
      .getByRole("button", { name: "Lähetä tarjouspyyntö" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Tarjouspyyntö vastaanotettu" }),
    ).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText(`Viite: ${QUOTE_REFERENCE}`)).toBeVisible();
  });

  test("Validation Failures: privacy consent", async ({ page }) => {
    await openQuoteForm(page);
    await fillRequiredFields(page);

    const form = page.locator("form.quote-form");
    await page.locator("#damage-images").setInputFiles(TEST_IMAGES[0]);
    await expect(form.getByRole("checkbox")).not.toBeChecked();

    await form
      .getByRole("button", { name: "Lähetä tarjouspyyntö" })
      .click();

    await expect(form.getByRole("alert")).toContainText(
      "Tietosuostumus vaaditaan tarjouspyynnön lähettämiseen.",
    );
  });

  test("Validation Failures: zero images", async ({ page }) => {
    await openQuoteForm(page);
    await fillRequiredFields(page);

    const form = page.locator("form.quote-form");
    await form.getByRole("checkbox").check();
    await form
      .getByRole("button", { name: "Lähetä tarjouspyyntö" })
      .click();

    await expect(form.getByRole("alert")).toContainText(
      "Lisää 1–3 kuvaa vauriosta.",
    );
  });

  test("Validation Failures: invalid PDF", async ({ page }) => {
    await openQuoteForm(page);

    const form = page.locator("form.quote-form");
    const input = page.locator("#damage-images");
    await input.setInputFiles({
      name: "damage-report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\nPaint28 invalid fixture\n"),
    });

    await expect(form.getByRole("alert")).toContainText(
      "Sallittu kuvamuoto on JPG, PNG tai HEIC.",
    );
    await expect(input).toHaveValue("");
  });

  test("mobile sticky CTA remains visible without horizontal overflow", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-only assertion");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const actions = page.getByLabel("Pikatoiminnot");
    await expect(actions).toBeVisible();
    await expect(actions.getByRole("link", { name: "Soita" })).toHaveAttribute(
      "href",
      "tel:+358405743094",
    );
    await expect(
      actions.getByRole("link", { name: "Pyydä arvio" }),
    ).toHaveAttribute("href", "#quote");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
