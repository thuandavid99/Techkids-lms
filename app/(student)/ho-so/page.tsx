import { redirect } from "next/navigation";

// Hồ sơ đã gộp vào trang "Tài khoản của em" (/cai-dat) — giữ đường dẫn cũ để link cũ không hỏng.
export default function Page() {
  redirect("/cai-dat");
}
