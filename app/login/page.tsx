"use client";
import { useState, useEffect, FormEvent } from "react";
import { BusFront, ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { clientAuth } from "@/lib/firebase-client";
import { startDemo } from "@/components/provider";
export default function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setAvailable(d.configured))
      .catch(() => setAvailable(false));
  }, []);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const auth = await clientAuth();
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const result = await signInWithEmailAndPassword(
        auth,
        String(f.get("email")),
        String(f.get("password")),
      );
      const r = await fetch("/api/state", {
        headers: { Authorization: `Bearer ${await result.user.getIdToken()}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      sessionStorage.removeItem("shuttle-mode");
      location.assign(`/${d.actor.role}`);
    } catch (err) {
      const msg = (err as Error).message;
      setError(
        msg.includes("auth/") ? "이메일과 비밀번호를 확인해주세요." : msg,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={17} /> 처음으로
      </Link>
      <section className="login-card">
        <span className="brand-icon large">
          <BusFront />
        </span>
        <span className="eyebrow">SHUTTLE MATE</span>
        <h1>
          안녕하세요.
          <br />
          오늘도 함께 갈까요?
        </h1>
        <p>기관에 등록된 계정으로 로그인해주세요.</p>
        {available === false && (
          <div className="info-box">
            기관 연결 준비 중입니다. 아래 체험 화면에서 새 기능을 먼저
            확인해보세요.
          </div>
        )}
        <form onSubmit={login}>
          <label>
            이메일
            <input
              required
              name="email"
              type="email"
              autoComplete="username"
              placeholder="name@example.com"
            />
          </label>
          <label>
            비밀번호
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력해주세요"
            />
          </label>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy || available !== true}>
            {busy ? "확인 중…" : "로그인"}
          </button>
        </form>
        <p className="small">
          <LockKeyhole size={14} /> 등록된 역할에 맞는 화면으로 연결됩니다.
        </p>
        <div className="login-demo">
          <span>먼저 둘러보고 싶다면</span>
          <button onClick={() => startDemo("parent")}>학부모</button>
          <button onClick={() => startDemo("driver")}>운전자</button>
          <button onClick={() => startDemo("admin")}>운영자</button>
        </div>
      </section>
    </main>
  );
}
