import {
  Actor,
  Command,
  Store,
  Trip,
  StudentState,
  today,
  requestLabels,
  boardingLabels,
} from "./model";
function ensure(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
const final = (s: StudentState) =>
  ["BOARDED", "NO_SHOW", "DROPPED_OFF", "ABSENT", "SELF_TRANSPORT"].includes(
    s.boarding,
  );
export function makeTrip(route: Store["route"], date: string): Trip {
  return {
    id: `${date}-pickup`,
    date,
    routeName: route.name,
    driverId: route.driverId,
    driverName: route.driverName,
    vehicle: route.vehicle,
    status: "READY",
    current: 0,
    delay: 0,
    stops: structuredClone(route.stops).sort((a, b) => a.order - b.order),
    students: route.students.map((s) => ({ ...s, boarding: "SCHEDULED" })),
    events: [],
    live: { active: false },
  };
}
export function sampleStore(): Store {
  const route: Store["route"] = {
    name: "유아체육 1반 · 등원",
    driverId: "demo-driver",
    driverName: "김안전 기사님",
    vehicle: "서울 12가 3456",
    stops: [
      {
        id: "s1",
        name: "망원역 2번 출구",
        time: "14:00",
        order: 0,
        lat: 37.5559,
        lng: 126.9105,
      },
      {
        id: "s2",
        name: "진평925 앞",
        time: "14:08",
        order: 1,
        lat: 37.5578,
        lng: 126.9065,
      },
      {
        id: "s3",
        name: "드림빌아파트 정문",
        time: "14:15",
        order: 2,
        lat: 37.561,
        lng: 126.899,
      },
      {
        id: "s4",
        name: "망원초등학교 정문",
        time: "14:22",
        order: 3,
        lat: 37.563,
        lng: 126.901,
      },
      {
        id: "s5",
        name: "튼튼체육센터",
        time: "14:30",
        order: 4,
        lat: 37.562,
        lng: 126.904,
      },
    ],
    students: [
      { id: "c1", name: "김민준", crew: "유아체육 1반", stopId: "s2" },
      { id: "c2", name: "이서아", crew: "유아체육 1반", stopId: "s3" },
      { id: "c3", name: "박도윤", crew: "유아체육 1반", stopId: "s4" },
      { id: "c4", name: "최하린", crew: "유아체육 1반", stopId: "s3" },
    ],
  };
  const trip = makeTrip(route, today());
  return {
    version: 1,
    revision: 0,
    route,
    trips: { [trip.id]: trip },
    selectedTripId: trip.id,
  };
}
export function applyCommand(
  input: Store,
  cmd: Command,
  actor: Actor,
  eventId: string,
  at = Date.now(),
): Store {
  const s = structuredClone(input);
  ensure(
    ["parent", "driver", "admin"].includes(actor.role),
    "등록된 역할이 필요합니다.",
  );
  if (cmd.type === "SAVE_ROUTE") {
    ensure(actor.role === "admin", "운영자만 기본 노선을 편집할 수 있습니다.");
    const r = cmd.route;
    ensure(
      r &&
        typeof r.name === "string" &&
        r.name.trim().length > 0 &&
        r.name.length <= 80,
      "노선 이름을 확인해주세요.",
    );
    ensure(
      typeof r.driverId === "string" &&
        r.driverId.length > 0 &&
        typeof r.driverName === "string" &&
        typeof r.vehicle === "string",
      "운전자와 차량 정보를 확인해주세요.",
    );
    ensure(
      Array.isArray(r.stops) && r.stops.length >= 2 && r.stops.length <= 50,
      "정차지는 2~50곳이어야 합니다.",
    );
    ensure(
      new Set(r.stops.map((x) => x.id)).size === r.stops.length,
      "정차지 ID가 중복됩니다.",
    );
    ensure(
      r.stops.every(
        (x) =>
          typeof x.id === "string" &&
          /^[\w-]{1,100}$/.test(x.id) &&
          typeof x.name === "string" &&
          x.name.trim() &&
          x.name.length <= 80 &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(x.time),
      ),
      "정차지 이름과 시간을 확인해주세요.",
    );
    ensure(
      Array.isArray(r.students) &&
        r.students.length <= 200 &&
        new Set(r.students.map((x) => x.id)).size === r.students.length,
      "학생 목록을 확인해주세요.",
    );
    ensure(
      r.students.every(
        (x) =>
          typeof x.name === "string" &&
          x.name.trim() &&
          x.name.length <= 40 &&
          typeof x.crew === "string" &&
          /^[\w-]{1,100}$/.test(x.id) &&
          r.stops.slice(0, -1).some((p) => p.id === x.stopId),
      ),
      "학생은 도착지를 제외한 탑승 정차지에 배정해주세요.",
    );
    s.route = structuredClone(r);
    s.route.stops.forEach((x, i) => (x.order = i));
    s.revision++;
    return s;
  }
  if (cmd.type === "CREATE_TRIP") {
    ensure(actor.role === "admin", "운영자만 운행을 생성할 수 있습니다.");
    ensure(
      /^\d{4}-\d{2}-\d{2}$/.test(cmd.date) && !isNaN(Date.parse(cmd.date)),
      "날짜를 확인해주세요.",
    );
    const t = makeTrip(s.route, cmd.date);
    ensure(!s.trips[t.id], "이 날짜의 운행은 이미 있습니다.");
    s.trips[t.id] = t;
    s.selectedTripId = t.id;
    s.revision++;
    return s;
  }
  const t = s.trips[cmd.tripId];
  ensure(t, "운행을 찾을 수 없습니다.");
  t.events = t.events || [];
  t.students = t.students || [];
  if (t.events.some((e) => e.id === eventId)) return input;
  if (actor.role === "driver")
    ensure(t.driverId === actor.uid, "배정된 운행만 관리할 수 있습니다.");
  if (actor.role === "parent")
    ensure(
      cmd.type === "REQUEST" && actor.studentIds.includes(cmd.studentId),
      "내 아이의 변경 요청만 보낼 수 있습니다.",
    );
  ensure(
    !["COMPLETED", "CANCELLED"].includes(t.status),
    "종료된 운행은 변경할 수 없습니다.",
  );
  const log = (text: string, studentId: string | null = null) =>
    t.events.push({ id: eventId, at, actor: actor.uid, text, studentId });
  if (cmd.type === "START") {
    ensure(t.status === "READY", "시작할 수 없는 상태입니다.");
    ensure(t.date === today(), "오늘 날짜의 운행만 시작할 수 있습니다.");
    t.status = "RUNNING";
    t.startedAt = at;
    log("셔틀이 출발했습니다.");
  }
  if (cmd.type === "ARRIVE") {
    ensure(t.status === "RUNNING", "이동 중에 도착 처리할 수 있습니다.");
    t.status = "ARRIVED";
    log(`${t.stops[t.current].name}에 도착했습니다.`);
  }
  if (cmd.type === "DEPART") {
    ensure(
      t.status === "ARRIVED" && t.current < t.stops.length - 1,
      "정차 상태를 확인해주세요.",
    );
    ensure(
      t.students.filter((x) => x.stopId === t.stops[t.current].id).every(final),
      "탑승 또는 미탑승을 모두 확인해주세요.",
    );
    ensure(
      !t.students.some(
        (x) =>
          x.request?.status === "SUBMITTED" &&
          (x.stopId === t.stops[t.current].id ||
            x.request.targetStopId === t.stops[t.current].id),
      ),
      "현재 정차지의 변경 요청을 먼저 확인해주세요.",
    );
    log(`${t.stops[t.current].name}에서 출발했습니다.`);
    t.current++;
    t.status = "RUNNING";
  }
  if (cmd.type === "BOARD") {
    ensure(t.status === "ARRIVED", "정차지 도착 후 승하차를 확인해주세요.");
    const child = t.students.find((x) => x.id === cmd.studentId);
    ensure(child, "학생을 찾을 수 없습니다.");
    ensure(
      ["BOARDED", "NO_SHOW", "SCHEDULED", "DROPPED_OFF"].includes(cmd.status),
      "올바르지 않은 상태입니다.",
    );
    if (cmd.status === "DROPPED_OFF")
      ensure(
        t.current === t.stops.length - 1 && child.boarding === "BOARDED",
        "센터 도착 후 탑승한 아이의 하차를 확인해주세요.",
      );
    else {
      ensure(
        child.stopId === t.stops[t.current].id,
        "현재 정차지의 아이만 처리할 수 있습니다.",
      );
      ensure(
        ["SCHEDULED", "BOARDED", "NO_SHOW"].includes(child.boarding),
        "결석·직접 이동 상태를 먼저 변경해주세요.",
      );
    }
    child.boarding = cmd.status;
    if (cmd.status === "BOARDED") child.boardedAt = at;
    if (cmd.status === "SCHEDULED") {
      delete child.boardedAt;
      delete child.droppedOffAt;
    }
    if (cmd.status === "DROPPED_OFF") child.droppedOffAt = at;
    log(`${child.name} · ${boardingLabels[cmd.status]}`, child.id);
  }
  if (cmd.type === "REQUEST") {
    const child = t.students.find((x) => x.id === cmd.studentId);
    ensure(child, "학생을 찾을 수 없습니다.");
    ensure(
      !["BOARDED", "DROPPED_OFF", "NO_SHOW"].includes(child.boarding),
      "승하차 처리 후에는 변경을 요청할 수 없습니다.",
    );
    ensure(
      t.stops.findIndex((p) => p.id === child.stopId) >= t.current,
      "이미 지난 정차지입니다.",
    );
    ensure(
      Object.keys(requestLabels).includes(cmd.kind) &&
        typeof cmd.detail === "string" &&
        cmd.detail.length <= 160,
      "요청 내용을 확인해주세요.",
    );
    ensure(
      child.request?.status !== "SUBMITTED",
      "이전 요청이 확인된 뒤 다시 요청해주세요.",
    );
    if (cmd.kind === "STOP_CHANGE")
      ensure(
        t.stops.some(
          (p, i) =>
            p.id === cmd.targetStopId &&
            i >= t.current &&
            i < t.stops.length - 1 &&
            p.id !== child.stopId,
        ),
        "아직 지나지 않은 다른 탑승지를 선택해주세요.",
      );
    child.request = {
      id: eventId,
      kind: cmd.kind,
      detail: cmd.detail,
      targetStopId: cmd.kind === "STOP_CHANGE" ? cmd.targetStopId : "",
      status: "SUBMITTED",
      at,
    };
    log(`${child.name} · ${requestLabels[cmd.kind]} 요청`, child.id);
  }
  if (cmd.type === "RESOLVE") {
    const child = t.students.find((x) => x.id === cmd.studentId);
    ensure(
      child?.request?.status === "SUBMITTED" &&
        child.request.id === cmd.requestId,
      "이미 처리되었거나 변경된 요청입니다.",
    );
    const r = child.request;
    if (cmd.accept) {
      ensure(
        !["BOARDED", "DROPPED_OFF", "NO_SHOW"].includes(child.boarding),
        "승하차가 처리되었습니다. 요청을 반려해주세요.",
      );
      if (r.kind === "STOP_CHANGE") {
        ensure(
          t.stops.findIndex((p) => p.id === r.targetStopId) >= t.current,
          "변경할 정차지를 이미 지났습니다.",
        );
        child.stopId = r.targetStopId;
      }
      if (r.kind === "ABSENT" || r.kind === "SELF_TRANSPORT")
        child.boarding = r.kind;
      if (r.kind === "NORMAL") child.boarding = "SCHEDULED";
    }
    r.status = cmd.accept ? "APPLIED" : "REJECTED";
    r.resolvedAt = at;
    log(
      `${child.name} · ${requestLabels[r.kind]} ${cmd.accept ? "승인" : "반려"}`,
      child.id,
    );
  }
  if (cmd.type === "DELAY") {
    ensure(
      Number.isInteger(cmd.minutes) && cmd.minutes >= 0 && cmd.minutes <= 120,
      "지연은 0~120분으로 입력해주세요.",
    );
    t.delay = cmd.minutes;
    log(`운행 지연 ${cmd.minutes}분으로 안내했습니다.`);
  }
  if (cmd.type === "GPS") {
    ensure(
      t.status === "RUNNING" || t.status === "ARRIVED",
      "운행 중에만 위치를 공유할 수 있습니다.",
    );
    if (cmd.active)
      ensure(
        Number.isFinite(cmd.lat) &&
          Number.isFinite(cmd.lng) &&
          Math.abs(cmd.lat!) <= 90 &&
          Math.abs(cmd.lng!) <= 180 &&
          Number.isFinite(cmd.accuracy) &&
          cmd.accuracy! >= 0,
        "위치 정보를 확인해주세요.",
      );
    t.live = cmd.active
      ? {
          active: true,
          lat: cmd.lat!,
          lng: cmd.lng!,
          accuracy: cmd.accuracy!,
          updatedAt: at,
        }
      : { active: false };
  }
  if (cmd.type === "COMPLETE") {
    ensure(
      t.status === "ARRIVED" && t.current === t.stops.length - 1,
      "최종 목적지에 먼저 도착해주세요.",
    );
    ensure(
      t.students.every((x) =>
        ["DROPPED_OFF", "NO_SHOW", "ABSENT", "SELF_TRANSPORT"].includes(
          x.boarding,
        ),
      ),
      "모든 아이의 탑승 결과와 하차를 확인해주세요.",
    );
    ensure(
      !t.students.some((x) => x.request?.status === "SUBMITTED"),
      "확인 대기 요청을 먼저 처리해주세요.",
    );
    t.status = "COMPLETED";
    t.completedAt = at;
    t.live = { active: false };
    log("모든 아이를 확인하고 운행을 마쳤습니다.");
  }
  if (cmd.type === "CANCEL") {
    ensure(actor.role === "admin", "운영자만 운행을 취소할 수 있습니다.");
    ensure(
      !t.students.some((x) => x.boarding === "BOARDED"),
      "탑승 중인 아이의 하차를 먼저 확인해주세요.",
    );
    t.status = "CANCELLED";
    t.live = { active: false };
    log("운영자가 운행을 취소했습니다.");
  }
  s.revision++;
  return s;
}
export function visibleStore(source: Store, actor: Actor): Store {
  const s = structuredClone(source);
  for (const [id, t] of Object.entries(s.trips)) {
    t.students = t.students || [];
    t.events = t.events || [];
    if (
      (actor.role === "driver" && t.driverId !== actor.uid) ||
      (actor.role === "parent" &&
        !t.students.some((c) => actor.studentIds.includes(c.id)))
    ) {
      delete s.trips[id];
      continue;
    }
    if (actor.role === "parent") {
      t.students = t.students.filter((c) => actor.studentIds.includes(c.id));
      t.events = t.events
        .filter((e) => !e.studentId || actor.studentIds.includes(e.studentId))
        .map((e) => ({ ...e, actor: "" }));
    }
    if (
      t.status === "COMPLETED" ||
      t.status === "CANCELLED" ||
      !t.live?.updatedAt ||
      Date.now() - t.live.updatedAt > 60000
    )
      t.live = { active: false };
  }
  if (actor.role !== "admin") s.route = { ...s.route, students: [], stops: [] };
  if (!s.trips[s.selectedTripId])
    s.selectedTripId = Object.keys(s.trips).sort().at(-1) || "";
  return s;
}
