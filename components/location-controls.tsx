"use client";
import { LocateFixed, Square, MapPin, AlertTriangle } from "lucide-react";
import { useLocation } from "./location-provider";
import { useStore } from "./provider";
import { isFinished } from "@/lib/trip";
export function LocationControls({ onMap }: { onMap: () => void }) {
  const { record, label, tracking, start, stop } = useLocation();
  const { data } = useStore();
  return (
    <section className="location-controls" aria-label="실제 위치 추적">
      <div className="row-between">
        <div>
          <strong>
            <LocateFixed size={18} /> 내 휴대폰 위치
          </strong>
          <p role="status">{label}</p>
        </div>
        <span className="tag">실제 GPS</span>
      </div>
      <div className="location-actions">
        <button
          className="button primary"
          disabled={isFinished(data.trip)}
          onClick={() => {
            start();
            onMap();
          }}
        >
          <LocateFixed size={17} />
          {tracking ? "위치 다시 확인" : "내 위치 추적 시작"}
        </button>
        <button className="button" onClick={onMap}>
          <MapPin size={17} />
          실제 지도
        </button>
        {(tracking || record.fix) && (
          <button className="button" onClick={stop}>
            <Square size={15} />
            중지
          </button>
        )}
      </div>
      {record.status === "denied" && (
        <p className="location-warning">
          브라우저의 이 사이트 위치 권한과 휴대폰 위치 서비스를 켠 뒤 다시
          시작해 주세요.
        </p>
      )}
      <p className="location-help">
        위치 권한을 허용하면 이동에 따라 지도 표시가 갱신됩니다. 앱을 화면에
        열어 두세요. 역할을 바꿔도 추적은 유지되며, 화면을 벗어나면 일시
        중지됩니다.
      </p>
      <details>
        <summary>위치 사용과 테스트 안내</summary>
        <p>
          위치는 이 브라우저에서만 사용하며 같은 브라우저의 탭에 전달됩니다.
          다른 휴대폰으로 전송하지 않습니다. 현재 위치 1건만 기기에 보관하며
          중지·운행 종료 시 지웁니다. 실제 지도는 OpenStreetMap을 사용하므로
          해당 지도 영역을 지도 제공자에게 요청합니다.
        </p>
        <p>
          예시 노선·도착 안내는 실제 GPS와 별개입니다. 걷기 테스트를 해도
          정차지는 자동으로 바뀌지 않아요. 새로고침 후에는 다시 시작 버튼을 눌러
          주세요.
        </p>
      </details>
    </section>
  );
}
