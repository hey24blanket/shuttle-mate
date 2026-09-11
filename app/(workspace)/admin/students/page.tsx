"use client";
import { useState } from "react";
import { Plus, Trash2, Save, Users } from "lucide-react";
import { Shell } from "@/components/shell";
import { useShuttle } from "@/components/provider";
import { Store } from "@/lib/model";
export default function Students() {
  const { state, dispatch, busy } = useShuttle();
  const [draft, setDraft] = useState<Store["route"] | null>(null);
  const route = draft || state?.route;
  return (
    <Shell
      role="admin"
      title="원생 관리"
      subtitle="아이와 기본 탑승지를 연결하고, 오늘 운행을 준비하세요."
    >
      {route && (
        <>
          <div className="info-box">
            <Users size={19} /> 변경한 명단은 새 운행부터 적용됩니다. 보호자
            계정과 아이 연결은 기관 등록 설정에서 관리합니다.
          </div>
          <section className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">LITTLE PASSENGERS</span>
                <h2>
                  등록 원생{" "}
                  <span className="count">{route.students.length}</span>
                </h2>
              </div>
              <button
                onClick={() =>
                  setDraft({
                    ...route,
                    students: [
                      ...route.students,
                      {
                        id: crypto.randomUUID(),
                        name: "",
                        crew: "유아체육 1반",
                        stopId: route.stops[0].id,
                      },
                    ],
                  })
                }
              >
                <Plus size={17} /> 원생 추가
              </button>
            </div>
            <div className="student-editor">
              {route.students.map((c, i) => (
                <div className="edit-student" key={c.id}>
                  <span className="avatar">{c.name.slice(-2, -1) || "아"}</span>
                  <label>
                    이름
                    <input
                      aria-label={`${i + 1}번 원생 이름`}
                      value={c.name}
                      maxLength={40}
                      placeholder="원생 이름"
                      onChange={(e) =>
                        setDraft({
                          ...route,
                          students: route.students.map((s) =>
                            s.id === c.id ? { ...s, name: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    소속 반
                    <input
                      aria-label={`${i + 1}번 원생 소속`}
                      value={c.crew}
                      onChange={(e) =>
                        setDraft({
                          ...route,
                          students: route.students.map((s) =>
                            s.id === c.id ? { ...s, crew: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    기본 탑승지
                    <select
                      aria-label={`${i + 1}번 원생 탑승지`}
                      value={c.stopId}
                      onChange={(e) =>
                        setDraft({
                          ...route,
                          students: route.students.map((s) =>
                            s.id === c.id
                              ? { ...s, stopId: e.target.value }
                              : s,
                          ),
                        })
                      }
                    >
                      {route.stops.slice(0, -1).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    aria-label={`${c.name || "새 원생"} 삭제`}
                    onClick={() => {
                      if (
                        confirm(
                          `${c.name || "새 원생"}을 기본 명단에서 제외할까요? 기존 운행 기록은 유지됩니다.`,
                        )
                      )
                        setDraft({
                          ...route,
                          students: route.students.filter((s) => s.id !== c.id),
                        });
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                  <small className="student-id">등록 ID: {c.id}</small>
                </div>
              ))}
            </div>
            <div className="save-bar">
              <span>
                총 {route.students.length}명{" "}
                {draft ? "· 저장하지 않은 변경" : ""}
              </span>
              <button
                className="primary"
                disabled={busy || !draft}
                onClick={async () => {
                  if (await dispatch({ type: "SAVE_ROUTE", route }))
                    setDraft(null);
                }}
              >
                <Save size={17} /> 명단 저장
              </button>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
