"use client";
import { useState } from "react";
import {
  MapPin,
  Clock3,
  ArrowRight,
  Check,
  BusFront,
  ShieldCheck,
  ChevronDown,
  UserRoundX,
  CarFront,
  Bell,
  Navigation,
  CheckCheck,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { useStore } from "@/components/provider";
import { Badge, Modal } from "@/components/ui";
import { RouteMap } from "@/components/route-map";
import {
  RequestKind,
  activeRequest,
  boardingLabel,
  dateLabel,
  isFinished,
  requestLabel,
  requestStatus,
  timeLabel,
} from "@/lib/trip";
export default function Parent() {
  const { data, act, notify } = useStore();
  const t = data.trip;
  const child = data.students.find((c) => c.id === "c4")!;
  const state = t.states[child.id];
  const stop = t.stops.find((s) => s.id === t.assignments[child.id])!;
  const index = t.stops.findIndex((s) => s.id === stop.id);
  const remaining = Math.max(0, index - t.current);
  const [kind, setKind] = useState<RequestKind | null>(null);
  const [detail, setDetail] = useState("");
  const [target, setTarget] = useState("");
  const [delay, setDelay] = useState("3");
  const [contact, setContact] = useState(false);
  const [history, setHistory] = useState(false);
  const requests = t.requests.filter((r) => r.studentId === child.id);
  const pending = requests.find(activeRequest);
  const terminal = isFinished(t);
  const canRequest =
    state === "WAITING" && !terminal && index >= t.current && !pending;
  const title = terminal
    ? t.status === "CANCELLED"
      ? "오늘 운행이 취소되었어요."
      : "오늘의 이동을 마쳤어요."
    : state === "BOARDED"
      ? "서아가 안전하게 탑승했어요."
      : state === "DROPPED_OFF"
        ? "서아가 센터에 도착했어요."
        : state === "ABSENT"
          ? "오늘은 셔틀을 쉬어가요."
          : state === "SELF_TRANSPORT"
            ? "오늘은 직접 이동해요."
            : state === "NO_SHOW"
              ? "탑승하지 못했어요."
              : t.status === "READY"
                ? "셔틀이 출발을 준비해요."
                : t.status === "PAUSED"
                  ? "셔틀이 잠시 정차 중이에요."
                  : t.gps === "LOST"
                    ? "위치를 확인하고 있어요."
                    : index < t.current
                      ? "탑승 상태 확인이 필요해요."
                      : remaining === 0
                        ? t.phase === "ARRIVED"
                          ? "셔틀이 정차지에 도착했어요."
                          : "셔틀이 곧 도착해요."
                        : `우리 정차지까지 ${remaining}곳 남았어요.`;
  const summary =
    state === "BOARDED"
      ? "센터까지의 여정도 함께 확인할게요."
      : state === "DROPPED_OFF"
        ? "마지막 하차까지 확인했어요."
        : state === "NO_SHOW"
          ? "센터에 연락해 다음 이동 방법을 확인해 주세요."
          : terminal
            ? "운행 종료 후에는 차량 위치를 공유하지 않아요."
            : t.gps === "LOST"
              ? "정확한 위치 대신 마지막 운행 상태를 안내합니다."
              : `예정 ${stop.time}${t.delay ? ` · 현재 ${t.delay}분 지연` : " · 정상 운행 중"}`;
  const open = (k: RequestKind) => {
    setKind(k);
    setDetail("");
    setTarget("");
  };
  const submit = () => {
    if (!kind) return;
    const text =
      kind === "STOP_CHANGE"
        ? `${t.stops.find((s) => s.id === target)?.name ?? ""}에서 탑승할게요. ${detail}`
        : kind === "DELAY"
          ? `약 ${delay}분 늦을 것 같아요. ${detail}`
          : kind === "ABSENT"
            ? `오늘은 결석합니다. ${detail}`
            : `오늘은 보호자가 직접 데려갑니다. ${detail}`;
    if (
      act({
        type: "REQUEST",
        kind,
        studentId: child.id,
        detail: text.trim(),
        stopId: kind === "STOP_CHANGE" ? target : undefined,
      })
    ) {
      setKind(null);
      notify("요청을 전달했어요. 확인 결과를 기다려 주세요.");
    }
  };
  const events = t.events.filter(
    (e) =>
      e.studentId === child.id ||
      (!e.studentId &&
        [
          "TRIP_STARTED",
          "TRIP_COMPLETED",
          "TRIP_CANCELLED",
          "DELAY_UPDATED",
          "TRIP_PAUSED",
          "TRIP_RESUMED",
        ].includes(e.type)),
  );
  return (
    <Shell role="parent">
      <div className="parent-layout">
        <div className="parent-main">
          <div className="role-heading">
            <div>
              <p className="eyebrow">A LITTLE PEACE OF MIND</p>
              <h1>서아의 오늘, 안심으로.</h1>
              <p className="subtitle">
                {dateLabel(t.date)} · {data.organization}
              </p>
            </div>
            <span className="role-avatar peach">
              <Heart size={25} />
            </span>
          </div>
          <section
            className={`parent-hero ${state === "BOARDED" || state === "DROPPED_OFF" ? "success" : ""}`}
          >
            <div className="row-between">
              <Badge tone="light">
                {state === "WAITING"
                  ? "오늘의 등원 셔틀"
                  : boardingLabel[state]}
              </Badge>
              <span className="hero-label">예시 운행</span>
            </div>
            <div className="parent-hero-copy">
              <span className="hero-bus">
                <BusFront size={36} />
              </span>
              <h2>{title}</h2>
              <p>{summary}</p>
            </div>
            <div className="parent-progress">
              <span className="done">
                <Check size={14} />
              </span>
              <i className={t.current >= 2 ? "done" : ""} />
              <span
                className={
                  state === "BOARDED" || state === "DROPPED_OFF"
                    ? "done"
                    : "now"
                }
              >
                <MapPin size={14} />
              </span>
              <i className={state === "DROPPED_OFF" ? "done" : ""} />
              <span className={state === "DROPPED_OFF" ? "done" : ""}>
                <ShieldCheck size={14} />
              </span>
            </div>
            <div className="parent-progress-label">
              <span>셔틀 출발</span>
              <span>서아 탑승</span>
              <span>센터 도착</span>
            </div>
          </section>
          <section className="card parent-map">
            <div className="card-head">
              <h2>셔틀은 지금</h2>
              <Badge tone={t.gps === "LOST" ? "orange" : "gray"}>
                {terminal
                  ? "위치 공유 종료"
                  : t.gps === "LOST"
                    ? "위치 확인 중"
                    : "예시 위치"}
              </Badge>
            </div>
            <RouteMap privateView />
            <div className="parent-map-caption">
              <Navigation size={16} />
              {terminal
                ? "오늘 운행이 종료되었습니다."
                : t.gps === "LOST"
                  ? "위치 수신이 중단되어 차량 표시를 숨겼어요."
                  : `${t.stops[t.current].name} ${t.phase === "ARRIVED" ? "도착" : "방향으로 이동 중"}`}
            </div>
          </section>
          <section className="card child-card">
            <div className="child-profile">
              <span className="child-avatar">
                서아<span>✦</span>
              </span>
              <div>
                <h2>
                  이서아 <span>어린이</span>
                </h2>
                <p>유아체육 1반 · 등원</p>
              </div>
              <Badge tone={state === "WAITING" ? "orange" : "green"}>
                {boardingLabel[state]}
              </Badge>
            </div>
            <div className="child-details">
              <div>
                <MapPin size={18} />
                <span>
                  <small>오늘 탑승지</small>
                  <strong>{stop.name}</strong>
                </span>
              </div>
              <div>
                <Clock3 size={18} />
                <span>
                  <small>예정 시간</small>
                  <strong>{stop.time}</strong>
                </span>
              </div>
            </div>
            <div className="child-driver">
              <BusFront size={17} />
              <span>김성호 기사님 · 12가 3456</span>
              <button className="text-button" onClick={() => setContact(true)}>
                연락 안내 <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </div>
        <aside className="parent-side">
          <section className="card">
            <div className="card-head">
              <h2>오늘 변경이 있나요?</h2>
              <MessageCircle size={19} />
            </div>
            <p className="card-description">
              전화 대신, 필요한 내용을 알려 주세요.
            </p>
            <div className="parent-request-buttons">
              {(
                [
                  ["ABSENT", UserRoundX],
                  ["SELF_TRANSPORT", CarFront],
                  ["DELAY", Clock3],
                  ["STOP_CHANGE", MapPin],
                ] as const
              ).map(([k, Icon]) => (
                <button key={k} disabled={!canRequest} onClick={() => open(k)}>
                  <span>
                    <Icon size={23} />
                  </span>
                  {requestLabel[k]}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <p className="helper">
              {pending
                ? "요청 확인을 기다리고 있어요. 승인 전에는 기존 일정이 유지됩니다."
                : !canRequest
                  ? "현재 운행 상태에서는 새 요청을 보낼 수 없어요."
                  : "변경은 오늘 운행에만 적용돼요."}
            </p>
          </section>
          {requests.length > 0 && (
            <section className="card parent-request-status">
              <div className="card-head">
                <h2>내 요청 현황</h2>
                <Badge tone={pending ? "orange" : "green"}>
                  {pending ? "확인 대기" : "처리 완료"}
                </Badge>
              </div>
              {requests.slice(0, 3).map((r) => (
                <div className="my-request" key={r.id}>
                  <div className="row-between">
                    <strong>{requestLabel[r.kind]}</strong>
                    <small>{timeLabel(r.createdAt)}</small>
                  </div>
                  <p>{r.detail}</p>
                  <div className="request-track">
                    <span className="on">전달</span>
                    <i />
                    <span className={r.status !== "SUBMITTED" ? "on" : ""}>
                      확인
                    </span>
                    <i />
                    <span className={!activeRequest(r) ? "on" : ""}>
                      {requestStatus[r.status]}
                    </span>
                  </div>
                  {r.reason && <div className="notice">{r.reason}</div>}
                  {activeRequest(r) && (
                    <button
                      className="text-button"
                      onClick={() => act({ type: "WITHDRAW", id: r.id })}
                    >
                      요청 취소
                    </button>
                  )}
                </div>
              ))}
            </section>
          )}
          <section className="card parent-notifications">
            <div className="card-head">
              <h2>오늘의 안심 기록</h2>
              <Bell size={18} />
            </div>
            {events.length ? (
              events.slice(0, history ? 30 : 3).map((e) => (
                <div className="activity" key={e.id}>
                  <span className="activity-dot green">
                    <Check size={14} />
                  </span>
                  <div>
                    <p>{e.message}</p>
                    <small>{timeLabel(e.time)}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="helper">운행이 시작되면 기록이 쌓여요.</p>
            )}
            {events.length > 3 && (
              <button
                className="text-button full centered"
                onClick={() => setHistory(!history)}
              >
                {history ? "접기" : "기록 더 보기"} <ChevronDown size={15} />
              </button>
            )}
          </section>
          <div className="parent-assurance">
            <ShieldCheck size={25} />
            <p>
              내 아이의 정보만,
              <br />
              <strong>필요한 순간에만.</strong>
            </p>
            <small>운행이 끝나면 위치 공유도 끝나요.</small>
          </div>
        </aside>
      </div>
      {kind && (
        <Modal title={requestLabel[kind]} onClose={() => setKind(null)}>
          <p className="modal-description">이서아 어린이 · 오늘 등원 운행</p>
          {kind === "STOP_CHANGE" && (
            <label className="field">
              변경할 탑승지
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">정차지를 선택해 주세요</option>
                {t.stops
                  .filter(
                    (s, i) =>
                      i >= t.current &&
                      i < t.stops.length - 1 &&
                      s.id !== stop.id,
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.time}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {kind === "DELAY" && (
            <label className="field">
              얼마나 늦을 것 같나요?
              <select value={delay} onChange={(e) => setDelay(e.target.value)}>
                <option value="3">약 1~3분</option>
                <option value="5">약 3~5분</option>
                <option value="10">약 5~10분</option>
              </select>
            </label>
          )}
          <label className="field">
            추가로 전달할 내용 <span className="muted">선택</span>
            <textarea
              maxLength={100}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="필요한 내용만 짧게 알려 주세요."
            />
          </label>
          <div className="notice">
            {kind === "DELAY"
              ? "요청을 전달해도 차량 대기가 보장되지는 않아요. 운영자의 확인 결과를 기다려 주세요."
              : "운영자가 확인하고 승인하면 오늘 운행에 반영됩니다. 승인 전에는 기존 일정이 유지돼요."}
          </div>
          <button
            className="button primary full"
            disabled={kind === "STOP_CHANGE" && !target}
            onClick={submit}
          >
            요청 보내기 <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {contact && (
        <Modal title="센터 연락 안내" onClose={() => setContact(false)}>
          <p className="modal-description">
            운전 중인 기사님 대신 센터에 연락해 주세요.
          </p>
          <div className="notice">
            프로토타입에는 실제 전화번호를 연결하지 않았어요. 실제 운영에서는
            기관 연락처와 긴급 연락 절차가 표시됩니다.
          </div>
          <button
            className="button primary full"
            onClick={() => setContact(false)}
          >
            확인했어요
          </button>
        </Modal>
      )}
    </Shell>
  );
}
