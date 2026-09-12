"use client";
import { useState } from "react";
import {
  Plus,
  Save,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MapPin,
  Route,
  Clock3,
  ArrowRight,
  Check,
  Trash2,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { useStore } from "@/components/provider";
import { SectionTitle, Badge, Modal } from "@/components/ui";
import { Stop } from "@/lib/trip";
export default function Routes() {
  const { data, act, notify } = useStore();
  const [editing, setEditing] = useState(false);
  const [stops, setStops] = useState<Stop[]>(data.template);
  const [drag, setDrag] = useState<number | null>(null);
  const [add, setAdd] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [time, setTime] = useState("14:25");
  const move = (from: number, to: number) => {
    if (to < 0 || to >= stops.length - 1) return;
    const next = [...stops];
    const times = next.map((s) => s.time);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setStops(next.map((s, i) => ({ ...s, time: times[i] })));
  };
  const save = () => {
    if (act({ type: "SAVE_ROUTE", stops })) {
      setEditing(false);
      notify("기본 노선을 저장했어요. 오늘 진행 중인 운행은 유지돼요.");
    }
  };
  return (
    <Shell>
      <SectionTitle
        eyebrow="ROUTE, READY"
        title="매일의 길을 준비해요."
        description="반복되는 경로는 기본 노선으로, 오늘의 변화는 오늘 운행으로."
        action={
          <button
            className="button primary"
            onClick={() => {
              if (editing) save();
              else {
                setStops(structuredClone(data.template));
                setEditing(true);
              }
            }}
          >
            {editing ? (
              <>
                <Save size={17} />
                변경 저장
              </>
            ) : (
              <>
                <Route size={17} />
                노선 편집
              </>
            )}
          </button>
        }
      />
      <div className="route-layout">
        <aside className="card route-summary">
          <div className="route-summary-icon">
            <Route size={30} />
          </div>
          <Badge>운영 중인 기본 노선</Badge>
          <h2>유아체육 1반</h2>
          <p>월 · 화 · 수 · 목 · 금</p>
          <div className="route-meta">
            <div>
              <span>운행 구분</span>
              <strong>등원</strong>
            </div>
            <div>
              <span>운행 시간</span>
              <strong>
                {data.template[0].time} — {data.template.at(-1)?.time}
              </strong>
            </div>
            <div>
              <span>정차지</span>
              <strong>{data.template.length}곳</strong>
            </div>
            <div>
              <span>기본 배정</span>
              <strong>{data.students.length}명</strong>
            </div>
          </div>
          <div className="notice">
            기본 노선을 수정해도 이미 생성된 오늘 운행에는 영향을 주지 않아요.
          </div>
        </aside>
        <section className="card route-builder">
          <div className="card-head">
            <h2>정차 순서와 탑승 예정</h2>
            <span className="subtle">
              {editing
                ? "드래그 또는 화살표로 순서를 바꾸세요."
                : "기본 노선 템플릿"}
            </span>
          </div>
          <div className="builder-stops">
            {(editing ? stops : data.template).map((s, i, arr) => (
              <div
                className="builder-stop"
                key={s.id}
                draggable={editing && i < arr.length - 1}
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag !== null && drag < arr.length - 1) move(drag, i);
                  setDrag(null);
                }}
              >
                <span className="builder-number">{i + 1}</span>
                <div className="builder-info">
                  {editing ? (
                    <input
                      aria-label={`정차지 ${i + 1} 이름`}
                      value={s.name}
                      onChange={(e) =>
                        setStops(
                          stops.map((v) =>
                            v.id === s.id ? { ...v, name: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  ) : (
                    <h3>
                      {s.name}
                      {i === arr.length - 1 && (
                        <span className="tag">최종 목적지</span>
                      )}
                    </h3>
                  )}
                  <p>
                    <MapPin size={12} />
                    {s.address}
                  </p>
                  <div className="student-chips">
                    {data.students
                      .filter((c) => c.stopId === s.id)
                      .map((c) => (
                        <span key={c.id}>{c.name}</span>
                      ))}
                    {i === arr.length - 1 && <span>탑승 아동 전원 하차</span>}
                  </div>
                </div>
                {editing ? (
                  <>
                    <input
                      className="time-input"
                      aria-label={`정차지 ${i + 1} 시간`}
                      type="time"
                      value={s.time}
                      onChange={(e) =>
                        setStops(
                          stops.map((v) =>
                            v.id === s.id ? { ...v, time: e.target.value } : v,
                          ),
                        )
                      }
                    />
                    {i < arr.length - 1 && (
                      <div className="reorder-buttons">
                        <button
                          disabled={i === 0}
                          aria-label={`${s.name} 위로 이동`}
                          onClick={() => move(i, i - 1)}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          disabled={i === arr.length - 2}
                          aria-label={`${s.name} 아래로 이동`}
                          onClick={() => move(i, i + 1)}
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="stop-time">
                    <Clock3 size={15} />
                    {s.time}
                  </span>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <>
              <button
                className="button dashed full"
                onClick={() => setAdd(true)}
              >
                <Plus size={17} />
                정차지 추가
              </button>
              <div className="modal-actions">
                <button className="button" onClick={() => setEditing(false)}>
                  편집 취소
                </button>
                <button className="button primary" onClick={save}>
                  <Save size={17} />
                  기본 노선 저장
                </button>
              </div>
            </>
          )}
        </section>
      </div>
      {add && (
        <Modal title="정차지 추가" onClose={() => setAdd(false)}>
          <label className="field">
            정차지 이름
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={35}
              placeholder="예: 성산 아파트 정문"
            />
          </label>
          <label className="field">
            주소
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={100}
              placeholder="안내할 주소를 입력해 주세요"
            />
          </label>
          <label className="field">
            예정 시간
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <div className="notice">
            체험에서는 직접 입력으로 정차지를 추가합니다. 지도 장소 검색은 실제
            서비스 연동 단계에서 제공됩니다.
          </div>
          <button
            className="button primary full"
            disabled={!name.trim() || !address.trim()}
            onClick={() => {
              const s: Stop = {
                id: crypto.randomUUID(),
                name: name.trim(),
                address: address.trim(),
                time,
                x: 500,
                y: 140,
              };
              setStops([...stops.slice(0, -1), s, stops.at(-1)!]);
              setAdd(false);
              setName("");
              setAddress("");
            }}
          >
            정차지 추가
          </button>
        </Modal>
      )}
    </Shell>
  );
}
