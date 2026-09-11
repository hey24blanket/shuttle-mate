"use client";
import { ReactNode, useEffect, useState } from "react";
import {
  BusFront,
  LayoutDashboard,
  Route,
  Users,
  History,
  LogOut,
  Heart,
  Radio,
  ArrowRight,
  WifiOff,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShuttle } from "./provider";
import { Role } from "@/lib/model";
const roles = { parent: "학부모", driver: "운전자", admin: "운영자" };
export function Shell({
  role,
  title,
  subtitle,
  children,
  action,
}: {
  role: Role;
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const {
    actor,
    ready,
    demo,
    error,
    notice,
    busy,
    online,
    updatedAt,
    switchRole,
    logout,
  } = useShuttle();
  const path = usePathname();
  const [menu, setMenu] = useState(false),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);
  if (!ready)
    return (
      <main className="empty">
        <BusFront size={32} />
        <p>오늘의 운행을 불러오고 있어요.</p>
      </main>
    );
  if (!actor)
    return (
      <main className="empty">
        <h1>로그인이 필요해요.</h1>
        {error && <p>{error}</p>}
        <Link className="button primary" href="/login">
          로그인으로 이동 <ArrowRight size={17} />
        </Link>
      </main>
    );
  if (actor.role !== role)
    return (
      <main className="empty">
        <h1>등록된 역할의 화면을 이용해주세요.</h1>
        <Link href={`/${actor.role}`}>{roles[actor.role]} 화면으로</Link>
      </main>
    );
  const links =
    role === "admin"
      ? [
          { href: "/admin", text: "오늘의 운행", icon: LayoutDashboard },
          { href: "/admin/routes", text: "노선 관리", icon: Route },
          { href: "/admin/students", text: "원생 관리", icon: Users },
          { href: "/admin/history", text: "운행 기록", icon: History },
        ]
      : role === "driver"
        ? [{ href: "/driver", text: "오늘의 운행", icon: Route }]
        : [{ href: "/parent", text: "우리 아이 셔틀", icon: Heart }];
  const stale = !demo && now - updatedAt > 15000;
  return (
    <div className={`app-shell ${role}-shell`}>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Link className="brand" href="/">
          <span className="brand-icon">
            <BusFront size={23} />
          </span>
          <span>
            셔틀메이트<small>SHUTTLE MATE</small>
          </span>
        </Link>
        <button
          className="mobile-close"
          aria-label="메뉴 닫기"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <div className="org-card">
          <span className="org-avatar">튼</span>
          <div>
            <b>{demo ? "튼튼체육센터" : "우리 기관"}</b>
            <small>{roles[role]} 워크스페이스</small>
          </div>
          <span className="tiny-dot" />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {links.map((l) => (
            <Link
              key={l.href}
              className={path === l.href ? "active" : ""}
              href={l.href}
              onClick={() => setMenu(false)}
            >
              <l.icon size={19} />
              {l.text}
              {path === l.href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="care-note">
            <ShieldCheck size={22} />
            <b>오늘도 안전한 이동</b>
            <p>
              작은 확인 하나가
              <br />
              모두의 안심이 됩니다.
            </p>
          </div>
          <div className="profile">
            <span className="profile-avatar">
              {actor.displayName.slice(0, 1)}
            </span>
            <div>
              <b>{actor.displayName}</b>
              <small>{roles[role]}</small>
            </div>
            <button title="로그아웃" aria-label="로그아웃" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="메뉴 열기"
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            워크스페이스 <span>/</span> <b>{roles[role]}</b>
          </div>
          <div className="topbar-right">
            <span className={`connection ${!online || stale ? "warning" : ""}`}>
              {!online ? <WifiOff size={14} /> : <Radio size={14} />}{" "}
              {demo
                ? "브라우저 체험"
                : !online
                  ? "인터넷 끊김"
                  : stale
                    ? "연결 확인 중"
                    : "연결됨 · 4초 간격"}
            </span>
            <span className="top-avatar">{actor.displayName.slice(0, 1)}</span>
          </div>
        </header>
        {demo && (
          <div className="demo-bar">
            <span>
              <b>체험 모드</b>
              <span className="demo-detail">
                {" "}
                가상 데이터 · 같은 브라우저에서 역할을 바꿔보세요
              </span>
            </span>
            <div className="role-switch">
              {(["parent", "driver", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  aria-pressed={r === role}
                  onClick={() => switchRole(r)}
                >
                  {roles[r]}
                </button>
              ))}
            </div>
          </div>
        )}
        <main className="page-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {role === "parent"
                  ? "MY CHILD’S JOURNEY"
                  : role === "driver"
                    ? "TODAY’S JOURNEY"
                    : "DAILY OPERATIONS"}
              </span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {action}
          </div>
          {(!online || stale) && (
            <div className="error-box" role="status">
              {!online
                ? "인터넷 연결이 끊겼습니다."
                : "새로운 운행 정보를 받지 못하고 있습니다."}{" "}
              {demo
                ? "체험 내용은 이 브라우저에 저장됩니다."
                : "화면의 상태가 최신이 아닐 수 있습니다."}
            </div>
          )}
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          <div aria-busy={busy}>{children}</div>
          <footer className="workspace-footer">
            <span>셔틀메이트 · 함께 확인하는 오늘의 이동</span>
            <span>안심을 잇다.</span>
          </footer>
        </main>
        {notice && (
          <div className="toast" role="status">
            <ShieldCheck size={17} />
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
