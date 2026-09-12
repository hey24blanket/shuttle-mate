"use client";
import { useState } from "react";
import {
  MapPin,
  Clock3,
  UserRoundX,
  ArrowRight,
  Check,
  CheckCheck,
  MessageSquare,
} from "lucide-react";
import { useStore } from "./provider";
import { Badge, Modal, Empty } from "./ui";
import {
  activeRequest,
  ChangeRequest,
  requestLabel,
  requestStatus,
  timeLabel,
} from "@/lib/trip";
export function Requests({ compact = false }: { compact?: boolean }) {
  const { data, act, notify } = useStore();
  const [review, setReview] = useState<ChangeRequest | null>(null);
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState("pending");
  const pending = data.trip.requests.filter(activeRequest);
  const shown =
    tab === "pending"
      ? pending
      : data.trip.requests.filter((r) => !activeRequest(r));
  return (
    <>
      <div className="card-head">
        <h2>
          확인이 필요한 요청{" "}
          <span className="count-orange">{pending.length}</span>
        </h2>
        <MessageSquare size={18} />
      </div>
      {!compact && (
        <div className="tabs">
          <button
            className={tab === "pending" ? "active" : ""}
            onClick={() => setTab("pending")}
          >
            확인 대기 {pending.length}
          </button>
          <button
            className={tab === "done" ? "active" : ""}
            onClick={() => setTab("done")}
          >
            처리 완료
          </button>
        </div>
      )}
      <div className="request-list">
        {shown.length ? (
          shown.map((r) => {
            const child = data.students.find((c) => c.id === r.studentId);
            return (
              <div className="request-item" key={r.id}>
                <div
                  className={`request-icon ${r.kind === "STOP_CHANGE" ? "orange" : "blue"}`}
                >
                  {r.kind === "STOP_CHANGE" ? (
                    <MapPin size={19} />
                  ) : r.kind === "DELAY" ? (
                    <Clock3 size={19} />
                  ) : (
                    <UserRoundX size={19} />
                  )}
                </div>
                <div className="request-body">
                  <div className="row-between">
                    <strong>{child?.name}</strong>
                    <small>{timeLabel(r.createdAt)}</small>
                  </div>
                  <p>{requestLabel[r.kind]}</p>
                  <span className="request-detail">{r.detail}</span>
                  <div className="row-between request-bottom">
                    <Badge tone={activeRequest(r) ? "orange" : "gray"}>
                      {requestStatus[r.status]}
                    </Badge>
                    {activeRequest(r) && (
                      <button
                        className="text-button"
                        onClick={() => {
                          setReview(r);
                          setReason("");
                        }}
                      >
                        요청 확인 <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <Empty
            title={
              tab === "pending"
                ? "모든 요청을 확인했어요"
                : "처리한 요청이 없어요"
            }
            text={
              tab === "pending"
                ? "새로운 요청이 오면 여기에 표시됩니다."
                : "확인한 요청의 결과가 여기에 남아요."
            }
          />
        )}
      </div>
      {review && (
        <Modal
          title={requestLabel[review.kind] + " 요청"}
          onClose={() => setReview(null)}
        >
          <div className="review-child">
            <span className="avatar peach">
              {data.students
                .find((c) => c.id === review.studentId)
                ?.name.slice(0, 1)}
            </span>
            <div>
              <h3>
                {data.students.find((c) => c.id === review.studentId)?.name}
              </h3>
              <p>유아체육 1반 · 보호자 요청</p>
            </div>
          </div>
          <blockquote>{review.detail}</blockquote>
          {review.kind === "STOP_CHANGE" && (
            <div className="change-preview">
              <span>
                {
                  data.trip.stops.find(
                    (s) => s.id === data.trip.assignments[review.studentId],
                  )?.name
                }
              </span>
              <ArrowRight size={17} />
              <strong>
                {data.trip.stops.find((s) => s.id === review.stopId)?.name}
              </strong>
            </div>
          )}
          <div className="notice">
            승인하면 오늘 운행에만 반영됩니다.{" "}
            {review.kind === "DELAY"
              ? "지연 요청 확인은 차량 대기를 약속하는 것이 아닙니다."
              : "기본 노선과 원생의 기본 탑승지는 유지됩니다."}
          </div>
          <label className="field">
            반영이 어려운 경우, 이유를 알려 주세요
            <textarea
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 이미 지난 정차지라 변경이 어려워요."
            />
          </label>
          <div className="modal-actions">
            <button
              className="button"
              onClick={() => {
                if (
                  act({
                    type: "REVIEW",
                    id: review.id,
                    decision: "REJECTED",
                    reason,
                  })
                ) {
                  setReview(null);
                  notify("요청 결과를 기록했어요.");
                }
              }}
            >
              반영 어려움
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (
                  act({ type: "REVIEW", id: review.id, decision: "APPLIED" })
                ) {
                  setReview(null);
                  notify("오늘 운행에 반영했어요.");
                }
              }}
            >
              <Check size={17} /> 승인하고 반영
            </button>
          </div>
          <button
            className="text-button full centered"
            onClick={() => {
              if (act({ type: "REVIEW", id: review.id, decision: "SEEN" })) {
                setReview(null);
                notify("확인 중 상태로 변경했어요.");
              }
            }}
          >
            확인 중으로 표시
          </button>
        </Modal>
      )}
    </>
  );
}
