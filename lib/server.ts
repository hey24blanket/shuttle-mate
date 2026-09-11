import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { Actor, Store } from "./model";
export function configured() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON &&
    process.env.FIREBASE_DATABASE_URL &&
    process.env.FIREBASE_WEB_API_KEY &&
    process.env.FIREBASE_PROJECT_ID,
  );
}
export function backend() {
  if (!configured())
    throw new Error("기관 연결 설정이 아직 완료되지 않았습니다.");
  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!)),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  return { auth: getAuth(app), db: getDatabase(app) };
}
export async function authenticate(req: Request): Promise<Actor> {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("로그인이 필요합니다.");
  const { auth, db } = backend();
  const user = await auth.verifyIdToken(token, true);
  const profile = (await db.ref(`shuttle_v3/members/${user.uid}`).get()).val();
  if (
    !profile ||
    !["admin", "driver", "parent"].includes(profile.role) ||
    !/^[\w-]{1,100}$/.test(profile.orgId)
  )
    throw new Error(
      "기관에 등록된 계정이 아닙니다. 운영자에게 등록을 요청해주세요.",
    );
  return {
    uid: user.uid,
    role: profile.role,
    orgId: profile.orgId,
    studentIds: Array.isArray(profile.studentIds) ? profile.studentIds : [],
    displayName: profile.displayName || user.email || "회원",
  };
}
export function organizationRef(actor: Actor) {
  return backend().db.ref(`shuttle_v3/organizations/${actor.orgId}/state`);
}
export function normalize(s: Store): Store {
  s.trips = s.trips || {};
  s.route.students = s.route.students || [];
  for (const t of Object.values(s.trips)) {
    t.students = t.students || [];
    t.events = t.events || [];
    t.live = t.live || { active: false };
  }
  return s;
}
export function apiError(error: unknown, status = 400) {
  const message =
    error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
  const safe =
    /Firebase|credential|private_key|ENOTFOUND|invalid token|Decoding Firebase/i.test(
      message,
    )
      ? "서버 연결 또는 로그인을 확인해주세요."
      : message;
  return Response.json(
    { error: safe },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
