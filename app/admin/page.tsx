"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BusFront,
  Users,
  ClipboardCheck,
  Clock3,
  CalendarDays,
  ChevronDown,
  Plus,
  Route,
  MapPin,
  ShieldCheck,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { useStore } from "@/components/provider";
import { Badge, SectionTitle, Modal } from "@/components/ui";
import { RouteMap } from "@/components/route-map";
import { Requests } from "@/components/requests";
import {
  activeRequest,
  boardingLabel,
  dateLabel,
  isFinished,
  statusLabel,
  timeLabel,
} from "@/lib/trip";
export default function Dashboard() {
  const { data, act, notify } = useStore();
  const t = data.trip;
  const [detail, setDetail] = useState(false);
  const pending = t.requests.filter(activeRequest).length;
  const boarded = Object.values(t.states).filter(
    (v) => v === "BOARDED" || v === "DROPPED_OFF",
  ).length;
  const total = Object.keys(t.states).length;
  const excluded = Object.values(t.states).filter(
    (v) => v === "ABSENT" || v === "SELF_TRANSPORT",
  ).length;
  return (
    <Shell>
      <SectionTitle
        eyebrow="TODAY, TOGETHER"
        title="오늘도, 안심하고 출발해요."
        description="한눈에 보는 운행 상황, 놓치지 않는 작은 변화."
        action={
          <div className="title-actions">
            <span className="date-pill">
              <CalendarDays size={16} />
              {dateLabel(t.date)}
            </span>
            <button
              className="button primary"
              onClick={() => {
                if (act({ type: "CREATE_TRIP" }))
                  notify("기본 노선으로 새로운 운행을 준비했어요.");
              }}
            >
              <Plus size={17} />
              운행 만들기
            </button>
          </div>
        }
      />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            오늘의 운행
            <BusFront size={18} />
          </div>
          <div className="stat-value">
            1<span>회</span>
            <Badge tone={t.status === "RUNNING" ? "green" : "gray"}>
              {statusLabel[t.status]}
            </Badge>
          </div>
          <p>유아체육 1반 · 등원 셔틀</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            탑승 확인
            <Users size={18} />
          </div>
          <div className="stat-value">
            {boarded}
            <span>/ {total - excluded}명</span>
            <div className="tiny-progress">
              <i
                style={{
                  width: `${(boarded / Math.max(1, total - excluded)) * 100}%`,
                }}
              />
            </div>
          </div>
          <p>
            전체 {total}명 중 오늘 미이용 {excluded}명
          </p>
        </div>
        <div className="stat-card attention">
          <div className="stat-label">
            확인할 요청
            <ClipboardCheck size={18} />
          </div>
          <div className="stat-value">
            {pending}
            <span>건</span>
            <span className="stat-link">
              {pending ? "확인이 필요해요" : "모두 확인했어요"}
              <ArrowUpRight size={16} />
            </span>
          </div>
          <p>오늘의 변경을 함께 확인해 주세요.</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            운행 지연
            <Clock3 size={18} />
          </div>
          <div className="stat-value">
            {t.delay}
            <span>분</span>
            <Badge tone={t.delay ? "orange" : "green"}>
              {t.delay ? "일정 확인" : "정상 운행"}
            </Badge>
          </div>
          <p>예정 시간 대비 · 운영자 설정 기준</p>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="card live-card">
          <div className="card-head">
            <div className="heading-with-icon">
              <span className="live-dot" />
              <h2>오늘의 운행 현황</h2>
              <span className="subtle">1개 노선</span>
            </div>
            <Link className="text-button" href="/driver">
              운전자 화면 <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="trip-overview">
            <div className="bus-tile">
              <BusFront size={27} />
            </div>
            <div className="trip-name">
              <h3>
                유아체육 1반 <span className="tag">등원</span>
              </h3>
              <p>
                김성호 기사님 <span>·</span> 12가 3456 <span>·</span> 14:00 —
                14:30
              </p>
            </div>
            <Badge tone={isFinished(t) ? "gray" : "green"}>
              {statusLabel[t.status]}
            </Badge>
          </div>
          <RouteMap />
          <div className="map-bottom">
            <div>
              <span className="next-marker">
                <MapPin size={17} />
              </span>
              <span>
                <small>{isFinished(t) ? "운행 종료" : "다음 정차지"}</small>
                <strong>
                  {isFinished(t)
                    ? "오늘도 안전하게 도착했어요"
                    : t.stops[t.current].name}
                </strong>
              </span>
            </div>
            <div className="progress-copy">
              <strong>
                {isFinished(t) ? t.stops.length : t.current}
                <span> / {t.stops.length} 정차지</span>
              </strong>
              <div className="progress">
                <i
                  style={{
                    width: `${isFinished(t) ? 100 : (t.current / t.stops.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <button className="button small" onClick={() => setDetail(true)}>
              운행 상세 <ArrowRight size={15} />
            </button>
          </div>
        </section>
        <section className="card requests-card">
          <Requests />
        </section>
        <section className="card schedule-card">
          <div className="card-head">
            <h2>오늘의 운행 일정</h2>
            <Link className="text-button" href="/admin/routes">
              노선 관리 <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="schedule-table">
            <div className="table-head">
              <span>출발 시간</span>
              <span>노선 / 운전자</span>
              <span>탑승 현황</span>
              <span>운행 상태</span>
            </div>
            <button className="schedule-row" onClick={() => setDetail(true)}>
              <span className="schedule-time">
                14:00<small>14:30 도착 예정</small>
              </span>
              <span>
                <strong>유아체육 1반 · 등원</strong>
                <small>김성호 · 12가 3456</small>
              </span>
              <span className="count-cell">
                <Users size={16} />
                {boarded} / {total - excluded}명
              </span>
              <Badge tone={isFinished(t) ? "gray" : "green"}>
                {statusLabel[t.status]}
              </Badge>
            </button>
          </div>
          <div className="schedule-note">
            <ShieldCheck size={16} />
            마지막 아동의 하차까지 확인하면 오늘의 운행이 완료됩니다.
          </div>
        </section>
        <section className="card activity-card">
          <div className="card-head">
            <h2>최근 활동</h2>
            <Link href="/admin/history" className="text-button">
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="activities">
            {t.events.slice(0, 3).map((e) => (
              <div className="activity" key={e.id}>
                <span
                  className={`activity-dot ${e.type.includes("REQUEST") ? "orange" : "green"}`}
                >
                  {e.type.includes("REQUEST") ? (
                    <ClipboardCheck size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                </span>
                <div>
                  <p>{e.message}</p>
                  <small>
                    {e.actor} · {timeLabel(e.time)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {detail && (
        <Modal
          title="유아체육 1반 · 오늘의 운행"
          onClose={() => setDetail(false)}
        >
          <div className="row-between">
            <p>{dateLabel(t.date)}</p>
            <Badge>{statusLabel[t.status]}</Badge>
          </div>
          <div className="detail-students">
            {data.students
              .filter((c) => t.states[c.id])
              .map((c) => (
                <div key={c.id}>
                  <strong>{c.name}</strong>
                  <span>
                    {t.stops.find((s) => s.id === t.assignments[c.id])?.name}
                  </span>
                  <Badge tone={t.states[c.id] === "BOARDED" ? "green" : "gray"}>
                    {boardingLabel[t.states[c.id]]}
                  </Badge>
                </div>
              ))}
          </div>
          <Link className="button primary full" href="/driver">
            운전자 화면에서 계속하기 <ArrowRight size={17} />
          </Link>
        </Modal>
      )}
    </Shell>
  );
}
