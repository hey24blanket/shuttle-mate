"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { LocateFixed, MapPin } from "lucide-react";
import { useLocation } from "./location-provider";
export default function LiveMap() {
  const { record, label, now } = useLocation();
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const circle = useRef<Leaflet.Circle | null>(null);
  const marker = useRef<Leaflet.CircleMarker | null>(null);
  const api = useRef<typeof Leaflet | null>(null);
  const following = useRef(true);
  const [positionReady, setReady] = useState(false);
  const [follow, setFollow] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [mapError, setMapError] = useState(false);
  const fix = record.fix;
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    import("leaflet")
      .then((L) => {
        if (cancelled || !element.current) return;
        api.current = L;
        const m = L.map(element.current, {
          zoomControl: false,
          scrollWheelZoom: false,
        }).setView([36.4, 127.8], 6);
        map.current = m;
        L.control.zoom({ position: "topright" }).addTo(m);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        })
          .on("tileerror", () => setTileError(true))
          .on("load", () => {})
          .addTo(m);
        m.on("dragstart", () => {
          following.current = false;
          setFollow(false);
        });
        observer = new ResizeObserver(() => m.invalidateSize());
        observer.observe(element.current);
        setReady(true);
      })
      .catch(() => setMapError(true));
    return () => {
      cancelled = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
      circle.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    const L = api.current;
    if (!m || !L || !positionReady) return;
    if (!fix) {
      marker.current?.remove();
      circle.current?.remove();
      marker.current = null;
      circle.current = null;
      m.setView([36.4, 127.8], 6);
      return;
    }
    const pos: [number, number] = [fix.latitude, fix.longitude];
    const stale = now - fix.timestamp > 30000 || record.status !== "live";
    if (!marker.current) {
      circle.current = L.circle(pos, {
        radius: fix.accuracy,
        weight: 1,
        color: "#4285e9",
        fillOpacity: 0.12,
      }).addTo(m);
      marker.current = L.circleMarker(pos, {
        radius: 10,
        weight: 3,
        color: "white",
        fillColor: "#287ce1",
        fillOpacity: 1,
      })
        .addTo(m)
        .bindTooltip("실제 휴대폰 위치");
      m.setView(pos, 16);
    } else {
      marker.current.setLatLng(pos);
      circle.current?.setLatLng(pos).setRadius(fix.accuracy);
      if (following.current) m.panTo(pos, { animate: false });
    }
    marker.current.setStyle({ fillColor: stale ? "#8b928b" : "#287ce1" });
    circle.current?.setStyle({ color: stale ? "#8b928b" : "#4285e9" });
  }, [fix, positionReady, record.status, now]);
  return (
    <section className="live-map-section">
      <div
        className="live-map-canvas"
        ref={element}
        aria-label="실제 위치 지도"
      />
      {(!fix || mapError) && (
        <div className="live-map-empty">
          <MapPin size={24} />
          <strong>{mapError ? "지도를 불러오지 못했어요" : label}</strong>
          <p>
            {mapError
              ? "인터넷 연결을 확인하고 새로고침해 주세요."
              : "운전자 화면에서 내 위치 추적 시작을 눌러 주세요."}
          </p>
        </div>
      )}
      {fix && (
        <button
          className={`follow-location ${follow ? "following" : ""}`}
          onClick={() => {
            following.current = true;
            setFollow(true);
            map.current?.setView([fix.latitude, fix.longitude], 16);
          }}
        >
          <LocateFixed size={17} />
          {follow ? "내 위치 따라가기" : "내 위치로 이동"}
        </button>
      )}
      <div className="live-location-info" aria-live="polite">
        <strong>{label}</strong>
        {fix && (
          <>
            <span>
              정확도 약 {Math.round(fix.accuracy)}m ·{" "}
              {Math.max(0, Math.floor((now - fix.timestamp) / 1000))}초 전 갱신
            </span>
            <code data-testid="live-coordinates">
              {fix.latitude.toFixed(6)}, {fix.longitude.toFixed(6)}
            </code>
          </>
        )}
      </div>
      {tileError && (
        <div className="location-warning">
          지도 배경을 불러오지 못했어요. 인터넷 연결을 확인해 주세요. 위치
          좌표는 별도로 표시됩니다.
        </div>
      )}
    </section>
  );
}
