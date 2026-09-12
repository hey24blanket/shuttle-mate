"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { Modal } from "./ui";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(display.matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const done = () => { setInstalled(true); setPrompt(null); setOpen(false); };
    update();
    setReady(true);
    display.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", done);
    return () => {
      display.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === "accepted"
        ? "설치를 요청했어요. 휴대폰의 안내를 완료한 뒤 홈 화면의 아이콘을 확인하세요."
        : "설치를 취소했어요. 나중에 브라우저 메뉴에서 다시 추가할 수 있어요.");
    } catch {
      setMessage("아래 브라우저 메뉴 안내를 따라 홈 화면에 추가해 주세요.");
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }

  if (!ready || installed) return null;
  return <>
    <div className="install-strip">
      <span><Smartphone size={17} /> 홈 화면에서 바로 만나요</span>
      <button onClick={() => setOpen(true)}><Download size={15} /> 홈 화면에 추가</button>
    </div>
    {open && <Modal title="셔틀메이트 앱 설치" onClose={() => setOpen(false)}>
      <p className="modal-description">홈 화면의 아이콘을 누르면 주소창 없이 앱으로 열려요. 설치 후에도 위쪽에서 운영자 · 운전자 · 학부모를 바꿀 수 있어요.</p>
      {prompt && <button className="button primary full" disabled={busy} onClick={install}>{busy ? "설치 창 여는 중…" : "앱 설치하기"}</button>}
      {message && <p role="status" className="notice">{message}</p>}
      <div className="install-steps">
        <h3>아이폰 · Safari</h3>
        <ol><li>Safari에서 이 주소를 여세요.</li><li>공유 버튼을 누르고 <strong>홈 화면에 추가</strong>를 선택하세요.</li><li><strong>웹 앱으로 열기</strong>가 보이면 켠 뒤 <strong>추가</strong>를 누르세요.</li></ol>
        <h3>안드로이드 · Chrome</h3>
        <ol><li>Chrome에서 이 주소를 여세요.</li><li>오른쪽 위 <strong>⋮ 메뉴 → 홈 화면에 추가 → 설치</strong>를 선택하세요. 기기에 따라 <strong>앱 설치</strong>로 표시됩니다.</li></ol>
        <p>메신저 안에서 열었다면 Safari 또는 Chrome으로 옮겨서 추가해 주세요.</p>
      </div>
      <div className="notice">처음 실행할 때 인터넷 연결이 필요해요. 설치한 앱에서 위치 권한을 다시 허용해야 할 수 있습니다. GPS는 앱 화면이 열려 있을 때 추적하며, 화면 잠금·다른 앱 전환 시 일시 중지됩니다. 브라우저의 체험 데이터는 설치한 앱과 별도로 저장될 수 있어요.</div>
    </Modal>}
  </>;
}
