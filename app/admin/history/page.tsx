"use client";
import { useState } from "react";
import {
  Download,
  Clock3,
  Check,
  ClipboardCheck,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { useStore } from "@/components/provider";
import { SectionTitle, Empty, Badge } from "@/components/ui";
import { timeLabel, dateLabel } from "@/lib/trip";
export default function History() {
  const { data } = useStore();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const events = data.trip.events.filter(
    (e) =>
      (filter === "all" ||
        (filter === "request" && e.type.includes("REQUEST")) ||
        (filter === "boarding" &&
          (e.type.includes("STUDENT") || e.type.includes("CORRECT"))) ||
        (filter === "trip" &&
          (e.type.includes("TRIP") || e.type.includes("STOP")))) &&
      e.message.includes(query),
  );
  const download = () => {
    const cell = (s: string) =>
      '"' + s.replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
    const csv =
      "\uFEFF" +
      [
        ["시간", "유형", "내용", "기록자"],
        ...events.map((e) => [e.time, e.type, e.message, e.actor]),
      ]
        .map((row) => row.map(cell).join(","))
        .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `셔틀메이트_운행기록_${data.trip.date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Shell>
      <SectionTitle
        eyebrow="A RECORD OF CARE"
        title="작은 확인도, 기록으로 남겨요."
        description="운행 시작부터 요청 처리, 승하차 정정까지 한곳에서 확인해요."
        action={
          <button className="button primary" onClick={download}>
            <Download size={17} />
            기록 내보내기
          </button>
        }
      />
      <section className="card">
        <div className="roster-toolbar">
          <div className="tabs no-border">
            {[
              ["all", "전체"],
              ["trip", "운행"],
              ["boarding", "승하차"],
              ["request", "변경 요청"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="기록 검색"
              aria-label="기록 검색"
            />
          </label>
        </div>
        <div className="history-day">
          <Clock3 size={17} />
          {dateLabel(data.trip.date)}
          <span>{events.length}건의 기록</span>
        </div>
        <div className="history-list">
          {events.map((e) => (
            <div className="history-event" key={e.id}>
              <time>{timeLabel(e.time)}</time>
              <span
                className={`activity-dot ${e.type.includes("REQUEST") ? "orange" : "green"}`}
              >
                {e.type.includes("REQUEST") ? (
                  <ClipboardCheck size={16} />
                ) : (
                  <Check size={16} />
                )}
              </span>
              <div>
                <strong>{e.message}</strong>
                <p>{e.actor}</p>
              </div>
              <Badge tone="gray">
                {e.type.includes("REQUEST")
                  ? "변경 요청"
                  : e.type.includes("STUDENT") || e.type.includes("CORRECT")
                    ? "승하차"
                    : "운영 기록"}
              </Badge>
            </div>
          ))}
        </div>
        {!events.length && (
          <Empty
            title="해당 기록이 없어요"
            text="다른 필터나 검색어로 확인해 주세요."
          />
        )}
        <div className="schedule-note">
          <ShieldCheck size={16} />
          정정해도 이전 기록은 남아요. 체험 초기화 시에는 기록도 초기화됩니다.
        </div>
      </section>
    </Shell>
  );
}
