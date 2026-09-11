"use client";
import { useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Route } from "lucide-react";
import { Shell } from "@/components/shell";
import { useShuttle } from "@/components/provider";
import { Store } from "@/lib/model";
export default function RoutesPage() {
  const { state, dispatch, busy } = useShuttle();
  const [draft, setDraft] = useState<Store["route"] | null>(null);
  const route = draft || state?.route;
  const edit = (r: Store["route"]) => setDraft(structuredClone(r));
  return (
    <Shell
      role="admin"
      title="기본 노선 관리"
      subtitle="노선 순서와 예정 시간을 정해두면, 매일의 운행이 더 간편해집니다."
    >
      {route && (
        <>
          <div className="info-box">
            <Route size={19} /> 기본 노선 변경은 새로 만드는 운행부터
            적용됩니다. 이미 생성한 오늘 운행은 유지됩니다.
          </div>
          <section className="card">
            <div className="section-heading">
              <h2>노선 정보</h2>
            </div>
            <div className="form-grid">
              <label>
                노선 이름
                <input
                  value={route.name}
                  maxLength={80}
                  onChange={(e) => edit({ ...route, name: e.target.value })}
                />
              </label>
              <label>
                담당 기사 이름
                <input
                  value={route.driverName}
                  onChange={(e) =>
                    edit({ ...route, driverName: e.target.value })
                  }
                />
              </label>
              <label>
                차량 번호
                <input
                  value={route.vehicle}
                  onChange={(e) => edit({ ...route, vehicle: e.target.value })}
                />
              </label>
              <label>
                등록된 운전자 계정 ID
                <input
                  value={route.driverId}
                  onChange={(e) => edit({ ...route, driverId: e.target.value })}
                />
                <small>기관에 등록된 운전자 계정과 일치해야 합니다.</small>
              </label>
            </div>
          </section>
          <section className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ROUTE BUILDER</span>
                <h2>정차지 순서</h2>
              </div>
              <button
                onClick={() => {
                  const stops = [...route.stops];
                  stops.splice(Math.max(0, stops.length - 1), 0, {
                    id: crypto.randomUUID(),
                    name: "새 정차지",
                    time: "14:20",
                    order: 0,
                  });
                  edit({ ...route, stops });
                }}
              >
                <Plus size={16} /> 정차지 추가
              </button>
            </div>
            <p className="muted">
              마지막 정차지는 하차를 확인하는 최종 목적지입니다.
            </p>
            <div className="stop-editor">
              {route.stops.map((s, i) => (
                <div className="edit-stop" key={s.id}>
                  <span className="stop-number">{i + 1}</span>
                  <label>
                    장소명{i === route.stops.length - 1 ? " · 최종 목적지" : ""}
                    <input
                      aria-label={`${i + 1}번 정차지 이름`}
                      value={s.name}
                      maxLength={80}
                      onChange={(e) =>
                        edit({
                          ...route,
                          stops: route.stops.map((p) =>
                            p.id === s.id ? { ...p, name: e.target.value } : p,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    예정 시간
                    <input
                      type="time"
                      aria-label={`${i + 1}번 정차지 시간`}
                      value={s.time}
                      onChange={(e) =>
                        edit({
                          ...route,
                          stops: route.stops.map((p) =>
                            p.id === s.id ? { ...p, time: e.target.value } : p,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="icon-actions">
                    <button
                      aria-label={`${s.name} 위로`}
                      disabled={i === 0}
                      onClick={() => {
                        const stops = [...route.stops];
                        [stops[i - 1], stops[i]] = [stops[i], stops[i - 1]];
                        edit({ ...route, stops });
                      }}
                    >
                      <ArrowUp size={17} />
                    </button>
                    <button
                      aria-label={`${s.name} 아래로`}
                      disabled={i === route.stops.length - 1}
                      onClick={() => {
                        const stops = [...route.stops];
                        [stops[i + 1], stops[i]] = [stops[i], stops[i + 1]];
                        edit({ ...route, stops });
                      }}
                    >
                      <ArrowDown size={17} />
                    </button>
                    <button
                      aria-label={`${s.name} 삭제`}
                      disabled={
                        route.stops.length <= 2 ||
                        route.students.some((c) => c.stopId === s.id)
                      }
                      onClick={() => {
                        if (confirm(`${s.name}을 기본 노선에서 삭제할까요?`))
                          edit({
                            ...route,
                            stops: route.stops.filter((p) => p.id !== s.id),
                          });
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="hint">
              학생이 배정된 정차지는 원생 관리에서 배정을 옮긴 뒤 삭제할 수
              있습니다.
            </p>
            <div className="save-bar">
              <span>
                {draft
                  ? "아직 저장하지 않은 변경이 있습니다."
                  : "저장된 기본 노선입니다."}
              </span>
              <button
                className="primary"
                disabled={busy || !draft}
                onClick={async () => {
                  if (await dispatch({ type: "SAVE_ROUTE", route }))
                    setDraft(null);
                }}
              >
                <Save size={17} /> 기본 노선 저장
              </button>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
