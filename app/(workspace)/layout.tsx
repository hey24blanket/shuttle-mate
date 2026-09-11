import { Provider } from "@/components/provider";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
