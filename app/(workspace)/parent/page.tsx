"use client";
import { useState } from "react";
import {
  MapPin,
  Clock3,
  BusFront,
  Heart,
  ArrowUpRight,
  ArrowRight,
  Home,
  CalendarX,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useShuttle } from "@/components/provider";
import { Shell } from "@/components/shell";
import { JourneyMap, Pill, ChildBadge, timeText } from "@/components/shared";
import { RequestKind, requestLabels, today } from "@/lib/model";
export default function ParentPage() {
  const { state, actor, dispatch, busy } = useShuttle();
  const [kind, setKind] = useState<RequestKind | null>(null),
    [selected, setSelected] = useState("");
  const trip =
    state && Object.values(state.trips).find((t) => t.date === today());
  const kids =
    trip?.students.filter((c) => actor?.studentIds.includes(c.id)) || [];
  const child = kids.find((c) => c.id === selected) || kids[0];
  const stop = trip?.stops.find((s) => s.id === child?.stopId);
  const index = trip?.stops.findIndex((s) => s.id === child?.stopId) ?? 0;
  const left = trip ? Math.max(0, index - trip.current) : 0;
  const message = !trip
    ? "오늘 등록된 운행이 없어요."
    : !child
      ? "배정된 아이를 확인해주세요."
      : trip.status === "CANCELLED"
        ? "오늘 운행이 취소되었어요."
        : child.boarding === "DROPPED_OFF"
          ? "센터에 안전하게 도착했어요."
          : child.boarding === "BOARDED"
            ? "셔틀에 잘 탔어요."
            : child.boarding === "NO_SHOW"
              ? "탑승하지 못했어요."
              : child.boarding === "ABSENT"
                ? "오늘은 셔틀을 쉬어요."
                : child.boarding === "SELF_TRANSPORT"
                  ? "오늘은 직접 이동해요."
                  : trip.status === "COMPLETED"
                    ? "오늘 운행을 마쳤어요."
                    : trip.status === "READY"
                      ? "오늘도 안전하게 데리러 갈게요."
                      : left === 0
                        ? trip.status === "ARRIVED"
                          ? "우리 정차지에 도착했어요."
                          : "우리 정차지로 가고 있어요."
                        : `우리 정차지까지 ${left}곳 남았어요.`;
  const closed =
    !trip ||
    ["COMPLETED", "CANCELLED"].includes(trip.status) ||
    !child ||
    ["BOARDED", "DROPPED_OFF", "NO_SHOW"].includes(child.boarding) ||
    index < trip.current;
  return (
    <Shell
      role="parent"
      title={child ? `${child.name}의 오늘 셔틀` : "우리 아이 셔틀"}
      subtitle="기다리는 순간에도, 이동하는 동안에도 함께 확인해요."
      action={
        <Pill>
          <CalendarX size={14} />
          {today().replaceAll("-", ". ")}
        </Pill>
      }
    >
      {trip && child ? (
        <>
          <div className="parent-grid">
            <div className="parent-main">
              <section className="parent-hero">
                <div className="spread">
                  <Pill tone="green">
                    <span className="status-dot" />
                    {trip.status === "READY"
                      ? "오늘의 등원"
                      : trip.status === "CANCELLED"
                        ? "운행 취소"
                        : "오늘의 이동"}
                  </Pill>
                  <Heart size={23} />
                </div>
                <h2>{message}</h2>
                <p>
                  {child.boarding === "BOARDED"
                    ? `${timeText(child.boardedAt)}에 탑승을 확인했습니다.`
                    : child.boarding === "DROPPED_OFF"
                      ? `${timeText(child.droppedOffAt)}에 하차를 확인했습니다.`
                      : trip.delay
                        ? `현재 ${trip.delay}분 지연 안내가 있습니다.`
                        : `${stop?.time} 예정 · ${stop?.name}`}
                </p>
                <div className="parent-progress">
                  <span
                    style={{
                      width: `${trip.status === "COMPLETED" ? 100 : Math.min(100, (trip.current / Math.max(1, index)) * 100)}%`,
                    }}
                  />
                  <div
                    className="progress-bus"
                    style={{
                      left: `${trip.status === "COMPLETED" ? 96 : Math.min(96, (trip.current / Math.max(1, index)) * 96)}%`,
                    }}
                  >
                    <BusFront size={23} />
                  </div>
                </div>
                <div className="spread small">
                  <span>셔틀 출발</span>
                  <b>우리 정차지</b>
                </div>
              </section>
              <section className="card no-padding">
                <div className="section-heading padded">
                  <div>
                    <span className="eyebrow">TODAY’S PICKUP</span>
                    <h2>오늘 만나는 곳</h2>
                  </div>
                  <Pill>{trip.routeName}</Pill>
                </div>
                <JourneyMap trip={trip} stopId={child.stopId} />
                <div className="pickup-summary">
                  <div>
                    <MapPin size={19} />
                    <div>
                      <small>탑승 장소</small>
                      <b>{stop?.name}</b>
                    </div>
                  </div>
                  <div>
                    <Clock3 size={19} />
                    <div>
                      <small>예정 시간{trip.delay ? " · 지연 별도" : ""}</small>
                      <b>{stop?.time}</b>
                    </div>
                  </div>
                </div>
              </section>
              <section className="card">
                <div className="section-heading">
                  <h2>오늘의 소식</h2>
                  <Pill tone="neutral">내 아이의 기록</Pill>
                </div>
                <div className="activity-list">
                  {trip.events
                    .filter((e) => !e.studentId || e.studentId === child.id)
                    .slice(-5)
                    .reverse()
                    .map((e) => (
                      <div className="activity-item" key={e.id}>
                        <span className="activity-dot" />
                        <p>{e.text}</p>
                        <time>{timeText(e.at)}</time>
                      </div>
                    ))}
                  {trip.events.length === 0 && (
                    <p className="muted">
                      운행이 시작되면 소식을 알려드릴게요.
                    </p>
                  )}
                </div>
              </section>
            </div>
            <aside className="parent-side">
              <section className="card child-card">
                <div className="spread">
                  <span className="eyebrow">MY LITTLE PASSENGER</span>
                  <Heart size={17} />
                </div>
                <div className="child-profile">
                  <span className="avatar big-avatar">
                    {child.name.slice(-2, -1)}
                  </span>
                  <div>
                    <h2>{child.name}</h2>
                    <p>{child.crew}</p>
                  </div>
                </div>
                {kids.length > 1 && (
                  <label>
                    아이 선택
                    <select
                      value={child.id}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      {kids.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <ChildBadge child={child} />
                <hr />
                <div className="definition">
                  <span>담당 기사님</span>
                  <b>{trip.driverName}</b>
                  <span>차량 번호</span>
                  <b>{trip.vehicle}</b>
                </div>
              </section>
              <section className="card">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">A LITTLE CHANGE?</span>
                    <h2>오늘 변경이 있나요?</h2>
                  </div>
                </div>
                <div className="quick-actions">
                  {(
                    [
                      { kind: "ABSENT", icon: CalendarX },
                      { kind: "SELF_TRANSPORT", icon: Home },
                      { kind: "DELAY", icon: Clock3 },
                      { kind: "STOP_CHANGE", icon: MapPin },
                    ] as const
                  ).map((q) => (
                    <button
                      disabled={
                        closed || busy || child.request?.status === "SUBMITTED"
                      }
                      key={q.kind}
                      onClick={() => setKind(q.kind)}
                    >
                      <q.icon size={20} />
                      <span>{requestLabels[q.kind]}</span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
                {child.request && (
                  <div className="request-feedback">
                    <Pill
                      tone={
                        child.request.status === "SUBMITTED"
                          ? "amber"
                          : child.request.status === "REJECTED"
                            ? "red"
                            : "green"
                      }
                    >
                      {child.request.status === "SUBMITTED"
                        ? "확인 대기"
                        : child.request.status === "APPLIED"
                          ? "승인 완료"
                          : "반려됨"}
                    </Pill>
                    <p>{requestLabels[child.request.kind]}</p>
                    <small>
                      {child.request.status === "SUBMITTED"
                        ? "확인되기 전까지 기존 탑승 안내가 유지됩니다."
                        : child.request.status === "REJECTED"
                          ? "기존 탑승 안내가 유지됩니다."
                          : "오늘 운행에 반영되었습니다."}
                    </small>
                  </div>
                )}
                {!closed && child.request?.status !== "SUBMITTED" && (
                  <button
                    className="text-button"
                    onClick={() => setKind("NORMAL")}
                  >
                    <RefreshCw size={14} /> 정상 탑승으로 변경 요청
                  </button>
                )}
                <p className="hint">
                  조금 늦어요는 대기를 보장하지 않습니다. 요청의 확인 상태를 꼭
                  확인해주세요.
                </p>
              </section>
              <div className="assurance">
                <CheckCircle2 size={20} />
                <p>
                  내 아이의 소식만,
                  <br />
                  <b>필요한 순간에 정확하게.</b>
                </p>
              </div>
            </aside>
          </div>
          {kind && (
            <dialog open className="modal">
              <div className="modal-card">
                <span className="eyebrow">TODAY’S REQUEST</span>
                <h2>{requestLabels[kind]}</h2>
                <p>운영자·기사님 확인 후 오늘 운행에 반영됩니다.</p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    if (
                      await dispatch({
                        type: "REQUEST",
                        tripId: trip.id,
                        studentId: child.id,
                        kind,
                        detail: String(f.get("detail") || ""),
                        targetStopId: String(f.get("stop") || ""),
                      })
                    )
                      setKind(null);
                  }}
                >
                  {kind === "STOP_CHANGE" && (
                    <label>
                      변경할 탑승 장소
                      <select name="stop" required defaultValue="">
                        <option value="" disabled>
                          정차지를 선택해주세요
                        </option>
                        {trip.stops
                          .filter(
                            (s, i) =>
                              i >= trip.current &&
                              i < trip.stops.length - 1 &&
                              s.id !== child.stopId,
                          )
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} · {s.time}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  <label>
                    {kind === "DELAY"
                      ? "얼마나 늦을까요?"
                      : "전달할 내용 (선택)"}
                    <input
                      name="detail"
                      required={kind === "DELAY"}
                      maxLength={160}
                      placeholder={
                        kind === "DELAY"
                          ? "예: 3분 정도 늦을 것 같아요"
                          : "짧은 메모를 남겨주세요"
                      }
                    />
                  </label>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setKind(null)}>
                      닫기
                    </button>
                    <button className="primary" disabled={busy}>
                      요청 보내기 <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </dialog>
          )}
        </>
      ) : (
        <section className="card empty-small">
          <BusFront size={35} />
          <h2>{message}</h2>
          <p>운영자가 오늘 운행과 아이를 배정하면 이곳에서 확인할 수 있어요.</p>
        </section>
      )}
    </Shell>
  );
}
