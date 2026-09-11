"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ArrowRight,
  BusFront,
  Users,
  CheckCircle2,
  Bell,
  ChevronRight,
  Download,
  Plus,
} from "lucide-react";
import { useShuttle } from "@/components/provider";
import { Shell } from "@/components/shell";
import {
  TripBadge,
  Timeline,
  JourneyMap,
  timeText,
  ChildBadge,
} from "@/components/shared";
import { Requests } from "@/components/requests";
import { today } from "@/lib/model";
export default function AdminPage() {
  const { state, dispatch, busy } = useShuttle();
  const [date, setDate] = useState(today());
  const trip = state && Object.values(state.trips).find((t) => t.date === date);
  const boarded =
      trip?.students.filter((c) =>
        ["BOARDED", "DROPPED_OFF"].includes(c.boarding),
      ).length || 0,
    requests =
      trip?.students.filter((c) => c.request?.status === "SUBMITTED").length ||
      0;
  return (
    <Shell
      role="admin"
      title="오늘의 운행"
      subtitle="아이들의 이동부터 작은 변경까지, 한눈에 확인하세요."
      action={
        <div className="heading-actions">
          <label className="date-picker">
            <CalendarDays size={17} />
            <input
              aria-label="운행 날짜"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {!trip && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => dispatch({ type: "CREATE_TRIP", date })}
            >
              <Plus size={17} /> 운행 만들기
            </button>
          )}
        </div>
      }
    >
      <div className="stat-grid">
        {[
          {
            label: "오늘 운행",
            value: trip ? "1" : "0",
            unit: "대",
            sub:
              trip?.status === "RUNNING" || trip?.status === "ARRIVED"
                ? "안전하게 운행 중"
                : "예정된 운행을 확인하세요",
            icon: BusFront,
            tone: "mint",
          },
          {
            label: "탑승 예정 원생",
            value: String(trip?.students.length || 0),
            unit: "명",
            sub: "오늘 노선에 배정된 아이들",
            icon: Users,
            tone: "blue",
          },
          {
            label: "탑승 확인",
            value: String(boarded),
            unit: `/ ${trip?.students.length || 0}명`,
            sub: "개별 탑승 확인 기준",
            icon: CheckCircle2,
            tone: "green",
          },
          {
            label: "확인 대기 요청",
            value: String(requests),
            unit: "건",
            sub: requests
              ? "운영자의 확인이 필요해요"
              : "모든 요청을 확인했어요",
            icon: Bell,
            tone: "yellow",
          },
        ].map((c) => (
          <section className="stat-card" key={c.label}>
            <div className="spread">
              <span>{c.label}</span>
              <span className={`round-icon ${c.tone}`}>
                <c.icon size={18} />
              </span>
            </div>
            <div className="stat-value">
              {c.value}
              <small>{c.unit}</small>
            </div>
            <p>{c.sub}</p>
          </section>
        ))}
      </div>
      {trip ? (
        <>
          <div className="admin-grid">
            <section className="card route-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">LIVE JOURNEY</span>
                  <h2>지금, 우리 셔틀</h2>
                </div>
                <TripBadge trip={trip} />
              </div>
              <div className="route-info">
                <div>
                  <h3>{trip.routeName}</h3>
                  <span>
                    {trip.driverName} <i /> {trip.vehicle}
                  </span>
                </div>
                <Link className="text-button" href="/admin/routes">
                  기본 노선 <ChevronRight size={16} />
                </Link>
              </div>
              <JourneyMap trip={trip} />
              <div className="route-summary">
                <div>
                  <small>운행 진행</small>
                  <b>
                    {trip.status === "COMPLETED"
                      ? trip.stops.length
                      : trip.current}{" "}
                    <span>/ {trip.stops.length} 정차지</span>
                  </b>
                </div>
                <div>
                  <small>현재 안내</small>
                  <b>
                    {trip.delay ? `${trip.delay}분 지연` : "지연 안내 없음"}
                  </b>
                </div>
                <div>
                  <small>다음 확인</small>
                  <b>
                    {trip.status === "COMPLETED"
                      ? "운행 완료"
                      : trip.stops[trip.current]?.name}
                  </b>
                </div>
              </div>
              <div className="route-progress">
                <span
                  style={{
                    width: `${((trip.status === "COMPLETED" ? trip.stops.length : trip.current) / trip.stops.length) * 100}%`,
                  }}
                />
              </div>
              <Timeline trip={trip} />
            </section>
            <div className="admin-right">
              <Requests trip={trip} />
              <section className="card">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">ACTIVITY FEED</span>
                    <h2>최근 운행 소식</h2>
                  </div>
                  <Link href="/admin/history" aria-label="전체 운행 기록">
                    <ArrowRight size={19} />
                  </Link>
                </div>
                <div className="activity-list">
                  {trip.events
                    .slice(-5)
                    .reverse()
                    .map((e) => (
                      <div className="activity-item" key={e.id}>
                        <span className="activity-dot" />
                        <div>
                          <p>{e.text}</p>
                          <time>{timeText(e.at)}</time>
                        </div>
                      </div>
                    ))}
                  {trip.events.length === 0 && (
                    <div className="empty-small compact">
                      <BusFront size={25} />
                      <p>운행이 시작되면 기록이 쌓입니다.</p>
                    </div>
                  )}
                </div>
              </section>
              <div className="tip-card">
                <span className="round-icon yellow">
                  <CheckCircle2 size={20} />
                </span>
                <h3>출발 전, 한 번 더 확인해요.</h3>
                <p>
                  학부모의 변경 요청과 오늘의 탑승 인원을 확인하면 더 안심하고
                  출발할 수 있어요.
                </p>
                <Link href="/admin/students">
                  원생 배정 확인 <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
          <section className="card roster-preview">
            <div className="section-heading">
              <h2>오늘의 탑승 명단</h2>
              <Link className="text-button" href="/admin/history">
                <Download size={16} /> 기록 보기
              </Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>원생</th>
                    <th>소속</th>
                    <th>오늘 탑승지</th>
                    <th>승하차 상태</th>
                    <th>탑승 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.students.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <b>{c.name}</b>
                      </td>
                      <td>{c.crew}</td>
                      <td>{trip.stops.find((s) => s.id === c.stopId)?.name}</td>
                      <td>
                        <ChildBadge child={c} />
                      </td>
                      <td>{timeText(c.boardedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {!["COMPLETED", "CANCELLED"].includes(trip.status) && (
            <button
              className="text-button danger"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    "이 운행을 취소할까요? 학부모 화면에 운행 취소가 표시됩니다.",
                  )
                )
                  void dispatch({ type: "CANCEL", tripId: trip.id });
              }}
            >
              이 운행 취소
            </button>
          )}
        </>
      ) : (
        <section className="card empty-small">
          <CalendarDays size={35} />
          <h2>아직 등록된 운행이 없어요.</h2>
          <p>기본 노선을 바탕으로 선택한 날짜의 운행을 만들어주세요.</p>
          <button
            className="primary"
            disabled={busy}
            onClick={() => dispatch({ type: "CREATE_TRIP", date })}
          >
            <Plus size={17} /> {date} 운행 만들기
          </button>
        </section>
      )}
    </Shell>
  );
}
