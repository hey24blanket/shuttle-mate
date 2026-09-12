"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Store, Action, transition } from "@/lib/trip";
import { seed } from "@/lib/seed";
const KEY = "shuttle-mate-prototype-v1";
const Context = createContext<{
  data: Store;
  act: (a: Action) => boolean;
  reset: () => void;
  notify: (m: string) => void;
  online: boolean;
} | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Store | null>(null);
  const [toast, setToast] = useState("");
  const [online, setOnline] = useState(true);
  const notify = useCallback((m: string) => setToast(m), []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const value = raw ? JSON.parse(raw) : null;
      const initial = value?.version === 1 ? value : seed();
      if (!value) localStorage.setItem(KEY, JSON.stringify(initial));
      setData(initial);
    } catch {
      setData(seed());
    }
    const sync = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          const v = JSON.parse(e.newValue);
          if (v.version === 1) setData(v);
        } catch {}
      }
    };
    const network = () => setOnline(navigator.onLine);
    network();
    window.addEventListener("storage", sync);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const persist = (next: Store) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      notify("저장 공간이 부족해 이 화면에서만 유지됩니다.");
    }
    setData(next);
  };
  const act = (action: Action) => {
    if (!data) return false;
    try {
      let latest = data;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const v = JSON.parse(raw);
          if (v.version === 1) latest = v;
        }
      } catch {}
      persist(transition(latest, action));
      return true;
    } catch (e) {
      notify(
        e instanceof Error
          ? e.message
          : "처리하지 못했어요. 다시 시도해 주세요.",
      );
      return false;
    }
  };
  if (!data)
    return (
      <div className="loading">
        <div className="brand-mark">
          s<span>m</span>
        </div>
        <p>오늘의 안전한 이동을 준비합니다.</p>
      </div>
    );
  return (
    <Context.Provider
      value={{
        data,
        act,
        reset: () => {
          const fresh = seed();
          fresh.trip.id = crypto.randomUUID();
          persist(fresh);
          notify("체험 데이터를 처음 상태로 되돌렸어요.");
        },
        notify,
        online,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="알림 닫기" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("Provider missing");
  return value;
}
