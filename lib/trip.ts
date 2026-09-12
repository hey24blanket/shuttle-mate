export type Boarding =
  | "WAITING"
  | "BOARDED"
  | "NO_SHOW"
  | "DROPPED_OFF"
  | "ABSENT"
  | "SELF_TRANSPORT";
export type RequestKind = "ABSENT" | "SELF_TRANSPORT" | "DELAY" | "STOP_CHANGE";
export type Stop = {
  id: string;
  name: string;
  time: string;
  address: string;
  x: number;
  y: number;
};
export type Student = {
  id: string;
  name: string;
  className: string;
  stopId: string;
  guardian: string;
};
export type ChangeRequest = {
  id: string;
  studentId: string;
  kind: RequestKind;
  detail: string;
  stopId?: string;
  status: "SUBMITTED" | "SEEN" | "APPLIED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  reason?: string;
};
export type TripEvent = {
  id: string;
  type: string;
  message: string;
  time: string;
  actor: string;
  studentId?: string;
};
export type Trip = {
  id: string;
  date: string;
  status: "READY" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";
  phase: "MOVING" | "ARRIVED";
  current: number;
  stops: Stop[];
  states: Record<string, Boarding>;
  assignments: Record<string, string>;
  requests: ChangeRequest[];
  events: TripEvent[];
  delay: number;
  gps: "DEMO" | "LOST";
  updatedAt: string;
};
export type Store = {
  version: 1;
  template: Stop[];
  students: Student[];
  trip: Trip;
  notifications: boolean;
  organization: string;
};
export type Action =
  | {
      type:
        | "START"
        | "ARRIVE"
        | "DEPART"
        | "COMPLETE"
        | "PAUSE"
        | "RESUME"
        | "CANCEL";
    }
  | { type: "BOARD"; studentId: string; status: Boarding }
  | { type: "CORRECT"; studentId: string }
  | {
      type: "REQUEST";
      studentId: string;
      kind: RequestKind;
      detail: string;
      stopId?: string;
    }
  | {
      type: "REVIEW";
      id: string;
      decision: "SEEN" | "APPLIED" | "REJECTED";
      reason?: string;
    }
  | { type: "WITHDRAW"; id: string }
  | { type: "DELAY"; minutes: number }
  | { type: "GPS"; lost: boolean }
  | { type: "SAVE_ROUTE"; stops: Stop[] }
  | { type: "ADD_STUDENT"; student: Student }
  | { type: "CREATE_TRIP" }
  | { type: "NOTIFICATIONS"; enabled: boolean }
  | { type: "ORGANIZATION"; name: string };
export const boardingLabel: Record<Boarding, string> = {
  WAITING: "탑승 대기",
  BOARDED: "탑승 완료",
  NO_SHOW: "미탑승",
  DROPPED_OFF: "하차 완료",
  ABSENT: "오늘 결석",
  SELF_TRANSPORT: "직접 이동",
};
export const requestLabel: Record<RequestKind, string> = {
  ABSENT: "오늘 결석",
  SELF_TRANSPORT: "직접 데려감",
  DELAY: "조금 늦어요",
  STOP_CHANGE: "탑승 장소 변경",
};
export const requestStatus = {
  SUBMITTED: "확인 대기",
  SEEN: "확인 중",
  APPLIED: "반영 완료",
  REJECTED: "반영 어려움",
  WITHDRAWN: "요청 취소",
};
export const statusLabel = {
  READY: "운행 준비",
  RUNNING: "운행 중",
  PAUSED: "일시 정차",
  COMPLETED: "운행 완료",
  CANCELLED: "운행 취소",
};
export const activeRequest = (r: ChangeRequest) =>
  r.status === "SUBMITTED" || r.status === "SEEN";
export const isFinished = (t: Trip) =>
  t.status === "COMPLETED" || t.status === "CANCELLED";
export const studentsAt = (s: Store, id: string) =>
  s.students.filter((c) => s.trip.assignments[c.id] === id);
export function timeLabel(time: string) {
  return new Date(time).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}
export function dateLabel(date: string) {
  return new Date(date + "T00:00:00+09:00").toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  });
}
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export function transition(
  original: Store,
  action: Action,
  now = new Date().toISOString(),
): Store {
  const s: Store = structuredClone(original);
  const t = s.trip;
  const log = (
    type: string,
    message: string,
    actor = "운전자",
    studentId?: string,
  ) =>
    t.events.unshift({
      id: crypto.randomUUID(),
      type,
      message,
      actor,
      studentId,
      time: now,
    });
  const available = () =>
    check(
      !isFinished(t),
      "종료된 운행은 변경할 수 없어요. 새 운행을 만들어 주세요.",
    );
  const name = (id: string) =>
    s.students.find((c) => c.id === id)?.name ?? "아동";
  const currentStop = t.stops[t.current];
  switch (action.type) {
    case "START":
      check(t.status === "READY", "준비된 운행만 시작할 수 있어요.");
      t.status = "RUNNING";
      log("TRIP_STARTED", "셔틀 운행을 시작했습니다.");
      break;
    case "ARRIVE":
      check(
        t.status === "RUNNING" && t.phase === "MOVING",
        "이동 중일 때 도착할 수 있어요.",
      );
      t.phase = "ARRIVED";
      log("STOP_ARRIVED", `${currentStop.name}에 도착했습니다.`);
      break;
    case "BOARD": {
      check(
        t.status === "RUNNING" && t.phase === "ARRIVED",
        "정차지 도착 후 승하차를 확인해 주세요.",
      );
      check(
        t.states[action.studentId] !== undefined,
        "이 운행에 배정된 아동이 아니에요.",
      );
      const before = t.states[action.studentId];
      const final = t.current === t.stops.length - 1;
      if (action.status === "DROPPED_OFF")
        check(
          final && before === "BOARDED",
          "센터 도착 후 탑승 아동의 하차를 확인해 주세요.",
        );
      else {
        check(
          t.assignments[action.studentId] === currentStop.id,
          "현재 정차지의 아동만 처리할 수 있어요.",
        );
        check(
          before === "WAITING",
          "이미 처리된 아동이에요. 정정 기능을 이용해 주세요.",
        );
        check(
          action.status === "BOARDED" || action.status === "NO_SHOW",
          "올바른 탑승 상태가 아니에요.",
        );
        check(
          !t.requests.some(
            (r) => r.studentId === action.studentId && activeRequest(r),
          ),
          "이 아동의 변경 요청을 먼저 확인해 주세요.",
        );
      }
      t.states[action.studentId] = action.status;
      log(
        "STUDENT_" + action.status,
        `${name(action.studentId)} · ${boardingLabel[action.status]}`,
        "운전자",
        action.studentId,
      );
      break;
    }
    case "CORRECT": {
      check(
        t.status === "RUNNING" && t.phase === "ARRIVED",
        "정차 중에만 최근 승하차를 정정할 수 있어요.",
      );
      const before = t.states[action.studentId];
      check(
        ((before === "BOARDED" || before === "NO_SHOW") &&
          t.assignments[action.studentId] === currentStop.id) ||
          (before === "DROPPED_OFF" && t.current === t.stops.length - 1),
        "현재 정차지의 승하차만 정정할 수 있어요.",
      );
      t.states[action.studentId] =
        before === "DROPPED_OFF" ? "BOARDED" : "WAITING";
      log(
        "BOARDING_CORRECTED",
        `${name(action.studentId)} · ${boardingLabel[before]} 기록 정정`,
        "운전자",
        action.studentId,
      );
      break;
    }
    case "DEPART":
      check(
        t.status === "RUNNING" && t.phase === "ARRIVED",
        "도착 처리 후 출발해 주세요.",
      );
      check(
        t.current < t.stops.length - 1,
        "마지막 정차지에서는 운행을 종료해 주세요.",
      );
      check(
        !studentsAt(s, currentStop.id).some(
          (c) => t.states[c.id] === "WAITING",
        ),
        "탑승 여부를 확인하지 않은 아동이 있어요.",
      );
      check(
        !t.requests.some(
          (r) =>
            activeRequest(r) && t.assignments[r.studentId] === currentStop.id,
        ),
        "현재 정차지의 요청을 먼저 확인해 주세요.",
      );
      log("STOP_DEPARTED", `${currentStop.name}에서 출발했습니다.`);
      t.current++;
      t.phase = "MOVING";
      break;
    case "COMPLETE":
      check(
        t.status === "RUNNING" &&
          t.phase === "ARRIVED" &&
          t.current === t.stops.length - 1,
        "센터 도착 후 운행을 종료해 주세요.",
      );
      check(
        !Object.values(t.states).some(
          (v) => v === "WAITING" || v === "BOARDED",
        ),
        "모든 아동의 탑승 결과와 하차를 먼저 확인해 주세요.",
      );
      check(!t.requests.some(activeRequest), "처리하지 않은 요청이 있어요.");
      t.status = "COMPLETED";
      log(
        "TRIP_COMPLETED",
        "모든 아동 확인 완료 · 운행을 종료했습니다. 위치 공유도 종료됩니다.",
      );
      break;
    case "PAUSE":
      check(t.status === "RUNNING", "운행 중에만 일시 정차할 수 있어요.");
      t.status = "PAUSED";
      log("TRIP_PAUSED", "안전한 곳에서 일시 정차했습니다.");
      break;
    case "RESUME":
      check(t.status === "PAUSED", "일시 정차한 운행이 아니에요.");
      t.status = "RUNNING";
      log("TRIP_RESUMED", "운행을 다시 시작했습니다.");
      break;
    case "CANCEL":
      available();
      check(
        !Object.values(t.states).some((v) => v === "BOARDED"),
        "탑승 중인 아동이 있어요. 안전한 하차 확인 후 종료해 주세요.",
      );
      t.status = "CANCELLED";
      log("TRIP_CANCELLED", "운행이 취소되었습니다.", "운영자");
      break;
    case "REQUEST": {
      available();
      check(
        t.states[action.studentId] === "WAITING",
        "탑승 전 대기 중인 아동만 요청할 수 있어요.",
      );
      check(
        !t.requests.some(
          (r) => r.studentId === action.studentId && activeRequest(r),
        ),
        "진행 중인 요청이 있어요. 처리 후 다시 요청해 주세요.",
      );
      check(
        t.stops.findIndex((v) => v.id === t.assignments[action.studentId]) >=
          t.current,
        "이미 지난 정차지에는 요청할 수 없어요.",
      );
      if (action.kind === "STOP_CHANGE")
        check(
          t.stops.some(
            (v, i) =>
              v.id === action.stopId &&
              i >= t.current &&
              i < t.stops.length - 1 &&
              v.id !== t.assignments[action.studentId],
          ),
          "아직 지나지 않은 다른 탑승지를 선택해 주세요.",
        );
      check(
        action.detail.trim().length > 0 && action.detail.length <= 200,
        "요청 내용을 200자 이내로 입력해 주세요.",
      );
      t.requests.unshift({
        id: crypto.randomUUID(),
        studentId: action.studentId,
        kind: action.kind,
        detail: action.detail,
        stopId: action.stopId,
        status: "SUBMITTED",
        createdAt: now,
      });
      log(
        "REQUEST_SUBMITTED",
        `${name(action.studentId)} · ${requestLabel[action.kind]} 요청`,
        "학부모",
        action.studentId,
      );
      break;
    }
    case "REVIEW": {
      available();
      const r = t.requests.find((r) => r.id === action.id);
      check(r && activeRequest(r), "이미 처리된 요청이에요.");
      if (action.decision === "SEEN") {
        r.status = "SEEN";
        log(
          "REQUEST_SEEN",
          `${name(r.studentId)} · 요청 확인 중`,
          "운영자",
          r.studentId,
        );
        break;
      }
      if (action.decision === "REJECTED")
        check(action.reason?.trim(), "반영이 어려운 이유를 알려 주세요.");
      if (action.decision === "APPLIED") {
        check(
          t.states[r.studentId] === "WAITING",
          "아동 상태가 변경되었어요. 요청을 반려하고 다시 확인해 주세요.",
        );
        if (r.kind === "STOP_CHANGE") {
          check(
            t.stops.some(
              (v, i) =>
                v.id === r.stopId && i >= t.current && i < t.stops.length - 1,
            ),
            "이미 지나간 정차지로 바꿀 수 없어요.",
          );
          t.assignments[r.studentId] = r.stopId!;
        }
        if (r.kind === "ABSENT" || r.kind === "SELF_TRANSPORT")
          t.states[r.studentId] = r.kind;
      }
      r.status = action.decision;
      r.reason = action.reason;
      log(
        "REQUEST_" + action.decision,
        `${name(r.studentId)} · ${requestLabel[r.kind]} ${action.decision === "APPLIED" ? "반영 완료" : "반영 어려움"}`,
        "운영자",
        r.studentId,
      );
      break;
    }
    case "WITHDRAW": {
      available();
      const r = t.requests.find((r) => r.id === action.id);
      check(r && activeRequest(r), "대기 중인 요청만 취소할 수 있어요.");
      r.status = "WITHDRAWN";
      log(
        "REQUEST_WITHDRAWN",
        `${name(r.studentId)} · 요청 취소`,
        "학부모",
        r.studentId,
      );
      break;
    }
    case "DELAY":
      available();
      check(
        Number.isInteger(action.minutes) &&
          action.minutes >= 0 &&
          action.minutes <= 60,
        "지연 시간은 0~60분으로 입력해 주세요.",
      );
      t.delay = action.minutes;
      log(
        "DELAY_UPDATED",
        action.minutes
          ? `예정 시간보다 ${action.minutes}분 지연됩니다.`
          : "정상 운행 시간으로 돌아왔습니다.",
        "운영자",
      );
      break;
    case "GPS":
      available();
      t.gps = action.lost ? "LOST" : "DEMO";
      log(
        "GPS_STATUS",
        action.lost
          ? "위치 수신 중단 상황을 시뮬레이션합니다."
          : "위치 수신을 복구했습니다.",
        "체험",
      );
      break;
    case "SAVE_ROUTE":
      check(action.stops.length >= 2, "정차지는 2곳 이상 필요해요.");
      check(
        new Set(action.stops.map((v) => v.id)).size === action.stops.length,
        "중복된 정차지예요.",
      );
      check(
        action.stops.every(
          (v) => v.name.trim() && /^\d{2}:\d{2}$/.test(v.time),
        ),
        "정차지 이름과 시간을 확인해 주세요.",
      );
      check(
        action.stops.every((v, i) => !i || v.time >= action.stops[i - 1].time),
        "정차 순서에 맞게 예정 시간을 입력해 주세요.",
      );
      s.template = structuredClone(action.stops);
      log(
        "TEMPLATE_UPDATED",
        "기본 노선 저장 · 진행 중인 오늘 운행은 유지됩니다.",
        "운영자",
      );
      break;
    case "ADD_STUDENT":
      check(action.student.name.trim(), "아동 이름을 입력해 주세요.");
      check(
        !s.students.some((c) => c.id === action.student.id),
        "이미 등록된 아동이에요.",
      );
      check(
        s.template.some((v) => v.id === action.student.stopId),
        "기본 정차지를 선택해 주세요.",
      );
      s.students.push(action.student);
      log(
        "ROSTER_UPDATED",
        `${action.student.name} 등록 · 다음 운행부터 배정됩니다.`,
        "운영자",
      );
      break;
    case "CREATE_TRIP": {
      check(
        isFinished(t),
        "현재 운행을 종료하거나 취소한 후 새 운행을 만들어 주세요.",
      );
      const states: Record<string, Boarding> = {};
      const assignments: Record<string, string> = {};
      s.students.forEach((c) => {
        states[c.id] = "WAITING";
        assignments[c.id] = s.template.some((v) => v.id === c.stopId)
          ? c.stopId
          : s.template[0].id;
      });
      s.trip = {
        id: crypto.randomUUID(),
        date: today(),
        status: "READY",
        phase: "MOVING",
        current: 0,
        stops: structuredClone(s.template),
        states,
        assignments,
        requests: [],
        events: [...t.events],
        delay: 0,
        gps: "DEMO",
        updatedAt: now,
      };
      s.trip.events.unshift({
        id: crypto.randomUUID(),
        type: "TRIP_CREATED",
        message: "기본 노선으로 새 운행을 준비했습니다.",
        actor: "운영자",
        time: now,
      });
      break;
    }
    case "NOTIFICATIONS":
      s.notifications = action.enabled;
      break;
    case "ORGANIZATION":
      check(action.name.trim(), "기관 이름을 입력해 주세요.");
      s.organization = action.name.trim();
      break;
  }
  s.trip.updatedAt = now;
  return s;
}
