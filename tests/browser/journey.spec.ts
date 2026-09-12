import { test, expect } from "@playwright/test";
test("parent request, operator approval, driver boarding, full dropoff and completion", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/parent");
  await expect(
    page.getByRole("heading", { name: "서아의 오늘, 안심으로." }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("박도윤");
  await page
    .getByRole("button", { name: "탑승 장소 변경", exact: true })
    .click();
  await page.getByLabel("변경할 탑승지").selectOption("s4");
  await page.getByRole("button", { name: "요청 보내기" }).click();
  await expect(page.getByText("내 요청 현황")).toBeVisible();
  await expect(page.locator(".child-details")).toContainText("드림빌 아파트");
  const admin = await context.newPage();
  await admin.goto("/admin");
  await expect(
    admin.getByRole("heading", { name: "확인이 필요한 요청 2" }),
  ).toBeVisible();
  await admin
    .getByRole("button", { name: "요청 확인", exact: true })
    .first()
    .click();
  await admin.getByRole("button", { name: "승인하고 반영" }).click();
  await expect(page.locator(".child-details")).toContainText(
    "망원초등학교 정문",
  );
  await admin.getByRole("button", { name: "요청 확인", exact: true }).click();
  await admin.getByRole("button", { name: "승인하고 반영" }).click();
  await admin.getByRole("link", { name: "운전자", exact: true }).click();
  await expect(admin.locator(".driver-main")).toContainText("드림빌 아파트");
  await admin
    .getByRole("button", { name: "현재 정차지 도착", exact: true })
    .click();
  await admin.getByRole("button", { name: "출발 · 다음 정차지로" }).click();
  await expect(admin.getByRole("status")).toContainText(
    "탑승 여부를 확인하지 않은 아동",
  );
  await admin
    .getByRole("button", { name: "탑승 확인", exact: true })
    .first()
    .click();
  await admin
    .getByRole("button", { name: "잘못 눌렀어요 · 정정" })
    .first()
    .click();
  await admin.getByRole("button", { name: "기록 정정", exact: true }).click();
  while (
    await admin.getByRole("button", { name: "탑승 확인", exact: true }).count()
  )
    await admin
      .getByRole("button", { name: "탑승 확인", exact: true })
      .first()
      .click();
  await admin.getByRole("button", { name: "출발 · 다음 정차지로" }).click();
  await admin
    .getByRole("button", { name: "현재 정차지 도착", exact: true })
    .click();
  while (
    await admin.getByRole("button", { name: "탑승 확인", exact: true }).count()
  )
    await admin
      .getByRole("button", { name: "탑승 확인", exact: true })
      .first()
      .click();
  await expect(page.locator(".parent-hero")).toContainText(
    "서아가 안전하게 탑승했어요.",
  );
  await admin.getByRole("button", { name: "출발 · 다음 정차지로" }).click();
  await admin.getByRole("button", { name: "센터 도착", exact: true }).click();
  await admin
    .getByRole("button", { name: "하차 확인 완료 · 운행 종료" })
    .click();
  await expect(admin.getByRole("status")).toContainText(
    "모든 아동의 탑승 결과와 하차",
  );
  while (
    await admin.getByRole("button", { name: "안전하게 하차했어요" }).count()
  )
    await admin
      .getByRole("button", { name: "안전하게 하차했어요" })
      .first()
      .click();
  await admin
    .getByRole("button", { name: "하차 확인 완료 · 운행 종료" })
    .click();
  await expect(
    admin.getByRole("heading", { name: "오늘도 안전하게 도착했어요." }),
  ).toBeVisible();
  await expect(page.locator(".parent-hero")).toContainText(
    "오늘의 이동을 마쳤어요.",
  );
  await expect(page.locator(".parent-map")).toContainText("위치 공유 종료");
  await page.reload();
  await expect(page.locator(".parent-hero")).toContainText(
    "오늘의 이동을 마쳤어요.",
  );
  expect(errors).toEqual([]);
});
test("mobile pages fit screen and render key actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/admin",
    "/parent",
    "/driver",
    "/admin/routes",
    "/admin/students",
    "/admin/history",
    "/admin/settings",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      route,
    ).toBe(true);
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  }
});
test("route editing and roster registration preserve active trip and search works", async ({
  page,
}) => {
  await page.goto("/admin/routes");
  await page.getByRole("button", { name: "노선 편집", exact: true }).click();
  await page
    .getByLabel("정차지 1 이름", { exact: true })
    .fill("새로운 출발 정차지");
  await page.getByRole("button", { name: "기본 노선 저장" }).click();
  await expect(page.locator(".builder-stops")).toContainText(
    "새로운 출발 정차지",
  );
  await page.goto("/driver");
  await expect(page.locator(".metro-timeline")).toContainText(
    "망원역 2번 출구",
  );
  await page.goto("/admin/students");
  await page.getByRole("button", { name: "원생 등록", exact: true }).click();
  await page.getByLabel("원생 이름").fill("테스트아동");
  await page.getByLabel("보호자 이름").fill("테스트보호자");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "원생 등록" })
    .click();
  await page.getByLabel("원생 또는 보호자 검색").fill("테스트아동");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("다음 운행부터 배정");
});
test("GPS failure state is honest and event CSV downloads", async ({
  page,
}) => {
  await page.goto("/admin/settings");
  await page.getByRole("switch", { name: "위치 수신 중단 시뮬레이션" }).click();
  await page.goto("/parent");
  await expect(page.locator(".parent-hero")).toContainText(
    "위치를 확인하고 있어요.",
  );
  await expect(page.locator(".parent-map")).toContainText("위치 수신이 중단");
  await page.goto("/admin/history");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "기록 내보내기" }).click();
  expect((await download).suggestedFilename()).toContain("운행기록");
});
