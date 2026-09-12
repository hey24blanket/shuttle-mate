"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useStore } from "./provider";
import { isFinished } from "@/lib/trip";
import {
  Fix,
  LocationRecord,
  LOCATION_KEY,
  emptyLocation,
  parseLocation,
  validFix,
  locationLabel,
} from "@/lib/location";
const Context = createContext<{
  record: LocationRecord;
  label: string;
  now: number;
  tracking: boolean;
  start: () => void;
  stop: () => void;
} | null>(null);
export function LocationProvider({ children }: { children: ReactNode }) {
  const { data, notify } = useStore();
  const tripId = data.trip.id;
  const ended = isFinished(data.trip);
  const [record, setRecord] = useState<LocationRecord>(() =>
    emptyLocation(tripId),
  );
  const [now, setNow] = useState(Date.now);
  const [tracking, setTracking] = useState(false);
  const recordRef = useRef(record);
  const watch = useRef<number | null>(null);
  const generation = useRef(0);
  const owner = useRef("");
  const resume = useRef(false);
  const startRef = useRef(() => {});
  const clear = useCallback(() => {
    generation.current++;
    if (watch.current !== null) {
      navigator.geolocation?.clearWatch(watch.current);
      watch.current = null;
    }
    setTracking(false);
  }, []);
  const write = useCallback(
    (r: LocationRecord) => {
      recordRef.current = r;
      setRecord(r);
      try {
        localStorage.setItem(LOCATION_KEY, JSON.stringify(r));
      } catch {
        notify("위치를 저장하지 못해 이 탭에서만 표시합니다.");
      }
    },
    [notify],
  );
  const stop = useCallback(() => {
    resume.current = false;
    clear();
    write({
      ...emptyLocation(tripId),
      owner: owner.current,
      status: "stopped",
    });
  }, [clear, write, tripId]);
  const start = useCallback(() => {
    if (ended) {
      notify(
        "종료된 운행입니다. 새 운행을 준비한 뒤 위치 추적을 시작해 주세요.",
      );
      return;
    }
    clear();
    resume.current = false;
    owner.current = crypto.randomUUID();
    const own = owner.current;
    if (!navigator.geolocation || !window.isSecureContext) {
      write({ ...emptyLocation(tripId), owner: own, status: "unavailable" });
      notify("위치 기능을 지원하는 브라우저에서 HTTPS 주소로 열어 주세요.");
      return;
    }
    const token = generation.current;
    const accepts = () => generation.current === token;
    write({ ...emptyLocation(tripId), owner: own, status: "acquiring" });
    setTracking(true);
    watch.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!accepts()) return;
        const c = position.coords;
        const fix: Fix = {
          latitude: c.latitude,
          longitude: c.longitude,
          accuracy: c.accuracy,
          timestamp: position.timestamp,
          heading: c.heading,
          speed: c.speed,
        };
        if (!validFix(fix)) return;
        write({
          version: 1,
          tripId,
          owner: own,
          status: "live",
          fix,
          changedAt: Date.now(),
        });
      },
      (error) => {
        if (!accepts()) return;
        const status =
          error.code === 1
            ? "denied"
            : error.code === 3
              ? "timeout"
              : "unavailable";
        if (error.code === 1) clear();
        write({
          ...emptyLocation(tripId),
          owner: own,
          status,
          fix: error.code === 1 ? null : recordRef.current.fix,
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }, [ended, tripId, clear, write, notify]);
  startRef.current = start;
  useEffect(() => {
    clear();
    resume.current = false;
    let saved: LocationRecord | null = null;
    try {
      saved = ended
        ? null
        : parseLocation(localStorage.getItem(LOCATION_KEY), tripId);
    } catch {}
    recordRef.current = saved ?? emptyLocation(tripId);
    setRecord(recordRef.current);
    if (ended) write({ ...emptyLocation(tripId), status: "stopped" });
    else if (!saved) write(emptyLocation(tripId));
    const sync = (event: StorageEvent) => {
      if (event.key !== LOCATION_KEY) return;
      const value = parseLocation(event.newValue, tripId);
      if (!value) return;
      if (value.owner !== owner.current || value.status === "stopped") {
        clear();
        resume.current = false;
      }
      recordRef.current = value;
      setRecord(value);
    };
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      clear();
    };
  }, [tripId, ended, clear, write]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden && watch.current !== null) {
        resume.current = true;
        clear();
        write({
          ...recordRef.current,
          status: "background",
          changedAt: Date.now(),
        });
      } else if (!document.hidden && resume.current) {
        resume.current = false;
        startRef.current();
      }
    };
    const leaving = () => {
      if (watch.current !== null) {
        clear();
        write({ ...emptyLocation(tripId), status: "stopped" });
      }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leaving);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leaving);
    };
  }, [clear, write, tripId]);
  const safeRecord =
    ended || record.tripId !== tripId
      ? { ...emptyLocation(tripId), status: "stopped" as const }
      : record;
  return (
    <Context.Provider
      value={{
        record: safeRecord,
        label: locationLabel(safeRecord, now),
        now,
        tracking,
        start,
        stop,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLocation() {
  const ctx = useContext(Context);
  if (!ctx) throw Error("LocationProvider missing");
  return ctx;
}
