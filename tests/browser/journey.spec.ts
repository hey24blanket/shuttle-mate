import { test, expect } from "@playwright/test";
test("parent request syncs across tabs, admin approves, driver completes all children", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "학부모 화면 체험하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "이서아의 오늘 셔틀" }),
  ).toBeVisible();
  await expect(page.getByText("김민준", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "탑승 장소 변경", exact: true })
    .click();
  await page.getByLabel("변경할 탑승 장소").selectOption("s4");
  await page.getByLabel("전달할 내용 (선택)").fill("오늘은 망원초에서 탈게요.");
  await page.getByRole("button", { name: "요청 보내기" }).click();
  await expect(page.getByText("확인 대기", { exact: true })).toBeVisible();
  const admin = await context.newPage();
  await admin.goto("/");
  await admin.getByRole("button", { name: "운영자 대시보드 둘러보기" }).click();
  await expect(admin.getByText("오늘은 망원초에서 탈게요.")).toBeVisible();
  await admin.getByRole("button", { name: "확인·승인" }).click();
  await expect(page.getByText("승인 완료", { exact: true })).toBeVisible();
  await expect(page.locator(".pickup-summary")).toContainText(
    "망원초등학교 정문",
  );
  await admin.screenshot({
    path: "../../outputs/shuttle-admin-verified.png",
    fullPage: true,
  });
  await admin.getByRole("button", { name: "운전자", exact: true }).click();
  await admin.getByRole("button", { name: "운행 시작", exact: true }).click();
  for (let stop = 0; stop < 5; stop++) {
    await admin
      .getByRole("button", {
        name: stop === 4 ? "센터 도착" : "현재 정차지 도착",
        exact: true,
      })
      .click();
    await expect(admin.locator(".boarding-list")).toBeAttached();
    if (stop === 4) {
      const drop = admin.getByRole("button", {
        name: "하차 확인",
        exact: true,
      });
      for (let remaining = await drop.count(); remaining > 0; remaining--) {
        await drop.first().click();
        await expect(drop).toHaveCount(remaining - 1);
      }
      admin.once("dialog", (d) => d.accept());
      await admin
        .getByRole("button", { name: "확인 완료 · 운행 마치기" })
        .click();
    } else {
      const board = admin.getByRole("button", { name: "탑승", exact: true });
      if (stop === 1) {
        await admin.getByRole("button", { name: "출발 · 다음 정차지" }).click();
        await expect(admin.locator('.error-box[role="alert"]')).toContainText(
          "모두 확인",
        );
      }
      for (let remaining = await board.count(); remaining > 0; remaining--) {
        await board.first().click();
        await expect(board).toHaveCount(remaining - 1);
      }
      await admin.getByRole("button", { name: "출발 · 다음 정차지" }).click();
    }
  }
  await expect(
    admin.getByText("오늘도 수고하셨습니다. 운행 기록이 저장되었어요."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "센터에 안전하게 도착했어요." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "센터에 안전하게 도착했어요." }),
  ).toBeVisible();
  await admin.getByRole("button", { name: "운영자", exact: true }).click();
  await admin.getByRole("link", { name: "운행 기록", exact: true }).click();
  const file = admin.waitForEvent("download");
  await admin.getByRole("button", { name: "기록 내려받기" }).click();
  expect((await file).suggestedFilename()).toMatch(/shuttle-mate-.+\.csv/);
  expect(errors).toEqual([]);
});
test("mobile views fit and route editing does not mutate an existing trip", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "학부모 화면 체험하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "이서아의 오늘 셔틀" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../outputs/shuttle-parent-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "운전자", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "운행 시작", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../outputs/shuttle-driver-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "운영자", exact: true }).click();
  await page.goto("/admin/routes");
  await page.getByLabel("1번 정차지 이름", { exact: true }).fill("새 출발지");
  await page.getByRole("button", { name: "기본 노선 저장" }).click();
  await page.goto("/admin");
  await expect(
    page.getByText("망원역 2번 출구", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("새 출발지", { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/admin/students");
  await expect(page.getByLabel("1번 원생 이름", { exact: true })).toHaveValue(
    "김민준",
  );
});
test("production endpoints fail closed without credentials", async ({
  request,
}) => {
  const r = await request.get("/api/state");
  expect(r.status()).toBe(401);
  expect(JSON.stringify(await r.json())).not.toContain("private_key");
  const p = await request.post("/api/state", {
    data: {
      command: { type: "START", tripId: "x" },
      revision: 0,
      eventId: "fake",
    },
  });
  expect(p.status()).toBeGreaterThanOrEqual(400);
});
