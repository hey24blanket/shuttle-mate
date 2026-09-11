import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
export async function clientAuth() {
  const config = await fetch("/api/config", { cache: "no-store" }).then((r) =>
    r.json(),
  );
  if (!config.configured)
    throw new Error(
      "기관 연결 준비 중입니다. 아래 체험하기로 새 기능을 확인할 수 있습니다.",
    );
  const app = getApps()[0] || initializeApp(config.firebase);
  const auth = getAuth(app);
  await setPersistence(auth, browserSessionPersistence);
  return auth;
}
