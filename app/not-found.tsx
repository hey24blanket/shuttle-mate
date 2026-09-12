import Link from "next/link";
export default function NotFound() {
  return (
    <div className="loading">
      <h1>찾는 페이지가 없어요.</h1>
      <Link className="button primary" href="/admin">
        오늘의 운행으로 돌아가기
      </Link>
    </div>
  );
}
