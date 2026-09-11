"use client";
import {
  BusFront,
  ArrowUpRight,
  ShieldCheck,
  Route,
  Heart,
  Check,
  ArrowRight,
} from "lucide-react";
import { startDemo } from "@/components/provider";
import Link from "next/link";
export default function Home() {
  return (
    <div className="landing">
      <header className="landing-header">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <BusFront size={22} />
          </span>
          셔틀메이트<span className="wordmark">SHUTTLE MATE</span>
        </Link>
        <Link className="button quiet" href="/login">
          기관 로그인 <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="landing-main">
        <div className="landing-copy">
          <span className="eyebrow">작은 이동에, 큰 안심을.</span>
          <h1>
            아이의 하루는
            <br />
            <span>안심하는 이동</span>에서
            <br />
            시작되니까.
          </h1>
          <p>
            셔틀이 어디까지 왔는지, 아이가 잘 탔는지.
            <br />
            오늘의 이동을 함께 확인하는 셔틀메이트.
          </p>
          <div className="landing-actions">
            <button className="primary" onClick={() => startDemo("parent")}>
              학부모 화면 체험하기 <ArrowRight size={19} />
            </button>
            <button onClick={() => startDemo("driver")}>
              운전자 화면 <ArrowUpRight size={17} />
            </button>
          </div>
          <button className="text-button" onClick={() => startDemo("admin")}>
            운영자 대시보드 둘러보기 <ArrowRight size={15} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              if (
                confirm("이 브라우저의 체험 기록을 초기화하고 새로 시작할까요?")
              )
                startDemo("parent", true);
            }}
          >
            새 체험 시작
          </button>
          <p className="demo-disclaimer">
            체험은 가상의 아이와 노선으로 진행됩니다.
            <br />이 브라우저의 탭끼리 연결되며, 다른 기기에는 공유되지
            않습니다.
          </p>
        </div>
        <div className="landing-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="floating-note">
            <span className="round-icon mint">
              <Check size={18} />
            </span>
            <div>
              아이의 이동이 한눈에<small>출발부터 안전한 하차까지</small>
            </div>
          </div>
          <div className="phone">
            <div className="phone-top">
              <span className="brand-icon">
                <BusFront size={20} />
              </span>
              <b>셔틀메이트</b>
              <span className="tiny-dot" />
            </div>
            <div className="phone-greeting">서아의 오늘 셔틀</div>
            <div className="phone-status">
              <span className="pill green">운행 중 · 화면 예시</span>
              <h2>
                조금만 기다려주세요.
                <br />
                2정거장 남았어요.
              </h2>
              <div className="mini-road">
                <span />
                <span />
                <BusFront size={27} />
                <span />
              </div>
              <div className="spread">
                <small>셔틀 출발</small>
                <small>우리 정차지</small>
              </div>
            </div>
            <div className="phone-child">
              <span className="avatar">서</span>
              <div>
                <b>이서아</b>
                <small>유아체육 1반</small>
              </div>
              <Heart size={18} />
            </div>
            <div className="phone-stop">
              <small>오늘 탑승 장소</small>
              <b>드림빌아파트 정문</b>
              <span>오후 2:15 예정</span>
            </div>
            <div className="phone-bottom">
              <ShieldCheck size={17} /> 오늘도 안전하게, 함께 갑니다.
            </div>
          </div>
          <div className="floating-note bottom-note">
            <span className="round-icon yellow">
              <Route size={19} />
            </span>
            <div>
              같은 운행, 필요한 정보만<small>학부모 · 운전자 · 운영자</small>
            </div>
          </div>
        </div>
      </main>
      <footer className="landing-footer">
        <span>오늘의 이동을, 함께 안심하다.</span>
        <span>SHUTTLE MATE · V1</span>
      </footer>
    </div>
  );
}
