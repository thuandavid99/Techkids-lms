import Image from "next/image";
import Link from "next/link";
import { IMG } from "@/lib/brand";
import { btnClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <div className="card card-pad max-w-md text-center">
        <Image src={IMG.cheer} alt="" width={180} height={150} className="mx-auto h-auto w-44" />
        <p className="mt-2 text-6xl font-extrabold text-cam-500">404</p>
        <h1 className="mt-1 text-xl font-extrabold">Không tìm thấy trang này</h1>
        <p className="mt-2 text-slate-600">Có thể đường dẫn bị gõ sai, hoặc nội dung đã bị ẩn/xóa.</p>
        <Link href="/" className={btnClass("primary", "md", "mt-5")}>Về trang chủ</Link>
      </div>
    </main>
  );
}
