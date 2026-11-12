import type { NextConfig } from "next";

// Cấu hình Next.js. Ảnh từ Supabase Storage không qua next/image (dùng link ký ngắn hạn).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // exceljs chỉ chạy ở server, không cần đóng gói
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: {
      // Bài nộp dạng code gửi qua server action; file lớn tải thẳng lên Storage bằng link ký.
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
    ];
  },
};

export default nextConfig;
