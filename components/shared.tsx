"use client";
import { BusFront, Check, MapPin, ArrowUpRight, Clock3 } from "lucide-react";
import { Trip, tripLabels, StudentState, boardingLabels } from "@/lib/model";
export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
export function TripBadge({ trip }: { trip: Trip }) {
  return (
    <Pill
      tone={
        trip.status === "COMPLETED"
          ? "green"
          : trip.status === "CANCELLED"
            ? "red"
            : trip.status === "READY"
              ? "amber"
              : "green"
      }
    >
      <span className="status-dot" />
      {tripLabels[trip.status]}
    </Pill>
  );
}
export function ChildBadge({ child }: { child: StudentState }) {
  return (
    <Pill
      tone={
        ["BOARDED", "DROPPED_OFF"].includes(child.boarding)
          ? "green"
          : child.boarding === "NO_SHOW"
            ? "red"
            : "neutral"
      }
    >
      {boardingLabels[child.boarding]}
    </Pill>
  );
}
export function timeText(at?: number) {
  return at
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(at)
    : "—";
}
export function Timeline({
  trip,
  privateView = false,
}: {
  trip: Trip;
  privateView?: boolean;
}) {
  return (
    <div className="timeline">
      {trip.stops.map((stop, i) => {
        const done = trip.status === "COMPLETED" || i < trip.current;
        const current = trip.status !== "COMPLETED" && i === trip.current;
        return (
          <div
            key={stop.id}
            className={`stop-row ${done ? "done" : ""} ${current ? "current" : ""}`}
          >
            <div className="stop-track">
              <span>
                {done ? (
                  <Check size={15} />
                ) : current ? (
                  <BusFront size={16} />
                ) : (
                  i + 1
                )}
              </span>
            </div>
            <div className="stop-body">
              <div className="spread">
                <b>{stop.name}</b>
                <time>{stop.time}</time>
              </div>
              <div className="stop-details">
                {current ? (
                  <span className="current-label">
                    {trip.status === "READY"
                      ? "첫 정차지"
                      : trip.status === "ARRIVED"
                        ? "현재 정차 중"
                        : "다음 정차지"}
                  </span>
                ) : (
                  <span>
                    {done
                      ? "확인 완료"
                      : i === trip.stops.length - 1
                        ? "최종 목적지"
                        : "도착 예정"}
                  </span>
                )}
                {!privateView &&
                  trip.students
                    .filter((s) => s.stopId === stop.id)
                    .map((s) => (
                      <span
                        className={`child-chip ${s.request?.status === "SUBMITTED" ? "attention" : ""}`}
                        key={s.id}
                      >
                        {s.name}
                        {s.boarding !== "SCHEDULED" &&
                          ` · ${boardingLabels[s.boarding]}`}
                        {s.request?.status === "SUBMITTED" && " · 요청"}
                      </span>
                    ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function JourneyMap({ trip, stopId }: { trip: Trip; stopId?: string }) {
  const own = trip.stops.find((x) => x.id === stopId),
    target = own || trip.stops[trip.current];
  const fresh =
    trip.live?.active &&
    trip.live.updatedAt &&
    Date.now() - trip.live.updatedAt < 60000;
  return (
    <div className="journey-map">
      <div className="map-water" />
      <div className="map-park park-one" />
      <div className="map-park park-two" />
      <div className="map-grid" />
      <svg
        viewBox="0 0 600 250"
        preserveAspectRatio="none"
        className="map-route"
        aria-hidden="true"
      >
        <path
          d="M70 185 L170 185 Q190 185 190 165 L190 85 Q190 65 215 65 L375 65 Q395 65 395 85 L395 160 L535 160"
          fill="none"
          stroke="#fff"
          strokeWidth="12"
        />
        <path
          d="M70 185 L170 185 Q190 185 190 165 L190 85 Q190 65 215 65 L375 65 Q395 65 395 85 L395 160 L535 160"
          fill="none"
          stroke="#daa63b"
          strokeWidth="5"
          strokeDasharray="7 5"
        />
      </svg>
      <span className="map-label label-one">탑승 안내</span>
      <span className="map-label label-two">정차지</span>
      <div className="map-pin start-pin">
        <BusFront size={20} />
      </div>
      <div className="map-pin destination-pin">
        <MapPin size={21} />
        <span>{target?.name || "정차지"}</span>
      </div>
      <div className="map-caption">
        <span>
          <MapPin size={13} /> 노선 안내 그림 · 실제 위치 아님
        </span>
        {target?.lat && target?.lng && (
          <a
            href={`https://map.kakao.com/link/map/${encodeURIComponent(target.name)},${target.lat},${target.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            지도 열기 <ArrowUpRight size={13} />
          </a>
        )}
      </div>
      <div className="map-status">
        <Clock3 size={13} />
        {fresh ? (
          <a
            href={`https://map.kakao.com/link/map/${encodeURIComponent("셔틀 위치")},${trip.live.lat},${trip.live.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            차량 위치 보기 · {timeText(trip.live.updatedAt)}
          </a>
        ) : (
          "차량 위치 수신 대기"
        )}
      </div>
    </div>
  );
}
