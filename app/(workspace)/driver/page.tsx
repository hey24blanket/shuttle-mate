"use client";
import { useState, useEffect, useRef } from "react";
import {
  BusFront,
  MapPin,
  ArrowRight,
  Check,
  ShieldCheck,
  Navigation,
  Radio,
  Clock3,
} from "lucide-react";
import { useShuttle } from "@/components/provider";
import { Shell } from "@/components/shell";
import { Timeline, TripBadge, Pill, ChildBadge } from "@/components/shared";
import { Requests } from "@/components/requests";
import { today } from "@/lib/model";
export default function DriverPage() {
  const { state, actor, dispatch, busy, demo, setError } = useShuttle();
  const trip =
    state &&
    Object.values(state.trips).find(
      (t) => t.date === today() && t.driverId === actor?.uid,
    );
  const [gps, setGps] = useState(false),
    [gpsText, setGpsText] = useState("위치 공유 꺼짐");
  const watch = useRef<number | null>(null),
    last = useRef(0),
    send = useRef(dispatch),
    active = useRef(false);
  send.current = dispatch;
  useEffect(() => {
    active.current = gps;
  }, [gps]);
  useEffect(() => {
    if (!gps || !trip || !["RUNNING", "ARRIVED"].includes(trip.status)) {
      if (watch.current !== null)
        navigator.geolocation?.clearWatch(watch.current);
      watch.current = null;
      return;
    }
    active.current = true;
    if (demo) {
      setGpsText("체험에서는 위치를 수집하지 않아요");
      return;
    }
    if (!navigator.geolocation) {
      setGpsText("위치 기능을 지원하지 않습니다");
      return;
    }
    let alive = true;
    let wake: WakeLockSentinel | null = null;
    const wakeUp = async () => {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          const w = await navigator.wakeLock.request("screen");
          if (alive) wake = w;
          else await w.release();
        }
      } catch {}
    };
    void wakeUp();
    document.addEventListener("visibilitychange", wakeUp);
    setGpsText("위치 확인 중…");
    watch.current = navigator.geolocation.watchPosition(
      async (p) => {
        if (!alive || !active.current || Date.now() - last.current < 5000)
          return;
        last.current = Date.now();
        const ok = await send.current({
          type: "GPS",
          tripId: trip.id,
          active: true,
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        });
        if (alive) setGpsText(ok ? "위치 공유 중" : "위치를 전송하지 못했어요");
      },
      (e) => {
        setGpsText(
          e.code === 1
            ? "위치 권한을 허용해주세요"
            : "위치를 확인하지 못했어요",
        );
        void send.current({ type: "GPS", tripId: trip.id, active: false });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => {
      alive = false;
      active.current = false;
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
      void wake?.release();
      document.removeEventListener("visibilitychange", wakeUp);
    };
  }, [gps, trip?.id, trip?.status, demo]);
  useEffect(() => {
    if (trip && ["COMPLETED", "CANCELLED"].includes(trip.status)) {
      setGps(false);
      setGpsText("운행 종료 · 위치 공유 중지");
    }
  }, [trip?.status]);
  const stop = trip?.stops[trip.current],
    lastStop = trip ? trip.current === trip.stops.length - 1 : false,
    children =
      trip?.students.filter((c) =>
        lastStop
          ? ["BOARDED", "DROPPED_OFF"].includes(c.boarding)
          : c.stopId === stop?.id,
      ) || [];
  return (
    <Shell
      role="driver"
      title="오늘도 안전하게 출발해요."
      subtitle="정차 후 승하차를 확인해주세요. 다음 행동을 크게 보여드릴게요."
      action={
        <Pill>
          <Clock3 size={14} />
          {today()}
        </Pill>
      }
    >
      {trip ? (
        <div className="driver-grid">
          <div>
            <section className="driver-focus">
              <div className="spread">
                <TripBadge trip={trip} />
                <span className="small">
                  {trip.current + 1} / {trip.stops.length} 정차지
                </span>
              </div>
              <span className="eyebrow">
                {trip.status === "READY"
                  ? "첫 번째 정차지"
                  : lastStop
                    ? "최종 목적지"
                    : trip.status === "ARRIVED"
                      ? "현재 정차지"
                      : "다음 정차지"}
              </span>
              <h2>{stop?.name}</h2>
              <div className="focus-meta">
                <span>
                  <Clock3 size={18} />
                  {stop?.time} 예정
                </span>
                <span>
                  <UsersIcon />
                  {children.length}명 {lastStop ? "하차 확인" : "탑승 대상"}
                </span>
              </div>
              <div className="driver-main-action">
                {trip.status === "READY" ? (
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={async () => {
                      if (await dispatch({ type: "START", tripId: trip.id }))
                        setGps(!demo);
                    }}
                  >
                    <BusFront size={22} /> 운행 시작 <ArrowRight size={20} />
                  </button>
                ) : trip.status === "RUNNING" ? (
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      dispatch({ type: "ARRIVE", tripId: trip.id })
                    }
                  >
                    <MapPin size={22} />{" "}
                    {lastStop ? "센터 도착" : "현재 정차지 도착"}{" "}
                    <ArrowRight size={20} />
                  </button>
                ) : trip.status === "ARRIVED" ? (
                  <>
                    <div className="boarding-list">
                      {children.map((c) => (
                        <div className="boarding-child" key={c.id}>
                          <div>
                            <h3>{c.name}</h3>
                            <ChildBadge child={c} />
                          </div>
                          {lastStop ? (
                            c.boarding === "BOARDED" ? (
                              <button
                                className="approve"
                                disabled={busy}
                                onClick={() =>
                                  dispatch({
                                    type: "BOARD",
                                    tripId: trip.id,
                                    studentId: c.id,
                                    status: "DROPPED_OFF",
                                  })
                                }
                              >
                                <Check size={20} /> 하차 확인
                              </button>
                            ) : (
                              <Check size={23} />
                            )
                          ) : c.boarding === "SCHEDULED" ? (
                            <div className="boarding-actions">
                              <button
                                className="approve"
                                disabled={busy}
                                onClick={() =>
                                  dispatch({
                                    type: "BOARD",
                                    tripId: trip.id,
                                    studentId: c.id,
                                    status: "BOARDED",
                                  })
                                }
                              >
                                <Check size={20} /> 탑승
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    confirm(
                                      `${c.name} 어린이가 탑승하지 않았나요?`,
                                    )
                                  )
                                    void dispatch({
                                      type: "BOARD",
                                      tripId: trip.id,
                                      studentId: c.id,
                                      status: "NO_SHOW",
                                    });
                                }}
                              >
                                미탑승
                              </button>
                            </div>
                          ) : ["BOARDED", "NO_SHOW"].includes(c.boarding) ? (
                            <button
                              className="text-button"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  confirm(
                                    `${c.name}의 처리를 취소하고 다시 확인할까요?`,
                                  )
                                )
                                  void dispatch({
                                    type: "BOARD",
                                    tripId: trip.id,
                                    studentId: c.id,
                                    status: "SCHEDULED",
                                  });
                              }}
                            >
                              되돌리기
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={async () => {
                        if (lastStop) {
                          if (confirm("모든 아이가 안전하게 하차했나요?"))
                            await dispatch({
                              type: "COMPLETE",
                              tripId: trip.id,
                            });
                        } else
                          await dispatch({ type: "DEPART", tripId: trip.id });
                      }}
                    >
                      {lastStop ? (
                        <ShieldCheck size={21} />
                      ) : (
                        <ArrowRight size={21} />
                      )}{" "}
                      {lastStop
                        ? "확인 완료 · 운행 마치기"
                        : "출발 · 다음 정차지"}
                    </button>
                  </>
                ) : (
                  <div className="completed-note">
                    <ShieldCheck size={28} />
                    {trip.status === "COMPLETED"
                      ? "오늘도 수고하셨습니다. 운행 기록이 저장되었어요."
                      : "취소된 운행입니다."}
                  </div>
                )}
              </div>
              <div className="driver-safety">
                <ShieldCheck size={16} /> 차량을 정차한 뒤 조작해주세요.
              </div>
            </section>
            <section className="card gps-card">
              <div>
                <Radio size={20} />
                <div>
                  <b>{gpsText}</b>
                  <small>
                    {demo
                      ? "체험 모드 · 실제 GPS 수집 없음"
                      : "운행 중 앱을 화면에 열어두세요."}
                  </small>
                </div>
              </div>
              <button
                disabled={busy || !["RUNNING", "ARRIVED"].includes(trip.status)}
                onClick={async () => {
                  if (gps) {
                    active.current = false;
                    setGps(false);
                    setGpsText("위치 공유 꺼짐");
                    if (!demo)
                      await dispatch({
                        type: "GPS",
                        tripId: trip.id,
                        active: false,
                      });
                  } else setGps(true);
                }}
              >
                {gps ? "공유 중지" : "위치 공유"}
              </button>
            </section>
            <Requests trip={trip} />
          </div>
          <div>
            <section className="card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR ROUTE</span>
                  <h2>오늘의 노선</h2>
                </div>
                <Navigation size={19} />
              </div>
              <div className="route-info">
                <b>{trip.routeName}</b>
                <span>{trip.vehicle}</span>
              </div>
              <Timeline trip={trip} />
            </section>
            <section className="card delay-card">
              <h2>운행 지연 안내</h2>
              <p>예정 시간보다 늦어지면 공유해주세요.</p>
              <div className="delay-buttons">
                {[0, 5, 10, 15].map((m) => (
                  <button
                    key={m}
                    disabled={
                      busy || ["COMPLETED", "CANCELLED"].includes(trip.status)
                    }
                    className={trip.delay === m ? "selected" : ""}
                    onClick={() =>
                      dispatch({ type: "DELAY", tripId: trip.id, minutes: m })
                    }
                  >
                    {m === 0 ? "정상" : `+${m}분`}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <section className="card empty-small">
          <BusFront size={35} />
          <h2>오늘 배정된 운행이 없어요.</h2>
          <p>운영자가 운행을 생성하고 기사님을 배정하면 시작할 수 있어요.</p>
        </section>
      )}
    </Shell>
  );
}
function UsersIcon() {
  return <BusFront size={18} />;
}
