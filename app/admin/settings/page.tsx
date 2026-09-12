"use client";
import { useState } from "react";
import {
  Save,
  RotateCcw,
  WifiOff,
  Clock3,
  ShieldCheck,
  FlaskConical,
  Check,
  Building2,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { useStore } from "@/components/provider";
import { SectionTitle, Modal } from "@/components/ui";
import { isFinished } from "@/lib/trip";
export default function Settings() {
  const { data, act, reset, notify } = useStore();
  const [name, setName] = useState(data.organization);
  const [delay, setDelay] = useState(data.trip.delay);
  const [confirm, setConfirm] = useState<"reset" | "cancel" | null>(null);
  return (
    <Shell>
      <SectionTitle
        eyebrow="A THOUGHTFUL OPERATION"
        title="우리 기관에 맞는 운영."
        description="체험 조건을 바꾸고 예외 상황까지 확인해 보세요."
      />
      <div className="settings-grid">
        <section className="card setting-card">
          <div className="card-head">
            <h2>
              <Building2 size={19} />
              기관 정보
            </h2>
          </div>
          <label className="field">
            기관 이름
            <input
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="button primary"
            onClick={() => {
              if (act({ type: "ORGANIZATION", name }))
                notify("기관 이름을 저장했어요.");
            }}
          >
            <Save size={16} />
            저장
          </button>
          <div className="setting-row">
            <div>
              <strong>담당 운전자</strong>
              <p>김성호 · 12가 3456</p>
            </div>
            <span className="tag">체험 배정</span>
          </div>
        </section>
        <section className="card setting-card">
          <div className="card-head">
            <h2>
              <Clock3 size={19} />
              운행 상황 시뮬레이션
            </h2>
          </div>
          <label className="field">
            현재 지연 시간 (분)
            <input
              type="number"
              min="0"
              max="60"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
          </label>
          <button
            className="button"
            disabled={isFinished(data.trip)}
            onClick={() => {
              if (act({ type: "DELAY", minutes: delay }))
                notify("지연 안내를 모든 역할에 반영했어요.");
            }}
          >
            지연 안내 반영
          </button>
          <div className="setting-row">
            <div>
              <strong>위치 수신 중단</strong>
              <p>학부모·운전자 화면의 오류 상태를 체험해요.</p>
            </div>
            <button
              disabled={isFinished(data.trip)}
              className={`toggle ${data.trip.gps === "LOST" ? "on" : ""}`}
              role="switch"
              aria-label="위치 수신 중단 시뮬레이션"
              aria-checked={data.trip.gps === "LOST"}
              onClick={() =>
                act({ type: "GPS", lost: data.trip.gps !== "LOST" })
              }
            >
              <span />
            </button>
          </div>
        </section>
        <section className="card setting-card">
          <div className="card-head">
            <h2>
              <ShieldCheck size={19} />
              프로토타입 범위
            </h2>
          </div>
          <ul className="feature-checks">
            <li>
              <Check size={16} />
              역할별 화면과 운행 상태 연결
            </li>
            <li>
              <Check size={16} />
              요청 확인·승인·반려 및 기록
            </li>
            <li>
              <Check size={16} />
              승하차 확인과 정정, 종료 검사
            </li>
            <li>
              <Check size={16} />
              기본 노선·원생 관리
            </li>
          </ul>
          <div className="notice">
            현재 브라우저의 저장소를 사용하는 체험 앱입니다. 실제 인증, 기기 간
            실시간 공유, GPS·지도 검색, 푸시 알림은 연결하지 않았습니다. 실제
            아동 정보는 입력하지 마세요.
          </div>
        </section>
        <section className="card setting-card">
          <div className="card-head">
            <h2>
              <FlaskConical size={19} />
              체험 관리
            </h2>
          </div>
          <p className="card-description">
            새로운 시나리오를 체험하려면 운행을 끝낸 뒤 대시보드에서 새 운행을
            만들거나, 데이터를 초기화해 주세요.
          </p>
          <button className="button full" onClick={() => setConfirm("reset")}>
            <RotateCcw size={17} />
            체험 데이터 처음으로
          </button>
          <button
            className="button full danger-outline"
            disabled={isFinished(data.trip)}
            onClick={() => setConfirm("cancel")}
          >
            현재 운행 취소
          </button>
          <p className="helper">
            탑승 중인 아동이 있으면 운행을 취소할 수 없습니다.
          </p>
        </section>
      </div>
      {confirm && (
        <Modal
          title={
            confirm === "reset"
              ? "체험을 처음부터 다시 할까요?"
              : "현재 운행을 취소할까요?"
          }
          onClose={() => setConfirm(null)}
        >
          <p className="modal-description">
            {confirm === "reset"
              ? "이 브라우저에 저장한 체험 변경과 기록이 지워지고 처음의 예시 운행으로 돌아갑니다."
              : "학부모에게 운행 취소 상태가 표시되고, 현재 운행의 추가 변경이 중지됩니다."}
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => setConfirm(null)}>
              돌아가기
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (confirm === "reset") {
                  reset();
                  setConfirm(null);
                } else if (act({ type: "CANCEL" })) setConfirm(null);
              }}
            >
              {confirm === "reset" ? "초기화" : "운행 취소"}
            </button>
          </div>
        </Modal>
      )}
    </Shell>
  );
}
