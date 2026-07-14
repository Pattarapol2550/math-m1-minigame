import { test, expect, request } from "@playwright/test";

// These guard the fixes from the security pass: game APIs must require auth,
// and the questions API must never leak the correct answer to the client.

test.describe("API auth guards (unauthenticated)", () => {
  test("GET /api/game/stages requires auth", async ({ request }) => {
    const res = await request.get("/api/game/stages");
    expect(res.status()).toBe(401);
  });

  test("GET /api/game/stages/*/questions requires auth", async ({ request }) => {
    const res = await request.get("/api/game/stages/s1-compare/questions");
    expect(res.status()).toBe(401);
  });

  test("POST /api/game/answer requires auth", async ({ request }) => {
    const res = await request.post("/api/game/answer", {
      data: { questionId: "x", answer: "y" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/game/session requires auth", async ({ request }) => {
    const res = await request.post("/api/game/session", {
      data: { stageId: "x", attempts: [] },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/leaderboard requires auth", async ({ request }) => {
    const res = await request.get("/api/leaderboard");
    expect(res.status()).toBe(401);
  });

  test("teacher-only endpoints reject non-teachers", async ({ request }) => {
    const res = await request.get("/api/teacher/password-logs");
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("answer leakage", () => {
  test("authenticated questions response never contains the answer or hint", async ({ page, request }) => {
    await page.goto("/login");
    await page.getByPlaceholder("เลขประจำตัวนักเรียน").fill("student1");
    await page.getByPlaceholder("••••••").fill("student123");
    await page.getByRole("button", { name: /เริ่มผจญภัย/ }).click();
    await page.waitForURL(url => !url.pathname.startsWith("/login"));

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    const res = await request.get("/api/game/stages/s1-compare/questions", {
      headers: { Cookie: cookieHeader },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).not.toContain('"answer"');
    expect(body).not.toContain('"hint"');
  });
});
