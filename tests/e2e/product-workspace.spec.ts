import { expect, test } from "@playwright/test";

test("the product page opens the interactive synthetic repository demo", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") pageErrors.push(message.text()); });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Understand the architecture behind your code." })).toBeVisible();
  await page.getByRole("link", { name: "Explore a demo repository" }).click();

  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("heading", { name: "harbor", exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "harbor dependency map" })).toBeVisible();

  const map = page.getByRole("group", { name: "harbor dependency map" });
  const targetNode = map.getByRole("button", { name: "src/errors.ts, File" });
  await targetNode.focus();
  await targetNode.press("Enter");
  await expect(targetNode).toHaveAttribute("aria-pressed", "true");
  expect(pageErrors).toEqual([]);
});

test("the architecture graph responds to keyboard input and detail level changes", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/architecture");
  const graph = page.getByRole("region", { name: "Interactive architecture graph" });
  await expect(graph).toBeVisible();
  const canvas = graph.locator('canvas[aria-label^="Dependency graph"]');
  await canvas.focus();
  await page.keyboard.press("Home");
  await expect(graph.getByText("Outgoing", { exact: true })).toBeVisible();

  await graph.getByLabel("Graph detail").selectOption("symbols");
  await expect(canvas).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("the public navigation stays usable on a narrow screen", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Open menu" }).click();
  const navigation = page.getByRole("navigation", { name: "Product" }).last();
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "Features" }).click();
  await expect(page).toHaveURL(/#features$/);
  expect(consoleErrors).toEqual([]);
});

test("analysis API enforces same-origin and authentication before queue access", async ({ request, baseURL }) => {
  const crossOrigin = await request.post("/api/github/analyses", {
    headers: { origin: "https://attacker.example" },
    data: { repositoryId: 42 },
  });
  expect(crossOrigin.status()).toBe(403);

  const unauthenticated = await request.post("/api/github/analyses", {
    headers: { origin: new URL(baseURL!).origin },
    data: { repositoryId: 42 },
  });
  expect(unauthenticated.status()).toBe(401);
});

test("liveness endpoint responds without disclosing provider configuration", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ok", service: "codedna" });
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("capture portfolio screenshots of the synthetic workspace", async ({ page }) => {
  const { mkdirSync } = await import("node:fs");
  mkdirSync("docs/screenshots", { recursive: true });
  const captures = [
    ["/workspace", "overview.png", /harbor/i],
    ["/architecture", "architecture-map.png", "Architecture Map"],
    ["/impact", "change-impact.png", "Change Impact"],
    ["/history", "commit-history.png", "Trace how your codebase changes"],
  ] as const;
  const consoleErrors: string[] = [];

  for (const [path, filename, heading] of captures) {
    const capturePage = await page.context().newPage();
    capturePage.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await capturePage.goto(path);
    await expect(capturePage.getByRole("heading", { name: heading }).first()).toBeVisible();
    if (path === "/architecture") await capturePage.waitForTimeout(300);
    await capturePage.evaluate(() => window.scrollTo(0, 0));
    await capturePage.screenshot({ path: `docs/screenshots/${filename}`, fullPage: true, caret: "initial" });
    await capturePage.close();
  }
  expect(consoleErrors).toEqual([]);
});
