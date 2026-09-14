import { expect, test } from "@playwright/test";

test("the app boots and /api/healthz returns 200", async ({ page, request }) => {
  const response = await request.get("/api/healthz");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("ok");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /first 90/i })).toBeVisible();
});
