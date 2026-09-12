"use client";
import { useState } from "react";
import {
  Plus,
  Search,
  Users,
  MapPin,
  ArrowRight,
  UserRound,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { useStore } from "@/components/provider";
import { SectionTitle, Badge, Modal, Empty } from "@/components/ui";
import { boardingLabel } from "@/lib/trip";
export default function Students() {
  const { data, act, notify } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [add, setAdd] = useState(false);
  const [name, setName] = useState("");
  const [guardian, setGuardian] = useState("");
  const [stop, setStop] = useState(data.template[0].id);
  const shown = data.students.filter(
    (c) =>
      (c.name.includes(query) || c.guardian.includes(query)) &&
      (filter === "all" || c.stopId === filter),
  );
  return (
    <Shell>
      <SectionTitle
        eyebrow="EVERY CHILD MATTERS"
        title="한 명 한 명, 빠짐없이."
        description="원생과 보호자, 기본 탑승지를 함께 관리해요."
        action={
          <button className="button primary" onClick={() => setAdd(true)}>
            <Plus size={17} />
            원생 등록
          </button>
        }
      />
      <section className="card">
        <div className="roster-toolbar">
          <h2>
            전체 원생{" "}
            <span className="count-green">{data.students.length}</span>
          </h2>
          <div className="filter-controls">
            <label className="search-box">
              <Search size={17} />
              <input
                aria-label="원생 또는 보호자 검색"
                placeholder="원생, 보호자 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="기본 탑승지 필터"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">모든 탑승지</option>
              {data.template.slice(0, -1).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table className="roster-table">
            <thead>
              <tr>
                <th>원생</th>
                <th>반 / 크루</th>
                <th>보호자</th>
                <th>기본 탑승지</th>
                <th>오늘 탑승 상태</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c, i) => (
                <tr key={c.id}>
                  <td>
                    <span className={`avatar ${i % 2 ? "peach" : ""}`}>
                      {c.name[0]}
                    </span>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.className}</td>
                  <td>{c.guardian}</td>
                  <td>
                    <span className="cell-location">
                      <MapPin size={14} />
                      {data.template.find((s) => s.id === c.stopId)?.name ??
                        "미배정"}
                    </span>
                  </td>
                  <td>
                    <Badge
                      tone={
                        data.trip.states[c.id] === "BOARDED" ||
                        data.trip.states[c.id] === "DROPPED_OFF"
                          ? "green"
                          : "gray"
                      }
                    >
                      {data.trip.states[c.id]
                        ? boardingLabel[data.trip.states[c.id]]
                        : "다음 운행부터 배정"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!shown.length && (
          <Empty
            title="검색 결과가 없어요"
            text="이름이나 탑승지를 다시 확인해 주세요."
          />
        )}
        <div className="table-footer">
          <span>{shown.length}명의 원생</span>
          <span>가상 원생 데이터 · 체험용</span>
        </div>
      </section>
      {add && (
        <Modal title="원생 등록" onClose={() => setAdd(false)}>
          <div className="notice">
            체험용 이름을 사용해 주세요. 새 원생은 다음에 생성하는 운행부터
            배정됩니다.
          </div>
          <label className="field">
            원생 이름
            <input
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해 주세요"
            />
          </label>
          <label className="field">
            보호자 이름
            <input
              value={guardian}
              maxLength={20}
              onChange={(e) => setGuardian(e.target.value)}
              placeholder="보호자 이름"
            />
          </label>
          <label className="field">
            기본 탑승지
            <select value={stop} onChange={(e) => setStop(e.target.value)}>
              {data.template.slice(0, -1).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button primary full"
            disabled={!name.trim() || !guardian.trim()}
            onClick={() => {
              if (
                act({
                  type: "ADD_STUDENT",
                  student: {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    guardian: guardian.trim(),
                    className: "유아체육 1반",
                    stopId: stop,
                  },
                })
              ) {
                setAdd(false);
                setName("");
                setGuardian("");
                notify("원생을 등록했어요. 다음 운행부터 배정됩니다.");
              }
            }}
          >
            원생 등록 <ArrowRight size={17} />
          </button>
        </Modal>
      )}
    </Shell>
  );
}
