export type Fix = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  heading: number | null;
  speed: number | null;
};
export type LocationRecord = {
  version: 1;
  tripId: string;
  owner: string;
  status:
    | "idle"
    | "acquiring"
    | "live"
    | "denied"
    | "unavailable"
    | "timeout"
    | "stopped"
    | "background";
  fix: Fix | null;
  changedAt: number;
};
export const LOCATION_KEY = "shuttle-mate-location-v1";
export const emptyLocation = (tripId: string): LocationRecord => ({
  version: 1,
  tripId,
  owner: "",
  status: "idle",
  fix: null,
  changedAt: Date.now(),
});
export function validFix(f: Fix): boolean {
  return (
    Number.isFinite(f.latitude) &&
    Math.abs(f.latitude) <= 90 &&
    Number.isFinite(f.longitude) &&
    Math.abs(f.longitude) <= 180 &&
    Number.isFinite(f.accuracy) &&
    f.accuracy >= 0 &&
    Number.isFinite(f.timestamp) &&
    f.timestamp > 0 &&
    f.timestamp <= Date.now() + 60000
  );
}
export function parseLocation(
  raw: string | null,
  tripId: string,
): LocationRecord | null {
  try {
    if (!raw) return null;
    const r = JSON.parse(raw) as LocationRecord;
    if (
      r.version !== 1 ||
      r.tripId !== tripId ||
      ![
        "idle",
        "acquiring",
        "live",
        "denied",
        "unavailable",
        "timeout",
        "stopped",
        "background",
      ].includes(r.status) ||
      !Number.isFinite(r.changedAt) ||
      typeof r.owner !== "string"
    )
      return null;
    if (r.fix && (!validFix(r.fix) || Date.now() - r.fix.timestamp > 300000))
      return null;
    return r;
  } catch {
    return null;
  }
}
export function locationLabel(r: LocationRecord, now: number) {
  if (r.status === "live" && r.fix)
    return now - r.fix.timestamp > 30000
      ? "갱신 지연 · 마지막 위치"
      : r.fix.accuracy > 100
        ? "위치 오차가 커요"
        : "실제 위치 수신 중";
  return {
    idle: "위치 추적 꺼짐",
    acquiring: "현재 위치를 찾는 중",
    denied: "위치 권한이 꺼져 있어요",
    unavailable: "현재 위치를 찾지 못했어요",
    timeout: "위치 확인 시간이 초과됐어요",
    stopped: "위치 추적 중지",
    background: "화면을 벗어나 추적 일시 중지",
    live: "현재 위치를 찾는 중",
  }[r.status];
}
