import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/seed";
import { transition, Store, Action } from "../lib/trip";
const apply = (s: Store, a: Action) => transition(s, a, "2026-09-12T05:15:00Z");
test("a parent request does not change the pickup before review, and approval changes only the trip", () => {
  let s = seed();
  s = apply(s, {
    type: "REQUEST",
    studentId: "c4",
    kind: "STOP_CHANGE",
    stopId: "s4",
    detail: "망원초에서 탑승",
  });
  assert.equal(s.trip.assignments.c4, "s3");
  s = apply(s, {
    type: "REVIEW",
    id: s.trip.requests[0].id,
    decision: "APPLIED",
  });
  assert.equal(s.trip.assignments.c4, "s4");
  assert.equal(s.students.find((c) => c.id === "c4")?.stopId, "s3");
  assert.equal(s.trip.requests[0].status, "APPLIED");
});
test("cannot move a child to a passed stop", () =>
  assert.throws(() =>
    apply(seed(), {
      type: "REQUEST",
      studentId: "c4",
      kind: "STOP_CHANGE",
      stopId: "s1",
      detail: "변경",
    }),
  ));
test("cannot board in transit or at another stop", () => {
  const s = seed();
  assert.throws(() =>
    apply(s, { type: "BOARD", studentId: "c4", status: "BOARDED" }),
  );
  const arrived = apply(s, { type: "ARRIVE" });
  assert.throws(() =>
    apply(arrived, { type: "BOARD", studentId: "c6", status: "BOARDED" }),
  );
});
test("departure is blocked with waiting children", () =>
  assert.throws(() =>
    apply(apply(seed(), { type: "ARRIVE" }), { type: "DEPART" }),
  ));
test("duplicate boarding cannot silently overwrite state", () => {
  let s = apply(seed(), { type: "ARRIVE" });
  s = apply(s, { type: "BOARD", studentId: "c4", status: "BOARDED" });
  assert.throws(() =>
    apply(s, { type: "BOARD", studentId: "c4", status: "NO_SHOW" }),
  );
});
test("correction preserves original event and adds a correction", () => {
  let s = apply(seed(), { type: "ARRIVE" });
  s = apply(s, { type: "BOARD", studentId: "c4", status: "BOARDED" });
  s = apply(s, { type: "CORRECT", studentId: "c4" });
  assert.equal(s.trip.states.c4, "WAITING");
  assert(
    s.trip.events.some(
      (e) => e.type === "STUDENT_BOARDED" && e.studentId === "c4",
    ),
  );
  assert.equal(s.trip.events[0].type, "BOARDING_CORRECTED");
});
test("boarding is blocked by an unresolved request", () => {
  let s = apply(seed(), {
    type: "REQUEST",
    studentId: "c4",
    kind: "ABSENT",
    detail: "결석",
  });
  s = apply(s, { type: "ARRIVE" });
  assert.throws(() =>
    apply(s, { type: "BOARD", studentId: "c4", status: "BOARDED" }),
  );
});
test("a duplicate pending request is rejected", () => {
  let s = apply(seed(), {
    type: "REQUEST",
    studentId: "c4",
    kind: "ABSENT",
    detail: "결석",
  });
  assert.throws(() =>
    apply(s, {
      type: "REQUEST",
      studentId: "c4",
      kind: "DELAY",
      detail: "3분",
    }),
  );
});
test("withdrawn requests leave boarding intact and cannot be approved", () => {
  let s = apply(seed(), {
    type: "REQUEST",
    studentId: "c4",
    kind: "ABSENT",
    detail: "결석",
  });
  const id = s.trip.requests[0].id;
  s = apply(s, { type: "WITHDRAW", id });
  assert.equal(s.trip.states.c4, "WAITING");
  assert.throws(() => apply(s, { type: "REVIEW", id, decision: "APPLIED" }));
});
test("rejection requires a reason and preserves assignments", () => {
  assert.throws(() =>
    apply(seed(), { type: "REVIEW", id: "r1", decision: "REJECTED" }),
  );
  const s = apply(seed(), {
    type: "REVIEW",
    id: "r1",
    decision: "REJECTED",
    reason: "변경 어려움",
  });
  assert.equal(s.trip.assignments.c6, "s4");
});
test("template changes never rewrite the in-progress trip", () => {
  const initial = seed();
  const changed = structuredClone(initial.template);
  changed[0].name = "새 출발지";
  const s = apply(initial, { type: "SAVE_ROUTE", stops: changed });
  assert.equal(s.template[0].name, "새 출발지");
  assert.equal(s.trip.stops[0].name, "망원역 2번 출구");
  assert.equal(initial.template[0].name, "망원역 2번 출구");
});
test("cannot complete with children on board; full journey succeeds after every dropoff", () => {
  let s = apply(seed(), { type: "REVIEW", id: "r1", decision: "APPLIED" });
  s = apply(s, { type: "ARRIVE" });
  for (const id of ["c4", "c5", "c6"])
    s = apply(s, { type: "BOARD", studentId: id, status: "BOARDED" });
  s = apply(s, { type: "DEPART" });
  s = apply(s, { type: "ARRIVE" });
  s = apply(s, { type: "BOARD", studentId: "c8", status: "NO_SHOW" });
  s = apply(s, { type: "DEPART" });
  s = apply(s, { type: "ARRIVE" });
  assert.throws(() => apply(s, { type: "COMPLETE" }));
  for (const [id, v] of Object.entries(s.trip.states))
    if (v === "BOARDED")
      s = apply(s, { type: "BOARD", studentId: id, status: "DROPPED_OFF" });
  s = apply(s, { type: "COMPLETE" });
  assert.equal(s.trip.status, "COMPLETED");
  assert.throws(() => apply(s, { type: "START" }));
  assert.throws(() =>
    apply(s, {
      type: "REQUEST",
      studentId: "c4",
      kind: "DELAY",
      detail: "지연",
    }),
  );
});
test("pause preserves phase and current stop; GPS loss does not overwrite lifecycle", () => {
  let s = apply(seed(), { type: "ARRIVE" });
  s = apply(s, { type: "PAUSE" });
  s = apply(s, { type: "GPS", lost: true });
  assert.equal(s.trip.status, "PAUSED");
  assert.equal(s.trip.phase, "ARRIVED");
  assert.equal(s.trip.current, 2);
  s = apply(s, { type: "RESUME" });
  assert.equal(s.trip.phase, "ARRIVED");
});
test("cancellation is blocked with a child onboard", () =>
  assert.throws(() => apply(seed(), { type: "CANCEL" })));
test("new trip starts with clean student/request state and snapshots updated template", () => {
  let s = seed();
  s.trip.status = "COMPLETED";
  s = apply(s, { type: "CREATE_TRIP" });
  assert.equal(s.trip.status, "READY");
  assert.equal(s.trip.requests.length, 0);
  assert(Object.values(s.trip.states).every((v) => v === "WAITING"));
  assert.equal(s.trip.assignments.c6, "s4");
});
test("cannot create a replacement trip over a running trip", () =>
  assert.throws(() => apply(seed(), { type: "CREATE_TRIP" })));
