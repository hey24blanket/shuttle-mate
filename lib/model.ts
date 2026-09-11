export type Role = "parent" | "driver" | "admin";
export type Boarding =
  | "SCHEDULED"
  | "BOARDED"
  | "NO_SHOW"
  | "DROPPED_OFF"
  | "ABSENT"
  | "SELF_TRANSPORT";
export type RequestKind =
  "ABSENT" | "SELF_TRANSPORT" | "DELAY" | "STOP_CHANGE" | "NORMAL";
export type Actor = {
  uid: string;
  role: Role;
  orgId: string;
  studentIds: string[];
  displayName: string;
};
export type Stop = {
  id: string;
  name: string;
  time: string;
  order: number;
  lat?: number;
  lng?: number;
};
export type Student = {
  id: string;
  name: string;
  crew: string;
  stopId: string;
};
export type ChangeRequest = {
  id: string;
  kind: RequestKind;
  detail: string;
  targetStopId: string;
  status: "SUBMITTED" | "APPLIED" | "REJECTED";
  at: number;
  resolvedAt?: number;
};
export type StudentState = Student & {
  boarding: Boarding;
  request?: ChangeRequest;
  boardedAt?: number;
  droppedOffAt?: number;
};
export type TripEvent = {
  id: string;
  at: number;
  actor: string;
  text: string;
  studentId: string | null;
};
export type Trip = {
  id: string;
  date: string;
  routeName: string;
  driverId: string;
  driverName: string;
  vehicle: string;
  status: "READY" | "RUNNING" | "ARRIVED" | "COMPLETED" | "CANCELLED";
  current: number;
  delay: number;
  stops: Stop[];
  students: StudentState[];
  events: TripEvent[];
  startedAt?: number;
  completedAt?: number;
  live: {
    active: boolean;
    lat?: number;
    lng?: number;
    updatedAt?: number;
    accuracy?: number;
  };
};
export type Store = {
  version: 1;
  revision: number;
  route: {
    name: string;
    driverId: string;
    driverName: string;
    vehicle: string;
    stops: Stop[];
    students: Student[];
  };
  trips: Record<string, Trip>;
  selectedTripId: string;
};
export type Command =
  | { type: "CREATE_TRIP"; date: string }
  | {
      type: "START" | "ARRIVE" | "DEPART" | "COMPLETE" | "CANCEL";
      tripId: string;
    }
  | {
      type: "BOARD";
      tripId: string;
      studentId: string;
      status: "BOARDED" | "NO_SHOW" | "SCHEDULED" | "DROPPED_OFF";
    }
  | {
      type: "REQUEST";
      tripId: string;
      studentId: string;
      kind: RequestKind;
      detail: string;
      targetStopId: string;
    }
  | {
      type: "RESOLVE";
      tripId: string;
      studentId: string;
      requestId: string;
      accept: boolean;
    }
  | { type: "DELAY"; tripId: string; minutes: number }
  | {
      type: "GPS";
      tripId: string;
      active: boolean;
      lat?: number;
      lng?: number;
      accuracy?: number;
    }
  | { type: "SAVE_ROUTE"; route: Store["route"] };
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export const requestLabels: Record<RequestKind, string> = {
  ABSENT: "오늘 결석",
  SELF_TRANSPORT: "직접 데려가요",
  DELAY: "조금 늦어요",
  STOP_CHANGE: "탑승 장소 변경",
  NORMAL: "정상 탑승으로 변경",
};
export const boardingLabels: Record<Boarding, string> = {
  SCHEDULED: "탑승 대기",
  BOARDED: "탑승 완료",
  NO_SHOW: "미탑승",
  DROPPED_OFF: "하차 완료",
  ABSENT: "결석",
  SELF_TRANSPORT: "직접 이동",
};
export const tripLabels: Record<Trip["status"], string> = {
  READY: "운행 준비",
  RUNNING: "운행 중",
  ARRIVED: "정차 중",
  COMPLETED: "운행 완료",
  CANCELLED: "운행 취소",
};
