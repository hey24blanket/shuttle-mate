"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactNode } from "react";
import {
  BusFront,
  LayoutDashboard,
  Route,
  Users,
  Clock3,
  Settings,
  ChevronDown,
  ArrowUpRight,
  Bell,
  ShieldCheck,
  Menu,
  WifiOff,
  FlaskConical,
  X,
} from "lucide-react";
import { useStore } from "./provider";
import { Modal } from "./ui";
const nav = [
  ["/admin", "오늘의 운행", LayoutDashboard],
  ["/admin/routes", "노선 관리", Route],
  ["/admin/students", "원생 관리", Users],
  ["/admin/history", "운행 기록", Clock3],
  ["/admin/settings", "운영 설정", Settings],
] as const;
export function Shell({
  role = "admin",
  children,
}: {
  role?: "admin" | "driver" | "parent";
  children: ReactNode;
}) {
  const { data, online } = useStore();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [info, setInfo] = useState(false);
  return (
    <div className={`app-shell ${role === "admin" ? "" : "mobile-shell"}`}>
      {role === "admin" && (
        <>
          <aside className={`sidebar ${menu ? "opened" : ""}`}>
            <Link className="brand" href="/admin">
              <span className="brand-mark">
                <BusFront size={23} />
              </span>
              <span>
                shuttle mate<small>매일의 이동에 안심을</small>
              </span>
            </Link>
            <button className="org-selector" onClick={() => setInfo(true)}>
              <span className="org-icon">L</span>
              <span>
                {data.organization}
                <small>운영자 워크스페이스</small>
              </span>
              <ChevronDown size={15} />
            </button>
            <p className="nav-label">WORKSPACE</p>
            <nav>
              {nav.map(([href, label, Icon]) => (
                <Link
                  onClick={() => setMenu(false)}
                  className={path === href ? "active" : ""}
                  key={href}
                  href={href}
                >
                  <Icon size={19} />
                  {label}
                  {href === "/admin" && <span className="nav-count">1</span>}
                </Link>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="safety-note">
                <ShieldCheck size={25} />
                <strong>
                  작은 확인이 만드는
                  <br />큰 안심
                </strong>
                <p>
                  출발부터 마지막 하차까지,
                  <br />
                  함께 확인해요.
                </p>
              </div>
              <button className="profile" onClick={() => setInfo(true)}>
                <span className="avatar">김</span>
                <span>
                  김지현 원장님<small>운영 관리자</small>
                </span>
                <Settings size={16} />
              </button>
            </div>
          </aside>
          {menu && (
            <button
              className="sidebar-scrim"
              aria-label="메뉴 닫기"
              onClick={() => setMenu(false)}
            />
          )}
        </>
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            {role === "admin" ? (
              <>
                <button
                  className="icon-button mobile-menu"
                  aria-label="메뉴 열기"
                  onClick={() => setMenu(true)}
                >
                  <Menu size={20} />
                </button>
                <span>{data.organization}</span>
                <span className="slash">/</span>
                <strong>
                  {nav.find((v) => v[0] === path)?.[1] ?? "오늘의 운행"}
                </strong>
              </>
            ) : (
              <Link href="/admin" className="brand compact">
                <span className="brand-mark">
                  <BusFront size={21} />
                </span>
                <span>shuttle mate</span>
              </Link>
            )}
          </div>
          <div className="top-actions">
            <div className="role-switch" aria-label="체험 역할 선택">
              <Link
                className={role === "admin" ? "selected" : ""}
                href="/admin"
              >
                운영자
              </Link>
              <Link
                className={role === "driver" ? "selected" : ""}
                href="/driver"
              >
                운전자
              </Link>
              <Link
                className={role === "parent" ? "selected" : ""}
                href="/parent"
              >
                학부모
              </Link>
            </div>
            <button
              className="icon-button bell"
              aria-label="체험 안내"
              onClick={() => setInfo(true)}
            >
              <FlaskConical size={19} />
            </button>
          </div>
        </header>
        {!online && (
          <div className="offline">
            <WifiOff size={17} />
            인터넷 연결이 끊겼어요. 체험 변경은 이 기기에 저장됩니다.
          </div>
        )}
        <main className={role === "admin" ? "main-content" : "role-content"}>
          {children}
        </main>
        <footer className="app-footer">
          <span>© shuttle mate</span>
          <button onClick={() => setInfo(true)}>
            <FlaskConical size={13} /> 가상 데이터로 체험 중{" "}
            <ArrowUpRight size={12} />
          </button>
          <span>안전한 이동, 함께하는 안심.</span>
        </footer>
      </div>
      {info && (
        <Modal title="셔틀메이트 프로토타입" onClose={() => setInfo(false)}>
          <p className="modal-description">
            역할을 전환하며 하나의 운행이 어떻게 연결되는지 체험해 보세요.
          </p>
          <div className="info-list">
            <p>
              <strong>01 학부모</strong>오늘 변경을 요청해요.
            </p>
            <p>
              <strong>02 운영자</strong>요청을 확인하고 오늘 운행에 반영해요.
            </p>
            <p>
              <strong>03 운전자</strong>도착 · 탑승 · 하차를 확인해요.
            </p>
          </div>
          <div className="notice">
            모든 이름과 위치는 시연용입니다. 변경은 현재 브라우저에 저장되며
            같은 브라우저의 탭에 반영됩니다. 실제 계정 인증, 기기 간 동기화,
            GPS, 도로 ETA, 문자·푸시는 연결하지 않았습니다.
          </div>
          <Link
            className="button primary full"
            href="/admin/settings"
            onClick={() => setInfo(false)}
          >
            체험 설정 열기
          </Link>
        </Modal>
      )}
    </div>
  );
}
