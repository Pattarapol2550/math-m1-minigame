import { test, expect, TEST_PASSWORD } from "./fixtures";

async function loginAs(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("เลขประจำตัวนักเรียน").fill(username);
  await page.getByPlaceholder("••••••").fill(password);
  await page.getByRole("button", { name: /เริ่มผจญภัย/ }).click();
  await page.waitForURL(url => !url.pathname.startsWith("/login"));
}

test.describe("game flow", () => {
  test("map lists stages and battle loads a question", async ({ page, studentId }) => {
    await loginAs(page, studentId, TEST_PASSWORD);
    await page.goto("/map");
    await expect(page.getByText("เลือกด่าน")).toBeVisible();

    const firstStage = page.locator("button", { hasText: "ด่าน 1" }).first();
    await expect(firstStage).toBeVisible({ timeout: 10_000 });
    await firstStage.click();

    await page.waitForURL(/\/battle\//);
    // Battle intro/question should render within a few seconds.
    await expect(page.locator("body")).toContainText(/ปรากฏตัว|ข้อ 1/, { timeout: 10_000 });
  });

  test("client cannot self-report a score — server recomputes it", async ({ page, request, studentId }) => {
    await loginAs(page, studentId, TEST_PASSWORD);

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    // Grab a real question id via the authenticated questions endpoint.
    const qRes = await request.get("/api/game/stages/s1-compare/questions", {
      headers: { Cookie: cookieHeader },
    });
    const questions = await qRes.json();
    const q = questions[0];
    const anyChoice = q.data.choices[0];

    // Claim a huge score with a bogus/negative timeSpent — server must ignore it
    // and grade from scratch, never trusting client-supplied score/correct/passed.
    const sessionRes = await request.post("/api/game/session", {
      headers: { Cookie: cookieHeader },
      data: {
        stageId: "s1-compare",
        attempts: [{ questionId: q.id, answer: anyChoice, timeSpent: -99999 }],
      },
    });
    expect(sessionRes.ok()).toBeTruthy();
    const body = await sessionRes.json();

    // Negative timeSpent is clamped to TIMER_SECS (100s), so a "correct" answer
    // only ever scores the floor value (10), never the huge score a cheater wants.
    expect([0, 10]).toContain(body.score);
    expect(typeof body.passed).toBe("boolean");
  });

  test("navigating directly between two stages resets battle state (no stale flash)", async ({ page, request, studentId }) => {
    await loginAs(page, studentId, TEST_PASSWORD);

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    const stagesRes = await request.get("/api/game/stages", { headers: { Cookie: cookieHeader } });
    const categories = await stagesRes.json();
    const stages = categories[0].stages;

    await page.goto(`/battle/${stages[0].id}`);
    await expect(page.locator("body")).toContainText(/ปรากฏตัว|ข้อ 1/, { timeout: 10_000 });

    // Client-side nav to a different stage — this is the scenario that used to
    // flash the previous stage's sprite/background before resetting (fixed by
    // remounting the battle page via key={stageId}).
    await page.goto(`/battle/${stages[1].id}`);
    await expect(page).toHaveURL(new RegExp(stages[1].id));
    await expect(page.locator("body")).toContainText(/ปรากฏตัว|ข้อ 1/, { timeout: 10_000 });
    // HP must be back to full (5) for the new stage, not carried over.
    await expect(page.locator("body")).toContainText("5/5");
  });
});
