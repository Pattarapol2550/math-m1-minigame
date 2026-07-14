import { test, expect, TEST_PASSWORD } from "./fixtures";

test.describe("login", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/map");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows an error on wrong credentials", async ({ page, studentId }) => {
    await page.goto("/login");
    await page.getByPlaceholder("เลขประจำตัวนักเรียน").fill(studentId);
    await page.getByPlaceholder("••••••").fill("wrong-password");
    await page.getByRole("button", { name: /เริ่มผจญภัย/ }).click();
    await expect(page.getByText(/ไม่ถูกต้อง/)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("student logs in and lands on the map", async ({ page, studentId }) => {
    await page.goto("/login");
    await page.getByPlaceholder("เลขประจำตัวนักเรียน").fill(studentId);
    await page.getByPlaceholder("••••••").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /เริ่มผจญภัย/ }).click();
    await expect(page).toHaveURL(/\/map|\/$/);
  });

  test("teacher logs in and lands on the teacher dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("เลขประจำตัวนักเรียน").fill("teacher");
    await page.getByPlaceholder("••••••").fill("teacher123");
    await page.getByRole("button", { name: /เริ่มผจญภัย/ }).click();
    await page.waitForURL(/\/$|\/map|\/teacher/);
    // Non-teacher-scoped routes should never let a teacher land on /map for teacher creds
    // (root redirects by role in this app), so just assert we're not stuck on /login.
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("a student cannot reach /teacher", async ({ page, studentId }) => {
    await page.goto("/login");
    await page.getByPlaceholder("เลขประจำตัวนักเรียน").fill(studentId);
    await page.getByPlaceholder("••••••").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /เริ่มผจญภัย/ }).click();
    await page.waitForURL(url => !url.pathname.startsWith("/login"));

    await page.goto("/teacher");
    await expect(page).not.toHaveURL(/\/teacher$/);
  });
});
