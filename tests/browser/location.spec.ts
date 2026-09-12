import { test, expect } from "@playwright/test";
test("real geolocation updates the map across roles and stop clears saved coordinates", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 37.5665,
    longitude: 126.978,
    accuracy: 12,
  });
  await page.goto("/driver");
  await page.getByRole("button", { name: "내 위치 추적 시작" }).click();
  await expect(page.getByTestId("live-coordinates")).toContainText(
    "37.566500, 126.978000",
  );
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await context.setGeolocation({
    latitude: 37.567,
    longitude: 126.979,
    accuracy: 8,
  });
  await expect(page.getByTestId("live-coordinates")).toContainText(
    "37.567000, 126.979000",
  );
  await page.getByRole("link", { name: "학부모", exact: true }).click();
  await expect(page.getByTestId("live-coordinates")).toContainText("37.567000");
  await context.setGeolocation({
    latitude: 37.568,
    longitude: 126.98,
    accuracy: 10,
  });
  await expect(page.getByTestId("live-coordinates")).toContainText("37.568000");
  await page.getByRole("link", { name: "운영자", exact: true }).click();
  await expect(page.getByTestId("live-coordinates")).toContainText("37.568000");
  await page.getByRole("button", { name: "추적 중지", exact: true }).click();
  await expect(page.getByTestId("live-coordinates")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("shuttle-mate-location-v1")!).fix,
    ),
  ).toBeNull();
  await context.setGeolocation({
    latitude: 37.57,
    longitude: 126.99,
    accuracy: 5,
  });
  await expect(page.getByTestId("live-coordinates")).toHaveCount(0);
});
test("denied location has actionable feedback and never displays a fake position", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "geolocation", {
      value: {
        watchPosition: (_s: unknown, error: (e: { code: number }) => void) => {
          setTimeout(() => error({ code: 1 }), 30);
          return 77;
        },
        clearWatch: () => {},
      },
    }),
  );
  await page.goto("/driver");
  await page.getByRole("button", { name: "내 위치 추적 시작" }).click();
  await expect(page.locator(".location-controls [role=status]")).toContainText(
    "위치 권한이 꺼져",
  );
  await expect(page.locator(".location-warning").first()).toContainText(
    "위치 권한",
  );
  await expect(page.getByTestId("live-coordinates")).toHaveCount(0);
});
test("trip completion and reset stop the GPS source", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 35.1796,
    longitude: 129.0756,
    accuracy: 10,
  });
  await page.goto("/driver");
  await page.getByRole("button", { name: "내 위치 추적 시작" }).click();
  await expect(page.getByTestId("live-coordinates")).toBeVisible();
  await page.evaluate(() => {
    const raw = localStorage.getItem("shuttle-mate-prototype-v1");
    const state = raw ? JSON.parse(raw) : null;
    if (!state) throw Error("missing trip");
    state.trip.status = "COMPLETED";
    const next = JSON.stringify(state);
    localStorage.setItem("shuttle-mate-prototype-v1", next);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "shuttle-mate-prototype-v1",
        newValue: next,
      }),
    );
  });
  await expect(page.locator(".location-sharing")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("shuttle-mate-location-v1")!).fix,
    ),
  ).toBeNull();
  await expect(
    page.getByRole("button", { name: "내 위치 추적 시작" }),
  ).toBeDisabled();
});
test("stale fixes are labelled and mobile map fits the screen", async ({
  page,
  context,
}) => {
  await page.clock.install();
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 37.5665,
    longitude: 126.978,
    accuracy: 160,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/driver");
  await page.getByRole("button", { name: "내 위치 추적 시작" }).click();
  await expect(page.getByTestId("live-coordinates")).toBeVisible();
  await expect(page.locator(".live-location-info")).toContainText(
    "위치 오차가 커요",
  );
  await page.clock.fastForward(35000);
  await expect(page.locator(".live-location-info")).toContainText("갱신 지연");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("reset removes coordinates and stops tracking across role navigation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 37.5665,
    longitude: 126.978,
    accuracy: 10,
  });
  await page.goto("/driver");
  await page.getByRole("button", { name: "내 위치 추적 시작" }).click();
  await expect(page.getByTestId("live-coordinates")).toBeVisible();
  await page.getByRole("link", { name: "운영자", exact: true }).click();
  await page.getByRole("link", { name: "운영 설정", exact: true }).click();
  await page.getByRole("button", { name: "체험 데이터 처음으로" }).click();
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await expect(page.locator(".location-sharing")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("shuttle-mate-location-v1")!).fix,
    ),
  ).toBeNull();
});
