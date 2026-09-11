"use client";
import { useState } from "react";
import { Download, History } from "lucide-react";
import { Shell } from "@/components/shell";
import { useShuttle } from "@/components/provider";
import { TripBadge, timeText, ChildBadge } from "@/components/shared";
export default function HistoryPage() {
  const { state } = useShuttle();
  const [selected, setSelected] = useState("");
  const trips = Object.values(state?.trips || {}).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const trip = trips.find((t) => t.id === selected) || trips[0];
  function download() {
    if (!trip) return;
    const rows = [
      ["운행일", "시간", "내용"],
      ...trip.events.map((e) => [trip.date, timeText(e.at), e.text]),
    ];
    const cell = (s: string) =>
      `"${(/^[=+@\-\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
    const blob = new Blob(
      ["\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shuttle-mate-${trip.date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Shell
      role="admin"
      title="운행 기록"
      subtitle="언제 출발하고, 누가 탔는지. 오늘의 작은 확인을 기록으로 남깁니다."
      action={
        <button disabled={!trip} onClick={download}>
          <Download size={17} /> 기록 내려받기
        </button>
      }
    >
      {trip ? (
        <>
          <section className="card">
            <div className="section-heading">
              <label>
                운행 선택
                <select
                  value={trip.id}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {trips.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.date} · {t.routeName}
                    </option>
                  ))}
                </select>
              </label>
              <TripBadge trip={trip} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>원생</th>
                    <th>오늘의 탑승지</th>
                    <th>상태</th>
                    <th>탑승</th>
                    <th>하차</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.students.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <b>{c.name}</b>
                      </td>
                      <td>{trip.stops.find((s) => s.id === c.stopId)?.name}</td>
                      <td>
                        <ChildBadge child={c} />
                      </td>
                      <td>{timeText(c.boardedAt)}</td>
                      <td>{timeText(c.droppedOffAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>시간순 운행 기록</h2>
              <span>{trip.events.length}건</span>
            </div>
            <div className="history-list">
              {trip.events.map((e) => (
                <div key={e.id}>
                  <time>{timeText(e.at)}</time>
                  <span className="activity-dot" />
                  <p>{e.text}</p>
                </div>
              ))}
              {!trip.events.length && (
                <div className="empty-small">
                  <History size={30} />
                  <p>아직 운행 기록이 없어요.</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="card empty-small">저장된 운행이 없습니다.</div>
      )}
    </Shell>
  );
}
