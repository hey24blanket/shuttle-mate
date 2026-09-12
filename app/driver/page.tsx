"use client";
import { useState } from "react";
import {
  BusFront,
  MapPin,
  ArrowRight,
  Check,
  CheckCheck,
  Navigation,
  Pause,
  Play,
  ShieldCheck,
  Undo2,
  AlertTriangle,
  Map,
  Route,
  WifiOff,
  Users,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { useStore } from "@/components/provider";
import { Badge, Modal } from "@/components/ui";
import { RouteMap } from "@/components/route-map";
import { Requests } from "@/components/requests";
import {
  boardingLabel,
  activeRequest,
  isFinished,
  statusLabel,
  studentsAt,
  dateLabel,
  Boarding,
} from "@/lib/trip";
export default function Driver() {
  const { data, act, notify } = useStore();
  const t = data.trip;
  const [tab, setTab] = useState("timeline");
  const [confirm, setConfirm] = useState<{
    id: string;
    correct?: boolean;
  } | null>(null);
  const [requests, setRequests] = useState(false);
  const stop = t.stops[t.current];
  const final = t.current === t.stops.length - 1;
  const pending = t.requests.filter(activeRequest).length;
  const currentChildren = final
    ? data.students.filter(
        (c) => t.states[c.id] === "BOARDED" || t.states[c.id] === "DROPPED_OFF",
      )
    : studentsAt(data, stop.id);
  const finished = isFinished(t);
  const onboard = Object.values(t.states).filter((v) => v === "BOARDED").length;
  const primary = () => {
    if (t.status === "READY") act({ type: "START" });
    else if (t.status === "PAUSED") act({ type: "RESUME" });
    else if (t.phase === "MOVING") act({ type: "ARRIVE" });
    else if (final) {
      if (act({ type: "COMPLETE" }))
        notify("모든 하차를 확인하고 운행을 마쳤어요.");
    } else act({ type: "DEPART" });
  };
  return (
    <Shell role="driver">
      <div className="driver-layout">
        <div className="driver-main">
          <div className="role-heading">
            <div>
              <p className="eyebrow">DRIVER · 오늘의 여정</p>
              <h1>안전한 운행, 함께해요.</h1>
              <p className="subtitle">김성호 기사님 · {dateLabel(t.date)}</p>
            </div>
            <span className="role-avatar">
              <BusFront size={26} />
            </span>
          </div>
          <div className={`driver-status ${t.gps === "LOST" ? "warning" : ""}`}>
            <Badge tone={finished ? "gray" : "green"}>
              {statusLabel[t.status]}
            </Badge>
            <span>
              {t.gps === "LOST" ? (
                <>
                  <WifiOff size={15} /> 위치 수신 중단
                </>
              ) : (
                <>
                  <span className="live-dot" />
                  예시 위치 · 체험 운행
                </>
              )}
            </span>
            <span>12가 3456</span>
          </div>
          {t.gps === "LOST" && (
            <div className="notice warning">
              <AlertTriangle size={18} />
              위치를 확인할 수 없어요. 학부모에게는 마지막 운행 상태만
              안내됩니다.
            </div>
          )}
          {pending > 0 && (
            <button className="driver-alert" onClick={() => setRequests(true)}>
              <span>
                <AlertTriangle size={18} />
                확인하지 않은 요청 {pending}건
              </span>
              <span>
                정차 후 확인 <ArrowRight size={16} />
              </span>
            </button>
          )}
          <div className="driver-trip-heading">
            <div>
              <h2>
                유아체육 1반 <span className="tag">등원</span>
              </h2>
              <p>망원역 → 리틀스텝 체육센터</p>
            </div>
            <div className="segmented">
              <button
                className={tab === "timeline" ? "active" : ""}
                onClick={() => setTab("timeline")}
                aria-label="타임라인 보기"
              >
                <Route size={17} />
              </button>
              <button
                className={tab === "map" ? "active" : ""}
                onClick={() => setTab("map")}
                aria-label="지도 보기"
              >
                <Map size={17} />
              </button>
            </div>
          </div>
          {finished ? (
            <div className="completion-card">
              <span>
                <ShieldCheck size={42} />
              </span>
              <h2>
                {t.status === "COMPLETED"
                  ? "오늘도 안전하게 도착했어요."
                  : "운행이 취소되었어요."}
              </h2>
              <p>
                {t.status === "COMPLETED"
                  ? "마지막 하차까지 모두 확인했습니다."
                  : "운영자 화면에서 다음 운행을 준비할 수 있어요."}
              </p>
              <Badge tone="gray">위치 공유 종료</Badge>
            </div>
          ) : tab === "map" ? (
            <RouteMap />
          ) : (
            <div className="metro-timeline">
              {t.stops.map((s, i) => {
                const current = i === t.current;
                const past = i < t.current;
                return (
                  <div
                    className={`metro-stop ${current ? "current" : ""} ${past ? "past" : ""}`}
                    key={s.id}
                  >
                    <div className="metro-rail">
                      <span>
                        {past ? (
                          <Check size={15} />
                        ) : current ? (
                          <BusFront size={19} />
                        ) : (
                          i + 1
                        )}
                      </span>
                    </div>
                    <div className="metro-content">
                      <div className="metro-title">
                        <div>
                          <small>
                            {past
                              ? "지나온 정차지"
                              : current
                                ? t.phase === "ARRIVED"
                                  ? "도착 · 승하차 확인"
                                  : "이번 정차지"
                                : "다음 여정"}
                          </small>
                          <h3>{s.name}</h3>
                        </div>
                        <span>{s.time}</span>
                      </div>
                      {current ? (
                        <>
                          <p className="stop-address">
                            <MapPin size={13} />
                            {s.address}
                          </p>
                          <div className="current-children">
                            {currentChildren.length ? (
                              currentChildren.map((c) => {
                                const state = t.states[c.id];
                                const request = t.requests.find(
                                  (r) =>
                                    r.studentId === c.id && activeRequest(r),
                                );
                                return (
                                  <div className="boarding-child" key={c.id}>
                                    <div className="row-between">
                                      <strong>{c.name}</strong>
                                      <Badge
                                        tone={
                                          state === "BOARDED" ||
                                          state === "DROPPED_OFF"
                                            ? "green"
                                            : state === "WAITING"
                                              ? "orange"
                                              : "gray"
                                        }
                                      >
                                        {boardingLabel[state]}
                                      </Badge>
                                    </div>
                                    {request && (
                                      <button
                                        className="text-button orange-text"
                                        onClick={() => setRequests(true)}
                                      >
                                        변경 요청 확인 필요{" "}
                                        <ArrowRight size={14} />
                                      </button>
                                    )}
                                    {t.phase === "ARRIVED" &&
                                      t.status === "RUNNING" &&
                                      (state === "WAITING" ? (
                                        <div className="boarding-actions">
                                          <button
                                            className="button"
                                            onClick={() =>
                                              setConfirm({ id: c.id })
                                            }
                                          >
                                            미탑승
                                          </button>
                                          <button
                                            className="button primary"
                                            onClick={() =>
                                              act({
                                                type: "BOARD",
                                                studentId: c.id,
                                                status: "BOARDED",
                                              })
                                            }
                                          >
                                            <Check size={18} />
                                            탑승 확인
                                          </button>
                                        </div>
                                      ) : final && state === "BOARDED" ? (
                                        <button
                                          className="button primary full"
                                          onClick={() =>
                                            act({
                                              type: "BOARD",
                                              studentId: c.id,
                                              status: "DROPPED_OFF",
                                            })
                                          }
                                        >
                                          <CheckCheck size={18} />
                                          안전하게 하차했어요
                                        </button>
                                      ) : (
                                        (state === "BOARDED" ||
                                          state === "NO_SHOW" ||
                                          state === "DROPPED_OFF") && (
                                          <button
                                            className="text-button"
                                            onClick={() =>
                                              setConfirm({
                                                id: c.id,
                                                correct: true,
                                              })
                                            }
                                          >
                                            <Undo2 size={14} />
                                            잘못 눌렀어요 · 정정
                                          </button>
                                        )
                                      ))}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="muted">
                                이 정차지에는 확인할 아동이 없어요.
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="stop-summary">
                          {i === t.stops.length - 1
                            ? "전원 하차 확인"
                            : studentsAt(data, s.id)
                                .map((c) => c.name)
                                .join(" · ") || "배정 아동 없음"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!finished && (
            <div className="driver-actionbar">
              <p>
                <ShieldCheck size={14} />
                안전하게 정차한 후 조작해 주세요.
              </p>
              <button
                className="button primary driver-primary"
                onClick={primary}
              >
                {t.status === "READY" ? (
                  <Play size={22} />
                ) : t.status === "PAUSED" ? (
                  <Play size={22} />
                ) : t.phase === "MOVING" ? (
                  <MapPin size={22} />
                ) : final ? (
                  <CheckCheck size={22} />
                ) : (
                  <Navigation size={22} />
                )}{" "}
                {t.status === "READY"
                  ? "운행 시작"
                  : t.status === "PAUSED"
                    ? "운행 다시 시작"
                    : t.phase === "MOVING"
                      ? `${final ? "센터" : "현재 정차지"} 도착`
                      : final
                        ? "하차 확인 완료 · 운행 종료"
                        : "출발 · 다음 정차지로"}
                <ArrowRight size={21} />
              </button>
            </div>
          )}
        </div>
        <aside className="driver-side">
          <div className="card">
            <div className="card-head">
              <h2>운행 체크</h2>
              <ShieldCheck size={20} />
            </div>
            <div className="driver-metrics">
              <div>
                <Users size={20} />
                <strong>
                  {onboard}
                  <small>명</small>
                </strong>
                <span>현재 탑승 중</span>
              </div>
              <div>
                <Route size={20} />
                <strong>
                  {finished ? t.stops.length : t.current}
                  <small> / {t.stops.length}</small>
                </strong>
                <span>지나온 정차지</span>
              </div>
            </div>
            <div className="notice">
              모든 아이가 내린 것을 확인한 후 운행을 종료해 주세요.
            </div>
            {t.status === "RUNNING" && (
              <button
                className="button full"
                onClick={() => act({ type: "PAUSE" })}
              >
                <Pause size={16} />
                안전한 곳에서 일시 정차
              </button>
            )}
          </div>
          <div className="card driver-help">
            <p className="eyebrow">ONE STEP AT A TIME</p>
            <h3>
              다음 한 가지에만
              <br />
              집중할 수 있도록.
            </h3>
            <p>
              도착하고, 아이를 확인하고,
              <br />
              다음 정차지로 출발해요.
            </p>
            <div className="step-dots">
              <i />
              <span />
              <i />
              <span />
              <i />
            </div>
            <small>도착 → 탑승 확인 → 출발</small>
          </div>
        </aside>
      </div>
      {requests && (
        <Modal title="오늘의 변경 요청" onClose={() => setRequests(false)}>
          <Requests compact />
        </Modal>
      )}
      {confirm && (
        <Modal
          title={
            confirm.correct
              ? "승하차 기록을 정정할까요?"
              : "미탑승으로 기록할까요?"
          }
          onClose={() => setConfirm(null)}
        >
          <p className="modal-description">
            <strong>
              {data.students.find((c) => c.id === confirm.id)?.name}
            </strong>
            {confirm.correct
              ? "의 현재 정차지 처리 결과를 되돌립니다. 이전 기록과 정정 기록은 모두 남습니다."
              : " 아동이 탑승하지 않았음을 기록합니다. 보호자 화면에서도 미탑승 상태가 표시됩니다."}
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => setConfirm(null)}>
              돌아가기
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (
                  act(
                    confirm.correct
                      ? { type: "CORRECT", studentId: confirm.id }
                      : {
                          type: "BOARD",
                          studentId: confirm.id,
                          status: "NO_SHOW",
                        },
                  )
                )
                  setConfirm(null);
              }}
            >
              {confirm.correct ? "기록 정정" : "미탑승 확인"}
            </button>
          </div>
        </Modal>
      )}
    </Shell>
  );
}
