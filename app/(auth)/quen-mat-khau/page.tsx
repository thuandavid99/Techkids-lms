import { AuthShell } from "@/components/auth/AuthShell";
import { QuenMkForm } from "@/components/auth/Forms";

export const metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return <AuthShell><QuenMkForm /></AuthShell>;
}
