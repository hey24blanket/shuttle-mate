import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCommand, sampleStore, visibleStore } from "../lib/engine";
import { Actor, Command, Store, today } from "../lib/model";
const admin: Actor = {
  uid: "admin",
  role: "admin",
  orgId: "org",
  studentIds: [],
  displayName: "운영자",
};
const driver: Actor = { ...admin, uid: "demo-driver", role: "driver" };
const parent: Actor = {
  ...admin,
  uid: "parent",
  role: "parent",
  studentIds: ["c2"],
};
function scenario() {
  let s = sampleStore();
  const id = s.selectedTripId;
  let n = 0;
  return {
    id,
    get state() {
      return s;
    },
    get trip() {
      return s.trips[id];
    },
    run(c: Command, a = driver) {
      s = applyCommand(s, c, a, `e${++n}`);
      return s;
    },
  };
}
test("complete journey requires individual boarding and final drop-off", () => {
  const c = scenario();
  c.run({ type: "START", tripId: c.id });
  for (let i = 0; i < 5; i++) {
    c.run({ type: "ARRIVE", tripId: c.id });
    if (i === 4) {
      assert.throws(() => c.run({ type: "COMPLETE", tripId: c.id }), /하차/);
      for (const child of c.trip.students)
        c.run({
          type: "BOARD",
          tripId: c.id,
          studentId: child.id,
          status: "DROPPED_OFF",
        });
      c.run({ type: "COMPLETE", tripId: c.id });
    } else {
      const children = c.trip.students.filter(
        (s) => s.stopId === c.trip.stops[i].id,
      );
      if (children.length)
        assert.throws(
          () => c.run({ type: "DEPART", tripId: c.id }),
          /모두 확인/,
        );
      for (const child of children)
        c.run({
          type: "BOARD",
          tripId: c.id,
          studentId: child.id,
          status: "BOARDED",
        });
      c.run({ type: "DEPART", tripId: c.id });
    }
  }
  assert.equal(c.trip.status, "COMPLETED");
  assert.deepEqual(c.trip.live, { active: false });
  assert.throws(() => c.run({ type: "START", tripId: c.id }), /종료/);
});
test("stop change needs approval and affects only the trip snapshot", () => {
  const c = scenario();
  c.run(
    {
      type: "REQUEST",
      tripId: c.id,
      studentId: "c2",
      kind: "STOP_CHANGE",
      detail: "오늘만 변경",
      targetStopId: "s4",
    },
    parent,
  );
  assert.equal(c.trip.students[1].stopId, "s3");
  const request = c.trip.students[1].request!;
  c.run(
    {
      type: "RESOLVE",
      tripId: c.id,
      studentId: "c2",
      requestId: request.id,
      accept: true,
    },
    admin,
  );
  assert.equal(c.trip.students[1].stopId, "s4");
  assert.equal(c.state.route.students[1].stopId, "s3");
  assert.equal(c.trip.students[1].request!.status, "APPLIED");
});
test("parent cannot view other children or issue driver commands", () => {
  const c = scenario();
  assert.throws(
    () => c.run({ type: "START", tripId: c.id }, parent),
    /내 아이/,
  );
  assert.throws(
    () =>
      c.run(
        {
          type: "REQUEST",
          tripId: c.id,
          studentId: "c1",
          kind: "ABSENT",
          detail: "",
          targetStopId: "",
        },
        parent,
      ),
    /내 아이/,
  );
  c.run(
    {
      type: "REQUEST",
      tripId: c.id,
      studentId: "c1",
      kind: "ABSENT",
      detail: "private",
      targetStopId: "",
    },
    admin,
  );
  const view = visibleStore(c.state, parent);
  assert.deepEqual(
    view.trips[c.id].students.map((s) => s.id),
    ["c2"],
  );
  assert.equal(view.trips[c.id].events.length, 0);
  assert.equal(view.route.students.length, 0);
});
test("unassigned driver is denied and cannot edit templates", () => {
  const c = scenario();
  assert.throws(
    () =>
      c.run(
        { type: "START", tripId: c.id },
        { ...driver, uid: "other-driver" },
      ),
    /배정/,
  );
  assert.throws(
    () => c.run({ type: "SAVE_ROUTE", route: c.state.route }),
    /운영자/,
  );
  assert.equal(
    Object.keys(visibleStore(c.state, { ...driver, uid: "other-driver" }).trips)
      .length,
    0,
  );
});
test("a new day starts clean and keeps historical events", () => {
  const c = scenario();
  c.run(
    {
      type: "REQUEST",
      tripId: c.id,
      studentId: "c2",
      kind: "ABSENT",
      detail: "",
      targetStopId: "",
    },
    parent,
  );
  const request = c.trip.students[1].request!;
  c.run(
    {
      type: "RESOLVE",
      tripId: c.id,
      studentId: "c2",
      requestId: request.id,
      accept: true,
    },
    admin,
  );
  c.run({ type: "CREATE_TRIP", date: "2099-01-02" }, admin);
  const next = c.state.trips["2099-01-02-pickup"];
  assert.equal(next.students[1].boarding, "SCHEDULED");
  assert.equal(next.students[1].request, undefined);
  assert.equal(c.trip.events.length, 2);
  assert.throws(
    () => c.run({ type: "CREATE_TRIP", date: "2099-01-02" }, admin),
    /이미/,
  );
  assert.throws(() => c.run({ type: "START", tripId: next.id }), /오늘/);
});
test("cannot board before arrival, leave pending requests, or accept a stale request", () => {
  const c = scenario();
  assert.throws(
    () =>
      c.run({
        type: "BOARD",
        tripId: c.id,
        studentId: "c1",
        status: "BOARDED",
      }),
    /도착/,
  );
  c.run({ type: "START", tripId: c.id });
  c.run({ type: "ARRIVE", tripId: c.id });
  c.run({ type: "DEPART", tripId: c.id });
  c.run({ type: "ARRIVE", tripId: c.id });
  c.run(
    {
      type: "REQUEST",
      tripId: c.id,
      studentId: "c1",
      kind: "DELAY",
      detail: "3분",
      targetStopId: "",
    },
    admin,
  );
  c.run({ type: "BOARD", tripId: c.id, studentId: "c1", status: "BOARDED" });
  assert.throws(() => c.run({ type: "DEPART", tripId: c.id }), /변경 요청/);
  const r = c.trip.students[0].request!;
  assert.throws(
    () =>
      c.run(
        {
          type: "RESOLVE",
          tripId: c.id,
          studentId: "c1",
          requestId: r.id,
          accept: true,
        },
        admin,
      ),
    /승하차/,
  );
  c.run(
    {
      type: "RESOLVE",
      tripId: c.id,
      studentId: "c1",
      requestId: r.id,
      accept: false,
    },
    admin,
  );
  assert.throws(
    () =>
      c.run(
        {
          type: "RESOLVE",
          tripId: c.id,
          studentId: "c1",
          requestId: r.id,
          accept: true,
        },
        admin,
      ),
    /이미/,
  );
  c.run({ type: "DEPART", tripId: c.id });
});
test("stale GPS is withheld and completed GPS is erased", () => {
  const c = scenario();
  assert.throws(
    () =>
      c.run({
        type: "GPS",
        tripId: c.id,
        active: true,
        lat: 37,
        lng: 126,
        accuracy: 4,
      }),
    /운행 중/,
  );
  c.run({ type: "START", tripId: c.id });
  c.run({
    type: "GPS",
    tripId: c.id,
    active: true,
    lat: 37,
    lng: 126,
    accuracy: 4,
  });
  const s = c.state;
  s.trips[c.id].live.updatedAt = Date.now() - 61000;
  assert.deepEqual(visibleStore(s, parent).trips[c.id].live, { active: false });
  c.run({ type: "CANCEL", tripId: c.id }, admin);
  assert.deepEqual(c.trip.live, { active: false });
});
test("duplicate event IDs do not board twice", () => {
  const c = scenario();
  c.run({ type: "START", tripId: c.id });
  const command: Command = { type: "ARRIVE", tripId: c.id };
  const once = applyCommand(c.state, command, driver, "one");
  assert.deepEqual(applyCommand(once, command, driver, "one"), once);
});
test("route ordering is explicit, not sorted by scheduled time", () => {
  const c = scenario();
  const route = structuredClone(c.state.route);
  route.stops[0].time = "15:00";
  c.run({ type: "SAVE_ROUTE", route }, admin);
  c.run({ type: "CREATE_TRIP", date: "2099-01-03" }, admin);
  assert.equal(c.state.trips["2099-01-03-pickup"].stops[0].id, "s1");
  assert.equal(c.trip.stops[0].time, "14:00");
});
test("late requests cannot target passed or final stops", () => {
  const c = scenario();
  assert.throws(
    () =>
      c.run(
        {
          type: "REQUEST",
          tripId: c.id,
          studentId: "c2",
          kind: "STOP_CHANGE",
          detail: "",
          targetStopId: "s5",
        },
        parent,
      ),
    /탑승지/,
  );
  c.run({ type: "START", tripId: c.id });
  c.run({ type: "ARRIVE", tripId: c.id });
  c.run({ type: "DEPART", tripId: c.id });
  assert.throws(
    () =>
      c.run(
        {
          type: "REQUEST",
          tripId: c.id,
          studentId: "c2",
          kind: "STOP_CHANGE",
          detail: "",
          targetStopId: "s1",
        },
        parent,
      ),
    /탑승지/,
  );
});
