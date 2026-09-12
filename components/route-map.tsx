"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  BusFront,
  LocateFixed,
  Plus,
  Minus,
  Layers,
  MapPin,
} from "lucide-react";
import { useStore } from "./provider";
import { isFinished } from "@/lib/trip";
const LiveMap = dynamic(() => import("./live-map"), {
  ssr: false,
  loading: () => <div className="empty">실제 지도를 불러오는 중…</div>,
});
export function RouteMap({ privateView = false }: { privateView?: boolean }) {
  const [mode, setMode] = useState("live");
  return (
    <div className="map-switcher">
      <div className="tabs">
        <button
          className={mode === "live" ? "active" : ""}
          onClick={() => setMode("live")}
        >
          실제 위치
        </button>
        <button
          className={mode === "demo" ? "active" : ""}
          onClick={() => setMode("demo")}
        >
          예시 노선
        </button>
      </div>
      {mode === "live" ? <LiveMap /> : <DemoMap />}
    </div>
  );
}
function DemoMap() {
  const { data } = useStore();
  const t = data.trip;
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [labels, setLabels] = useState(true);
  const current = t.stops[t.current];
  const points = t.stops.map((s) => `${s.x},${s.y}`).join(" ");
  const done = t.stops
    .slice(0, t.current + 1)
    .map((s) => `${s.x},${s.y}`)
    .join(" ");
  const hidden = isFinished(t) || t.gps === "LOST";
  return (
    <div className="route-map">
      <div className="map-tag">
        <span className="live-dot" />{" "}
        {hidden ? "위치 표시 중지" : "운행 경로 미리보기"}
        <small>시뮬레이션</small>
      </div>
      <svg
        viewBox="0 0 760 405"
        role="img"
        aria-label="마포구 예시 운행 노선도. 실제 GPS 지도가 아닙니다."
      >
        <defs>
          <pattern
            id="blocks"
            width="95"
            height="78"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-18)"
          >
            <rect x="8" y="8" width="70" height="56" rx="6" fill="#e9e9df" />
            <rect x="13" y="14" width="26" height="18" rx="2" fill="#e2e3d9" />
            <rect x="44" y="36" width="26" height="21" rx="2" fill="#e1e3d8" />
          </pattern>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity=".15" />
          </filter>
        </defs>
        <rect width="760" height="405" fill="#f1f1e9" />
        <rect width="760" height="405" fill="url(#blocks)" />
        <path d="M0 120 Q75 160 45 230 Q15 300 160 405 H0Z" fill="#c8dde1" />
        <path
          d="M0 95 Q100 156 75 227 Q48 301 185 405"
          fill="none"
          stroke="#d8e4cf"
          strokeWidth="28"
        />
        <g
          transform={`translate(${380 - 380 * zoom} ${202 - 202 * zoom}) scale(${zoom})`}
        >
          <path
            d="M115 -20L230 435M335 -20L500 435M615 -20L730 435M50 350L730 110M35 205L640 5M180 430L790 227"
            stroke="#fffef8"
            strokeWidth="18"
            fill="none"
          />
          <path
            d="M115 -20L230 435M335 -20L500 435M615 -20L730 435M50 350L730 110"
            stroke="#e3dfc7"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M265 186l72-24 23 48-79 24zM553 275l90-28 27 54-95 31zM80 30l80-10 9 66-60 11z"
            fill="#d2dfc4"
          />
          <g fill="#a6aaa0" fontSize="12" fontFamily="sans-serif">
            <text x="530" y="332">
              성산동
            </text>
            <text x="115" y="126">
              망원동
            </text>
            <text x="280" y="387">
              월드컵로
            </text>
            <text x="590" y="178">
              마포구청
            </text>
            <text x="47" y="334" transform="rotate(-62 47 334)">
              한강
            </text>
            <text x="268" y="207" fontSize="9">
              어린이공원
            </text>
          </g>
          <polyline
            points={points}
            fill="none"
            stroke="#fff"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#b8c5a8"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 10"
          />
          <polyline
            points={done}
            fill="none"
            stroke="#377761"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {t.stops.map((s, i) => (
            <g
              key={s.id}
              onClick={() => setSelected(selected === s.id ? null : s.id)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={s.x}
                cy={s.y}
                r="11"
                fill={i < t.current ? "#377761" : "#fff"}
                stroke={i === t.current ? "#d18a4b" : "#779785"}
                strokeWidth="3"
              />
              <text
                x={s.x}
                y={s.y + 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={i < t.current ? "white" : "#39634e"}
              >
                {i + 1}
              </text>
              {labels && (
                <g>
                  <rect
                    x={s.x + 17}
                    y={s.y - 13}
                    width={s.name.length * 10 + 18}
                    height="27"
                    rx="5"
                    fill="#fffefb"
                    fillOpacity=".92"
                  />
                  <text x={s.x + 25} y={s.y + 4} fontSize="11" fill="#47554d">
                    {s.name}
                  </text>
                </g>
              )}
            </g>
          ))}
          {!hidden && (
            <g
              filter="url(#shadow)"
              transform={`translate(${current.x - 26} ${current.y + 28})`}
            >
              <circle r="31" fill="#8ebca0" opacity=".22" />
              <rect
                x="-23"
                y="-23"
                width="46"
                height="46"
                rx="16"
                fill="#183f36"
                stroke="white"
                strokeWidth="3"
              />
              <path
                d="M-10 -12h20v20h-20zM-10 0h20M-6 8v4M6 8v4"
                fill="none"
                stroke="#e2edca"
                strokeWidth="2.5"
              />
              <circle cx="-6" cy="5" r="1.5" fill="white" />
              <circle cx="6" cy="5" r="1.5" fill="white" />
            </g>
          )}
        </g>
      </svg>
      <div className="map-controls">
        <button
          aria-label="지도 확대"
          onClick={() => setZoom(Math.min(1.7, zoom + 0.2))}
        >
          <Plus size={17} />
        </button>
        <button
          aria-label="지도 축소"
          onClick={() => setZoom(Math.max(0.8, zoom - 0.2))}
        >
          <Minus size={17} />
        </button>
        <button aria-label="지도 중심으로" onClick={() => setZoom(1)}>
          <LocateFixed size={17} />
        </button>
      </div>
      <button
        className="map-layer"
        aria-label="정차지 이름 표시 전환"
        onClick={() => setLabels(!labels)}
      >
        <Layers size={17} />
      </button>
      {selected && (
        <div className="map-popup">
          <MapPin size={16} />
          <strong>{t.stops.find((s) => s.id === selected)?.name}</strong>
          <span>{t.stops.find((s) => s.id === selected)?.time} 예정</span>
          <button
            aria-label="정차지 안내 닫기"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
        </div>
      )}
      <div className="map-legend">
        <span>
          <i />
          이동한 경로
        </span>
        <span>
          <i />
          남은 경로
        </span>
        <small>예시 노선도 · 실제 지도 아님</small>
      </div>
    </div>
  );
}
