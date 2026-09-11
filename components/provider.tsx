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
import { useRouter } from "next/navigation";
import { Actor, Command, Role, Store } from "@/lib/model";
import { sampleStore, applyCommand } from "@/lib/engine";
import { clientAuth } from "@/lib/firebase-client";
type Context = {
  state: Store | null;
  actor: Actor | null;
  demo: boolean;
  ready: boolean;
  busy: boolean;
  online: boolean;
  error: string;
  notice: string;
  updatedAt: number;
  dispatch: (c: Command) => Promise<boolean>;
  switchRole: (r: Role) => void;
  setError: (s: string) => void;
  logout: () => Promise<void>;
};
const Context = createContext<Context | null>(null);
const KEY = "shuttle-mate-v1-demo";
export function demoActor(role: Role): Actor {
  return {
    uid: role === "driver" ? "demo-driver" : `demo-${role}`,
    role,
    orgId: "demo",
    studentIds: role === "parent" ? ["c2"] : [],
    displayName:
      role === "parent"
        ? "이서아 보호자"
        : role === "driver"
          ? "김안전 기사님"
          : "운영 관리자",
  };
}
export function Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Store | null>(null),
    [actor, setActor] = useState<Actor | null>(null),
    [demo, setDemo] = useState(false),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [online, setOnline] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [updatedAt, setUpdatedAt] = useState(0);
  const router = useRouter(),
    token = useRef<(() => Promise<string>) | null>(null),
    lock = useRef(false),
    stateRef = useRef<Store | null>(null);
  const accept = useCallback((s: Store) => {
    if (stateRef.current && s.revision < stateRef.current.revision) return;
    stateRef.current = s;
    setState(s);
    setUpdatedAt(Date.now());
  }, []);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    let unsubscribe: (() => void) | undefined;
    const readDemo = () => {
      try {
        const raw = localStorage.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : sampleStore();
        if (parsed.version !== 1) throw new Error();
        accept(parsed);
      } catch {
        setError(
          "체험 저장 데이터를 읽지 못했습니다. 홈에서 새 체험을 시작해주세요.",
        );
      }
    };
    const storage = (e: StorageEvent) => {
      if (e.key === KEY) readDemo();
    };
    if (sessionStorage.getItem("shuttle-mode") === "demo") {
      setDemo(true);
      setActor(
        demoActor((sessionStorage.getItem("shuttle-role") as Role) || "parent"),
      );
      readDemo();
      setReady(true);
      window.addEventListener("storage", storage);
    } else {
      (async () => {
        try {
          const auth = await clientAuth();
          const { onAuthStateChanged } = await import("firebase/auth");
          if (!alive) return;
          unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
              setReady(true);
              return;
            }
            token.current = () => user.getIdToken();
            const refresh = async () => {
              if (lock.current || !navigator.onLine) return;
              try {
                const r = await fetch("/api/state", {
                  headers: {
                    Authorization: `Bearer ${await user.getIdToken()}`,
                  },
                  cache: "no-store",
                });
                const data = await r.json();
                if (!r.ok) throw new Error(data.error);
                if (alive) {
                  setActor(data.actor);
                  accept(data.state);
                  setError("");
                }
              } catch (e) {
                if (alive) setError((e as Error).message);
              } finally {
                if (alive) setReady(true);
              }
            };
            await refresh();
            if (timer) clearInterval(timer);
            if (alive) timer = setInterval(refresh, 4000);
          });
        } catch {
          if (alive) setReady(true);
        }
      })();
    }
    return () => {
      alive = false;
      unsubscribe?.();
      if (timer) clearInterval(timer);
      window.removeEventListener("storage", storage);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, [accept]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);
  const dispatch = async (command: Command) => {
    if (!stateRef.current || !actor || lock.current) return false;
    if (!demo && !navigator.onLine) {
      setError("인터넷 연결 후 다시 시도해주세요. 아직 전송되지 않았습니다.");
      return false;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (demo) {
        const update = async () => {
          const current = JSON.parse(
            localStorage.getItem(KEY) || JSON.stringify(stateRef.current),
          );
          const next = applyCommand(
            current,
            command,
            actor,
            crypto.randomUUID(),
          );
          localStorage.setItem(KEY, JSON.stringify(next));
          accept(next);
        };
        if (navigator.locks) await navigator.locks.request(KEY, update);
        else await update();
      } else {
        const r = await fetch("/api/state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await token.current!()}`,
          },
          body: JSON.stringify({
            command,
            revision: stateRef.current.revision,
            eventId: crypto.randomUUID(),
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        accept(data.state);
      }
      if (command.type !== "GPS")
        setNotice(
          command.type === "REQUEST"
            ? "확인 요청을 보냈습니다. 승인 여부를 확인해주세요."
            : "변경사항을 저장했습니다.",
        );
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const switchRole = (r: Role) => {
    if (!demo) return;
    sessionStorage.setItem("shuttle-role", r);
    setActor(demoActor(r));
    router.push(`/${r}`);
  };
  const logout = async () => {
    sessionStorage.removeItem("shuttle-mode");
    sessionStorage.removeItem("shuttle-role");
    if (!demo) {
      const auth = await clientAuth();
      await (await import("firebase/auth")).signOut(auth);
    }
    location.assign("/");
  };
  return (
    <Context.Provider
      value={{
        state,
        actor,
        demo,
        ready,
        busy,
        online,
        error,
        notice,
        updatedAt,
        dispatch,
        switchRole,
        setError,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useShuttle() {
  const c = useContext(Context);
  if (!c) throw new Error("Provider required");
  return c;
}
export function startDemo(role: Role, fresh = false) {
  if (fresh || !localStorage.getItem(KEY))
    localStorage.setItem(KEY, JSON.stringify(sampleStore()));
  sessionStorage.setItem("shuttle-mode", "demo");
  sessionStorage.setItem("shuttle-role", role);
  location.assign(`/${role}`);
}
