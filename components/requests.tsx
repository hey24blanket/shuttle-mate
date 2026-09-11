"use client";
import { MapPin, Check, X, Inbox } from "lucide-react";
import { Trip, requestLabels } from "@/lib/model";
import { useShuttle } from "./provider";
import { Pill, timeText } from "./shared";
export function Requests({ trip }: { trip: Trip }) {
  const { dispatch, busy } = useShuttle();
  const children = trip.students.filter(
    (s) => s.request?.status === "SUBMITTED",
  );
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">NEEDS ATTENTION</span>
          <h2>
            확인 대기 요청 <span className="count">{children.length}</span>
          </h2>
        </div>
        <Pill tone={children.length ? "amber" : "green"}>
          {children.length ? "확인이 필요해요" : "모두 확인했어요"}
        </Pill>
      </div>
      {children.length === 0 ? (
        <div className="empty-small">
          <Inbox size={27} />
          <b>새로운 요청이 없어요.</b>
          <p>학부모의 변경 요청이 이곳에 도착합니다.</p>
        </div>
      ) : (
        <div className="request-list">
          {children.map((c) => {
            const r = c.request!;
            return (
              <div className="request-item" key={c.id}>
                <div className="spread">
                  <div className="request-person">
                    <span className="avatar small-avatar">
                      {c.name.slice(-2, -1)}
                    </span>
                    <b>{c.name}</b>
                  </div>
                  <time>{timeText(r.at)}</time>
                </div>
                <h3>{requestLabels[r.kind]}</h3>
                {r.kind === "STOP_CHANGE" && (
                  <p>
                    <MapPin size={14} />
                    {trip.stops.find((s) => s.id === r.targetStopId)?.name}
                  </p>
                )}
                {r.detail && <p>{r.detail}</p>}
                {r.kind === "DELAY" && (
                  <p className="small">
                    요청 확인은 대기 시간을 보장하지 않습니다.
                  </p>
                )}
                <div className="request-actions">
                  <button
                    className="approve"
                    disabled={busy}
                    onClick={() =>
                      dispatch({
                        type: "RESOLVE",
                        tripId: trip.id,
                        studentId: c.id,
                        requestId: r.id,
                        accept: true,
                      })
                    }
                  >
                    <Check size={16} /> 확인·승인
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      dispatch({
                        type: "RESOLVE",
                        tripId: trip.id,
                        studentId: c.id,
                        requestId: r.id,
                        accept: false,
                      })
                    }
                  >
                    <X size={15} /> 반려
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
