import type { Metadata } from "next";
import { Provider } from "@/components/provider";
import "./globals.css";
export const metadata: Metadata = {
  title: "셔틀메이트 · 매일의 이동에 안심을",
  description:
    "학부모, 운전자, 운영자가 함께 확인하는 오늘의 셔틀. 인터랙티브 프로토타입.",
  manifest: "/manifest.webmanifest",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
