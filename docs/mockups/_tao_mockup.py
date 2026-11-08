# Sinh SVG mockup cùng phong cách bộ ảnh TechKids (1400x780)
import os, html
OUT = "/home/claude/python-lms/docs/mockups"
os.makedirs(OUT, exist_ok=True)
W, H = 1400, 780
NAVY, NAVY2, CAM, XANH, TIEU = "#14224F", "#1B2A5E", "#F97316", "#2563EB", "#0F1B4C"
e = html.escape

def t(x, y, s, size=16, w=500, fill="#334155", anchor="start", extra=""):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{w}" fill="{fill}" text-anchor="{anchor}" {extra}>{e(s)}</text>'

def rect(x, y, w, h, r=20, fill="#fff", stroke="#E3ECFA", extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" {extra}/>'

def card(x, y, w, h):
    return rect(x, y, w, h, 20, "#ffffff", "#E3ECFA", 'filter="url(#sh)"')

PILL = {"xanh": ("#DCFCE7", "#15803D"), "cam": ("#FFEDD5", "#C2410C"), "do": ("#FEE2E2", "#B91C1C"),
        "xd": ("#DBEAFE", "#1D4ED8"), "xam": ("#F1F5F9", "#475569"), "tim": ("#EDE9FE", "#6D28D9")}
def pill(x, y, s, kind="xanh", size=13):
    bg, fg = PILL[kind]; w = int(len(s) * size * 0.58) + 22
    return rect(x, y - size - 4, w, size + 12, (size + 12) / 2, bg, "none") + t(x + 11, y + 1, s, size, 600, fg), w

def btn(x, y, s, kind="cam", w=None, h=38, size=14):
    w = w or int(len(s) * size * 0.6) + 36
    if kind == "cam": bg, fg, st = CAM, "#fff", "none"
    elif kind == "navy": bg, fg, st = "#1E2B5E", "#fff", "none"
    elif kind == "xanh": bg, fg, st = XANH, "#fff", "none"
    elif kind == "vienxanh": bg, fg, st = "#fff", XANH, XANH
    elif kind == "viencam": bg, fg, st = "#fff", CAM, CAM
    else: bg, fg, st = "#fff", "#334155", "#CBD5E1"
    return rect(x, y, w, h, h / 2, bg, st) + t(x + w / 2, y + h / 2 + size * 0.36, s, size, 600, fg, "middle")

DEFS = f'''<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8F1FF"/><stop offset="1" stop-color="#F7FAFF"/></linearGradient>
<linearGradient id="sb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{NAVY2}"/><stop offset="1" stop-color="{NAVY}"/></linearGradient>
<filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#1E3A8A" flood-opacity="0.08"/></filter>
</defs>'''

GV_MENU = ["Tổng quan", "Quản lý lớp", "Bài tập", "Học sinh", "Báo cáo", "Chương trình học", "Cài đặt"]
HS_MENU = ["Trang chủ", "Buổi học", "Bài tập", "Kho học liệu", "Kết quả", "Thông báo", "Cài đặt"]

def chrome(active, menu, user="Thầy Thuận", lop="Lớp 6A1"):
    s = [f'<rect width="{W}" height="{H}" fill="url(#bg)"/>', f'<rect width="195" height="{H}" fill="url(#sb)"/>']
    # logo placeholder (thay bằng logo thật)
    s.append(f'<circle cx="97" cy="58" r="34" fill="#24367A" stroke="#3B82F6" stroke-dasharray="4 3"/>')
    s.append(t(97, 63, "logo", 12, 500, "#93C5FD", "middle"))
    s.append(t(62, 122, "Tech", 24, 800, "#fff") + t(116, 122, "Kids", 24, 800, "#FBBF24"))
    s.append(t(97, 146, "Academy", 16, 600, "#fff", "middle"))
    y = 180
    for m in menu:
        if m == active:
            s.append(rect(14, y, 167, 44, 12, CAM, "none"))
            s.append(t(40, y + 28, m, 15, 600, "#fff"))
        else:
            s.append(t(40, y + 28, m, 15, 500, "#CBD5E1"))
        s.append(f'<circle cx="28" cy="{y+22}" r="6" fill="{"#fff" if m==active else "#64748B"}"/>')
        y += 52
    s.append(t(97, H - 90, "Cùng TechKids", 15, 700, "#fff", "middle"))
    s.append(t(97, H - 68, "chinh phục", 15, 700, "#FBBF24", "middle"))
    s.append(t(97, H - 46, "thế giới Python!", 15, 700, "#FBBF24", "middle"))
    # topbar
    if lop:
        s.append(rect(225, 18, 190, 42, 21, "#fff", "#DCE8FF")); s.append(t(250, 45, "🎓 " + lop + "  ▾", 15, 600, TIEU))
    s.append(rect(1140, 16, 48, 46, 14, "#fff", "#E3ECFA")); s.append(t(1164, 46, "🔔", 18, 400, "#000", "middle"))
    s.append(f'<circle cx="1182" cy="22" r="9" fill="#EF4444"/>' + t(1182, 26, "3", 11, 700, "#fff", "middle"))
    s.append(f'<circle cx="1232" cy="39" r="21" fill="#DBEAFE"/>' + t(1262, 45, user + "  ▾", 15, 600, TIEU))
    return s

def save(name, body, title):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="Be Vietnam Pro, Segoe UI, Arial, sans-serif"><title>{e(title)}</title>{DEFS}{"".join(body)}</svg>'
    open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8").write(svg)

def tbl_header(x, y, cols, w):
    s = [rect(x, y, w, 40, 12, "#F1F6FF", "none")]
    for cx, c in cols: s.append(t(x + cx, y + 26, c, 13, 700, "#64748B"))
    return s

# ---------- 1. Chương trình học (PPCT) ----------
b = chrome("Chương trình học", GV_MENU, lop=None)
b.append(rect(225, 18, 300, 42, 21, "#fff", "#DCE8FF") + t(248, 45, "📘 Python cơ bản – THCS  ▾", 15, 600, TIEU))
b.append(t(225, 110, "Chương trình học", 32, 800, TIEU))
b.append(t(225, 138, "48 buổi · 4 module · áp dụng cho 3 lớp", 15, 500, "#64748B"))
x = 760
for s_, k in [("Nhập từ Excel", "vienxanh"), ("Xuất Excel", "viencam"), ("Áp dụng cho lớp", "navy"), ("+ Thêm module", "cam")]:
    w = int(len(s_) * 8.4) + 36; b.append(btn(x, 92, s_, k, w)); x += w + 10
b.append(card(225, 160, 1150, 600))
b.append(rect(245, 178, 300, 38, 19, "#F8FAFF", "#DCE8FF") + t(268, 203, "🔍 Tìm buổi…", 14, 500, "#94A3B8"))
b.append(btn(560, 178, "Lọc loại buổi ▾", "vien", 150))
b.extend(tbl_header(245, 230, [(30, "⋮⋮"), (70, "BUỔI"), (150, "TÊN BUỔI"), (520, "LOẠI"), (680, "TÀI LIỆU"), (790, "BÀI TẬP"), (900, "ĐÃ DẠY (6A1)"), (1030, "")], 1110))
rows = [
 ("mod", "▾ Module 1: Làm quen với Python  (12 buổi)"),
 ("1", "Giới thiệu Python, cài đặt môi trường", ("Lý thuyết", "xd"), "2", "1", True),
 ("2", "Biến, kiểu dữ liệu, nhập xuất", ("Lý thuyết", "xd"), "3", "2", True),
 ("3", "Toán tử và biểu thức", ("Thực hành", "xanh"), "1", "3", True),
 ("drag", "", None, "", "", False),
 ("10–11", "Ôn tập module 1", ("Ôn tập", "tim"), "1", "4", False),
 ("12", "Kiểm tra module 1", ("Kiểm tra", "cam"), "1", "1", False),
 ("mod", "▸ Module 2: Cấu trúc rẽ nhánh  (10 buổi)"),
 ("mod", "▸ Module 3: Vòng lặp  (14 buổi)"),
]
y = 282
for r in rows:
    if r[0] == "mod":
        b.append(rect(245, y, 1110, 40, 12, "#EEF4FF", "none") + t(265, y + 26, r[1], 15, 700, TIEU))
        b.append(t(1250, y + 26, "+ Thêm buổi", 13, 600, XANH)); y += 48; continue
    if r[0] == "drag":
        b.append(f'<line x1="245" y1="{y+4}" x2="1355" y2="{y+4}" stroke="{XANH}" stroke-width="3" stroke-dasharray="8 5"/>')
        b.append(t(800, y + 22, "Thả vào đây để chèn giữa buổi 3 và 10–11", 12, 500, XANH, "middle")); y += 32; continue
    kiem = r[2][0] == "Kiểm tra"
    b.append(rect(245, y, 1110, 46, 14, "#FFF4EA" if kiem else "#fff", "#FDBA74" if kiem else "#E3ECFA"))
    b.append(t(275, y + 29, "⋮⋮", 16, 700, "#94A3B8"))
    b.append(t(315, y + 29, r[0], 15, 700, TIEU)); b.append(t(395, y + 29, r[1], 15, 600, "#1E293B"))
    p, _ = pill(765, y + 28, r[2][0], r[2][1]); b.append(p)
    b.append(t(940, y + 29, "📄 " + r[3], 14, 500, "#475569")); b.append(t(1040, y + 29, "📝 " + r[4], 14, 500, "#475569"))
    b.append(rect(1160, y + 13, 20, 20, 5, "#16A34A" if r[5] else "#fff", "#16A34A" if r[5] else "#CBD5E1"))
    if r[5]: b.append(t(1170, y + 28, "✓", 14, 800, "#fff", "middle"))
    b.append(t(1290, y + 29, "✎   ⋯", 16, 700, "#64748B"))
    y += 54
b.append(rect(905, 560, 230, 180, 14, "#fff", "#CBD5E1", 'filter="url(#sh)"'))
for i, m in enumerate(["Sửa", "Chèn buổi trước", "Chèn buổi sau", "Nhân bản", "Gộp với buổi sau", "Tách buổi", "Xóa (vào thùng rác)"]):
    b.append(t(925, 584 + i * 23, m, 13, 500, "#B91C1C" if "Xóa" in m else "#334155"))
save("gv-chuong-trinh-hoc", b, "Giáo viên – Chương trình học (PPCT)")

# ---------- 2. Nhập PPCT từ Excel ----------
b = chrome("Chương trình học", GV_MENU, lop=None)
b.append(t(225, 110, "Nhập chương trình từ Excel", 32, 800, TIEU))
steps = ["Chọn file", "Ghép cột", "Xem trước", "Xác nhận"]
for i, s_ in enumerate(steps):
    cx = 260 + i * 210; act = i == 2; done = i < 2
    b.append(f'<circle cx="{cx}" cy="150" r="16" fill="{CAM if act else ("#16A34A" if done else "#E2E8F0")}"/>')
    b.append(t(cx, 156, "✓" if done else str(i + 1), 14, 700, "#fff" if (act or done) else "#64748B", "middle"))
    b.append(t(cx + 24, 156, s_, 15, 700 if act else 500, TIEU if act else "#64748B"))
    if i < 3: b.append(f'<line x1="{cx+110}" y1="150" x2="{cx+190}" y2="150" stroke="#CBD5E1" stroke-width="2"/>')
b.append(card(225, 190, 740, 570))
b.append(t(250, 228, "Xem trước dạng cây  —  ppct.xlsx", 18, 700, TIEU))
tree = [(0, "📦 Module 1: Làm quen với Python", None), (1, "Buổi 1: Giới thiệu Python", ("Lý thuyết", "xd")),
        (2, "🔗 Tài liệu: Slide buổi 1 (link)", None), (1, "Buổi 2: Biến và kiểu dữ liệu", ("Lý thuyết", "xd")),
        (1, "Buổi 10–11: Ôn tập", ("Ôn tập", "tim")), (1, "Buổi 12: Kiểm tra module 1", ("Kiểm tra", "cam")),
        (0, "— hết module (dòng tô màu nổi bật ở Excel)", None), (0, "📦 Module 2: Cấu trúc rẽ nhánh", None),
        (1, "Chủ đề: Câu lệnh if", None), (2, "Buổi 13: if – else", ("Thực hành", "xanh")), (2, "Buổi 14: if lồng nhau", ("Thực hành", "xanh"))]
y = 268
for lv, s_, p in tree:
    col = "#94A3B8" if s_.startswith("—") else (TIEU if lv == 0 else "#1E293B")
    b.append(t(262 + lv * 28, y, s_, 15, 700 if lv == 0 else 500, col))
    if p: pp, _ = pill(800, y, p[0], p[1]); b.append(pp)
    y += 38
b.append(card(985, 190, 390, 330))
b.append(t(1008, 228, "⚠ Cảnh báo (3)", 18, 700, "#C2410C"))
for i, s_ in enumerate(["Dòng 15: thiếu tên buổi → bỏ qua", "Dòng 22: \"10,11\" đổi thành \"10–11\"", "Dòng 40: link không mở được – kiểm tra lại"]):
    b.append(rect(1005, 250 + i * 72, 350, 60, 12, "#FFF7ED", "#FED7AA")); b.append(t(1020, 285 + i * 72, s_, 13, 500, "#9A3412"))
b.append(card(985, 540, 390, 150))
b.append(t(1008, 576, "Tóm tắt", 18, 700, TIEU))
for i, (k, v) in enumerate([("Module", "4"), ("Buổi học", "48"), ("Tài liệu (link)", "31"), ("Bỏ qua", "1 dòng")]):
    b.append(t(1008, 600 + i * 24, k, 14, 500, "#475569") + t(1355, 600 + i * 24, v, 14, 700, TIEU, "end"))
b.append(btn(1195, 708, "Xác nhận nhập", "cam", 180, 44)); b.append(btn(1075, 708, "Quay lại", "vien", 110, 44))
save("gv-nhap-ppct-excel", b, "Giáo viên – Nhập PPCT từ Excel (bước 3: xem trước)")

# ---------- 3. Hàng đợi chấm + Cần hỗ trợ ----------
b = chrome("Bài tập", GV_MENU)
b.append(t(225, 110, "Hàng đợi chấm bài", 32, 800, TIEU)); b.append(btn(1180, 82, "Chấm tiếp (6) →", "cam", 190, 44))
b.append(rect(225, 130, 200, 40, 20, CAM, "none") + t(325, 156, "Chờ chấm (6)", 15, 700, "#fff", "middle"))
b.append(rect(435, 130, 220, 40, 20, "#fff", "#DCE8FF") + t(545, 156, "🙋 Cần hỗ trợ (2)", 15, 600, TIEU, "middle"))
b.append(card(225, 190, 1150, 330))
b.extend(tbl_header(245, 205, [(20, "HỌC SINH"), (260, "BÀI TẬP"), (620, "NỘP LÚC (mới nhất)"), (830, "NHÃN"), (990, "")], 1110))
data = [("Nguyễn Minh An", "Bài tập 7.1: Tính tổng dãy số", "06/11 20:15 (lần 2)", ("Đúng hạn", "xanh")),
        ("Trần Bảo Ngọc", "Bài tập 7.1: Tính tổng dãy số", "07/11 08:02", ("Trễ", "cam")),
        ("Lê Gia Huy", "Bài tập 6.2: Đoán số", "05/11 19:40", ("Đúng hạn", "xanh")),
        ("Phạm Khánh Linh", "Bài tập 6.2: Đoán số", "05/11 21:11", ("Đúng hạn", "xanh"))]
y = 262
for n, bt, tg, lb in data:
    b.append(f'<circle cx="275" cy="{y+18}" r="16" fill="#DBEAFE"/>' + t(300, y + 24, n, 15, 600, "#1E293B"))
    b.append(t(505, y + 24, bt, 15, 500, "#334155")); b.append(t(865, y + 24, tg, 14, 500, "#475569"))
    p, _ = pill(1075, y + 23, lb[0], lb[1]); b.append(p)
    b.append(btn(1260, y + 2, "Chấm", "xanh", 80, 34, 14)); y += 62
b.append(t(225, 560, "Tab “Cần hỗ trợ” (em tích “Em chưa làm được”)", 18, 700, TIEU))
b.append(card(225, 580, 1150, 180))
for i, (n, bt, gc) in enumerate([("Đỗ Hải Nam", "Bài tập 7.2: In bảng cửu chương", "Em không biết dùng 2 vòng for lồng nhau ạ"),
                                  ("Vũ Thu Hà", "Bài tập 6.3: Số nguyên tố", "Em chạy bị lỗi IndentationError")]):
    yy = 600 + i * 78
    b.append(rect(245, yy, 1110, 66, 14, "#F5F3FF", "#DDD6FE"))
    b.append(t(265, yy + 28, "🙋 " + n + " · " + bt, 15, 700, "#4C1D95")); b.append(t(265, yy + 52, "“" + gc + "”", 14, 500, "#6D28D9"))
    b.append(btn(1095, yy + 15, "Mở bài", "vienxanh", 100, 36)); b.append(btn(1205, yy + 15, "Đã hỗ trợ", "navy", 130, 36))
save("gv-hang-doi-cham", b, "Giáo viên – Hàng đợi chấm và Cần hỗ trợ")

# ---------- 4. Tình hình nộp bài theo buổi ----------
b = chrome("Quản lý lớp", GV_MENU)
b.append(t(225, 110, "Tình hình nộp bài – Buổi 7: Vòng lặp for", 30, 800, TIEU))
b.append(rect(225, 128, 260, 40, 20, "#fff", "#DCE8FF") + t(245, 154, "Buổi 7: Vòng lặp for  ▾", 14, 600, TIEU))
x = 500
for s_, k in [("Tất cả 28", "xd"), ("Đúng hạn 20", "xanh"), ("Trễ 3", "cam"), ("Không nộp bài 3", "do"), ("Chờ chấm 5", "xam"), ("🙋 Em chưa làm được 2", "tim")]:
    p, w = pill(x, 154, s_, k, 14); b.append(p); x += w + 10
b.append(card(225, 190, 1150, 500))
b.extend(tbl_header(245, 205, [(20, "HỌC SINH"), (300, "BÀI 7.1 (hạn 06/11 21:00)"), (620, "BÀI 7.2 (tùy chọn)"), (900, "GHI CHÚ")], 1110))
data = [("Nguyễn Minh An", ("Đúng hạn · đã chấm 9.0", "xanh"), ("Đúng hạn · chờ chấm", "xam"), ""),
        ("Trần Bảo Ngọc", ("Trễ · chờ chấm", "cam"), ("Chưa nộp", "xam"), "Nộp lúc 07/11 08:02"),
        ("Lê Gia Huy", ("Không nộp bài", "do"), ("Chưa nộp", "xam"), "Cần nhắc phụ huynh"),
        ("Đỗ Hải Nam", ("🙋 Em chưa làm được", "tim"), ("Chưa nộp", "xam"), "“Em không hiểu range”"),
        ("Vũ Thu Hà", ("Miễn nộp", "xam"), ("Miễn nộp", "xam"), "Ốm – thầy miễn"),
        ("Phạm Khánh Linh", ("Gia hạn riêng → 08/11", "xd"), ("Chưa nộp", "xam"), "")]
y = 262
for n, a1, a2, gc in data:
    b.append(t(265, y + 24, n, 15, 600, "#1E293B"))
    p, w = pill(545, y + 23, a1[0], a1[1]); b.append(p); b.append(t(555 + w, y + 24, "⋯", 18, 700, "#94A3B8"))
    p, w = pill(865, y + 23, a2[0], a2[1]); b.append(p)
    b.append(t(1145, y + 24, gc, 13, 500, "#64748B")); y += 66
b.append(rect(700, 425, 250, 150, 14, "#fff", "#CBD5E1", 'filter="url(#sh)"'))
for i, m in enumerate(["Miễn nộp", "Đã nộp ngoài hệ thống", "Gia hạn riêng…", "Nộp hộ…", "Mở cho nộp lại"]):
    b.append(t(720, 451 + i * 26, m, 14, 500, "#334155"))
b.append(btn(1150, 710, "Sang Nhắc phụ huynh →", "cam", 225, 44))
save("gv-tinh-hinh-nop-bai", b, "Giáo viên – Tình hình nộp bài theo buổi")

# ---------- 5. Bảng mật khẩu tạm ----------
b = chrome("Học sinh", GV_MENU)
b.append(f'<rect width="{W}" height="{H}" fill="#0F172A" opacity="0.45"/>')
b.append(rect(330, 90, 740, 600, 24, "#fff", "none", 'filter="url(#sh)"'))
b.append(t(700, 145, "🔑 Mật khẩu tạm của 4 học sinh", 24, 800, TIEU, "middle"))
b.append(rect(370, 165, 660, 56, 14, "#FEF3C7", "#FCD34D"))
b.append(t(700, 199, "Bảng này chỉ hiện MỘT LẦN. Hãy tải về hoặc sao chép ngay.", 15, 700, "#92400E", "middle"))
b.extend(tbl_header(370, 240, [(20, "MÃ HỌC SINH"), (220, "HỌ TÊN"), (470, "MẬT KHẨU TẠM")], 660))
for i, (m, n, pw) in enumerate([("hs6a1001", "Nguyễn Minh An", "k7QmT4xa"), ("hs6a1002", "Trần Bảo Ngọc", "Xp9RwB3e"),
                                 ("hs6a1003", "Lê Gia Huy", "2LmhV8zq"), ("hs6a1004", "Đỗ Hải Nam", "nH5r3TkY")]):
    yy = 300 + i * 54
    b.append(t(390, yy + 22, m, 15, 600, TIEU)); b.append(t(590, yy + 22, n, 15, 500, "#1E293B"))
    b.append(rect(835, yy + 2, 180, 32, 8, "#F1F5F9", "none") + t(925, yy + 23, pw, 15, 700, "#0F172A", "middle", 'font-family="Consolas, monospace"'))
b.append(t(700, 545, "Học sinh đăng nhập bằng mã + mật khẩu tạm, sau đó phải tự đổi mật khẩu (một lần).", 14, 500, "#64748B", "middle"))
b.append(btn(400, 600, "Sao chép tất cả", "vienxanh", 190, 46)); b.append(btn(605, 600, "Tải bảng (.xlsx)", "cam", 200, 46))
b.append(btn(820, 600, "Tôi đã lưu – Đóng", "navy", 210, 46))
save("gv-bang-mat-khau-tam", b, "Giáo viên – Bảng mật khẩu tạm (hiện một lần)")

# ---------- 6. HS đổi mật khẩu lần đầu ----------
b = [f'<rect width="{W}" height="{H}" fill="url(#bg)"/>']
b.append(card(250, 90, 900, 600))
b.append(rect(250, 90, 420, 600, 20, "#EEF4FF", "none"))
b.append(rect(330, 210, 260, 260, 30, "#fff", "#93C5FD", 'stroke-dasharray="6 5"'))
b.append(t(460, 335, "robot-shield.png", 14, 500, "#64748B", "middle")); b.append(t(460, 358, "(hình minh họa)", 12, 500, "#94A3B8", "middle"))
b.append(t(460, 530, "Chào mừng em đến lớp Python!", 18, 700, TIEU, "middle"))
b.append(t(710, 170, "Đặt mật khẩu mới", 30, 800, TIEU)); b.append(t(710, 202, "Đây là lần đầu em đăng nhập. Hãy tự đặt mật khẩu riêng", 14, 500, "#64748B"))
b.append(t(710, 222, "và ghi nhớ thật kỹ nhé (em chỉ tự đổi được lần này).", 14, 500, "#64748B"))
for i, lb in enumerate(["Mật khẩu mới", "Nhập lại mật khẩu mới"]):
    yy = 260 + i * 100
    b.append(t(710, yy, lb, 15, 600, "#334155"))
    b.append(rect(710, yy + 12, 400, 50, 14, "#F8FAFF", "#CBD5E1") + t(730, yy + 44, "••••••••", 18, 600, "#334155") + t(1085, yy + 43, "👁", 16, 400, "#64748B", "end"))
b.append(t(710, 485, "✓ Ít nhất 6 ký tự   ✓ Có cả chữ và số   ✓ Hai ô giống nhau", 14, 600, "#16A34A"))
b.append(btn(710, 520, "Xác nhận", "cam", 400, 52, 17))
b.append(t(910, 610, "Quên mật khẩu sau này? Bấm “Quên mật khẩu”", 13, 500, "#64748B", "middle")); b.append(t(910, 630, "ở trang đăng nhập để báo thầy.", 13, 500, "#64748B", "middle"))
save("hs-doi-mat-khau-lan-dau", b, "Học sinh – Đổi mật khẩu lần đầu")

# ---------- 7. HS thông báo ----------
b = chrome("Thông báo", HS_MENU, user="Minh An", lop="Lớp 6A1")
b.append(t(225, 110, "Thông báo", 32, 800, TIEU)); b.append(btn(1150, 85, "Đánh dấu tất cả đã đọc", "vienxanh", 225))
b.append(card(225, 140, 1150, 620))
items = [("📝", "Bài tập mới: Bài tập 7.2: In bảng cửu chương", "Hạn nộp 13/11 21:00", "5 phút trước", True, "#DBEAFE"),
         ("⏰", "Sắp đến hạn: Bài tập 7.1 còn dưới 24 giờ", "Hạn nộp 06/11 21:00 – em chưa nộp", "2 giờ trước", True, "#FFEDD5"),
         ("✅", "Thầy đã chấm Bài tập 6.2: Đoán số – 9.0 điểm", "“Code gọn, đặt tên biến rõ ràng. Tốt lắm!”", "Hôm qua", False, "#DCFCE7"),
         ("🔁", "Cần nộp lại: Bài tập 6.3: Số nguyên tố", "Hạn nộp lại 08/11 21:00", "Hôm qua", False, "#FEE2E2"),
         ("📢", "Thông báo lớp: Thứ 7 này lớp học bù buổi 8", "Thầy Thuận · Lớp 6A1", "03/11", False, "#EDE9FE")]
y = 160
for ic, tt, ph, tg, moi, bg in items:
    b.append(rect(245, y, 1110, 104, 16, "#F8FBFF" if moi else "#fff", "#DCE8FF" if moi else "#EEF2F7"))
    b.append(f'<circle cx="295" cy="{y+52}" r="28" fill="{bg}"/>' + t(295, y + 61, ic, 22, 400, "#000", "middle"))
    b.append(t(345, y + 44, tt, 17, 700 if moi else 600, TIEU)); b.append(t(345, y + 72, ph, 14, 500, "#64748B"))
    b.append(t(1335, y + 44, tg, 13, 500, "#94A3B8", "end"))
    if moi: b.append(f'<circle cx="1330" cy="{y+70}" r="6" fill="{CAM}"/>')
    y += 116
save("hs-thong-bao", b, "Học sinh – Thông báo")

# ---------- 8. Phiếu tiến độ (trang in) ----------
b = [f'<rect width="{W}" height="{H}" fill="#E5E7EB"/>', rect(360, 20, 680, 740, 4, "#fff", "#D1D5DB", 'filter="url(#sh)"')]
b.append(t(400, 72, "TechKids Academy", 20, 800, TIEU)); b.append(t(1000, 72, "PHIẾU TIẾN ĐỘ HỌC TẬP", 16, 800, CAM, "end"))
b.append(f'<line x1="400" y1="88" x2="1000" y2="88" stroke="{TIEU}" stroke-width="2"/>')
for i, (k, v) in enumerate([("Học sinh", "Nguyễn Minh An (hs6a1001)"), ("Lớp", "6A1 – Python cơ bản"), ("Thời gian", "Học kỳ 1, năm học 2026–2027"), ("Ngày in", "06/11/2026")]):
    b.append(t(400, 120 + i * 26, k + ":", 14, 600, "#475569") + t(520, 120 + i * 26, v, 14, 600, "#111827"))
for i, (k, v, c) in enumerate([("Hoàn thành", "85%", "#16A34A"), ("Điểm TB (hệ số)", "8.7", XANH), ("Nộp trễ", "2 bài", "#C2410C"), ("Không nộp bài", "1 bài", "#B91C1C")]):
    xx = 400 + i * 152
    b.append(rect(xx, 230, 140, 76, 12, "#F8FAFF", "#DCE8FF") + t(xx + 70, 266, v, 22, 800, c, "middle") + t(xx + 70, 292, k, 12, 600, "#64748B", "middle"))
b.extend(tbl_header(400, 330, [(12, "MODULE / BÀI TẬP"), (330, "NỘP"), (430, "ĐIỂM"), (500, "HỆ SỐ")], 600))
rows = [("Module 1: Làm quen", "", "8.8", "", True), ("Bài tập 1.1: In lời chào", "Đúng hạn", "9.0", "1", False),
        ("Bài tập 2.1: Nhập tên, tuổi", "Đúng hạn", "8.5", "1", False), ("Kiểm tra module 1", "Đúng hạn", "8.8", "2", False),
        ("Module 2: Rẽ nhánh", "", "8.5", "", True), ("Bài tập 5.1: Chẵn hay lẻ", "Trễ", "8.0", "1", False),
        ("Bài tập 6.2: Đoán số", "Đúng hạn", "9.0", "1", False), ("Bài tập 6.3: Số nguyên tố", "Không nộp bài", "—", "1", False)]
y = 386
for n, np_, d, hs, mod in rows:
    if mod: b.append(rect(400, y - 18, 600, 28, 6, "#EEF4FF", "none"))
    b.append(t(412, y, n, 13, 700 if mod else 500, TIEU if mod else "#1F2937"))
    col = {"Trễ": "#C2410C", "Không nộp bài": "#B91C1C"}.get(np_, "#15803D")
    b.append(t(730, y, np_, 13, 600, col)); b.append(t(830, y, d, 13, 700, "#111827")); b.append(t(910, y, hs, 13, 500, "#475569")); y += 32
b.append(t(400, 660, "Nhận xét của giáo viên:", 14, 700, TIEU))
b.append(t(400, 686, "Em tiếp thu nhanh, cần chú ý nộp bài đúng hạn và hỏi thầy khi gặp bài khó.", 13, 500, "#374151"))
b.append(t(1000, 735, "Giáo viên: Thầy Thuận", 13, 600, "#374151", "end"))
b.append(btn(1080, 30, "🖨 In / Lưu PDF", "cam", 180, 44))
save("gv-phieu-tien-do-in", b, "Phiếu tiến độ – trang in (In → Lưu PDF)")
print("ok")

# ---------- 9. Đăng nhập giáo viên (/giao-vien) ----------
b = [f'<rect width="{W}" height="{H}" fill="url(#sb)"/>']
b.append(f'<circle cx="150" cy="95" r="38" fill="#24367A" stroke="#3B82F6" stroke-dasharray="4 3"/>' + t(150, 100, "logo", 12, 500, "#93C5FD", "middle"))
b.append(t(205, 92, "Tech", 30, 800, "#fff") + t(278, 92, "Kids", 30, 800, "#FBBF24") + t(205, 120, "Academy", 22, 700, "#fff"))
b.append(rect(112, 165, 190, 34, 17, CAM, "none") + t(207, 188, "Khu vực giáo viên", 15, 700, "#fff", "middle"))
b.append(t(112, 262, "Quản lý lớp Python", 52, 800, "#fff"))
b.append(t(112, 305, "Soạn bài, chấm bài, theo dõi tiến độ lớp mình phụ trách", 20, 500, "#BFDBFE"))
b.append(rect(112, 340, 520, 330, 24, "#1E3A8A", "#3B82F6", 'stroke-dasharray="6 5" opacity="0.6"') + t(372, 510, "school-illustration.png", 14, 500, "#93C5FD", "middle"))
b.append(rect(820, 150, 470, 500, 28, "#fff", "none", 'filter="url(#sh)"'))
b.append(t(1055, 215, "Đăng nhập giáo viên", 28, 800, TIEU, "middle"))
b.append(t(1055, 245, "Dùng email và mật khẩu quản trị đã cấp", 15, 500, "#64748B", "middle"))
for i, (ic, ph) in enumerate([("✉", "Email giáo viên"), ("🔒", "Mật khẩu")]):
    yy = 275 + i * 80
    b.append(rect(860, yy, 390, 56, 16, "#F8FAFF", "#CBD5E1") + t(885, yy + 35, ic, 17, 500, TIEU) + t(915, yy + 35, ph, 16, 500, "#94A3B8"))
b.append(btn(860, 445, "Đăng nhập", "cam", 390, 56, 18))
b.append(t(1055, 545, "Quên mật khẩu? Liên hệ quản trị để được cấp lại.", 14, 500, "#64748B", "middle"))
b.append(t(1055, 580, "← Trang đăng nhập học sinh", 14, 600, XANH, "middle"))
save("gv-dang-nhap", b, "Giáo viên – Trang đăng nhập riêng /giao-vien")

# ---------- 10. Quản trị: Giáo viên ----------
GV_MENU_QT = ["Tổng quan", "Quản lý lớp", "Bài tập", "Học sinh", "Báo cáo", "Chương trình học", "Giáo viên", "Cài đặt"]
b = chrome("Giáo viên", GV_MENU_QT, lop=None)
b.append(rect(57, 154, 80, 18, 9, CAM, "none") + t(97, 167, "QUẢN TRỊ", 10, 800, "#fff", "middle"))
b.append(t(225, 110, "Giáo viên", 32, 800, TIEU)); b.append(t(225, 138, "Quản trị toàn quyền · Giáo viên chỉ thấy lớp được gán · Đăng nhập ở trang /giao-vien", 14, 500, "#64748B"))
b.append(btn(1170, 88, "+ Thêm giáo viên", "cam", 200, 44))
b.append(card(225, 160, 1150, 400))
b.extend(tbl_header(245, 178, [(20, "HỌ TÊN"), (230, "EMAIL ĐĂNG NHẬP"), (520, "VAI TRÒ"), (650, "LỚP PHỤ TRÁCH"), (880, "TRẠNG THÁI"), (1010, "")], 1110))
rows = [("Trương Công Thuận (bạn)", "truongdavid19999@gmail.com", ("Quản trị", "cam"), ["Tất cả lớp"], ("Đang dạy", "xanh")),
        ("Nguyễn Thị Lan", "co.lan@gmail.com", ("Giáo viên", "xd"), ["6A1", "6A2"], ("Đang dạy", "xanh")),
        ("Lê Minh Quân", "thay.quan@gmail.com", ("Giáo viên", "xd"), ["7A1"], ("Chờ đổi mật khẩu", "cam")),
        ("Phạm Hồng Nhung", "nhung.ph@gmail.com", ("Giáo viên", "xd"), [], ("Đã khóa", "do"))]
y = 235
for n, em, vt, lops_, st in rows:
    b.append(t(265, y + 24, n, 15, 700, "#1E293B")); b.append(t(475, y + 24, em, 13, 500, "#475569", extra='font-family="Consolas, monospace"'))
    p, _ = pill(765, y + 23, vt[0], vt[1]); b.append(p)
    xx = 895
    if not lops_: b.append(t(xx, y + 24, "Chưa gán lớp", 13, 600, "#B91C1C"))
    for l in lops_:
        p, w = pill(xx, y + 23, l, "xam"); b.append(p); xx += w + 6
    p, _ = pill(1125, y + 23, st[0], st[1]); b.append(p)
    b.append(t(1335, y + 24, "✎  🏫  🔑  🔒", 15, 500, "#64748B", "end"))
    y += 74
b.append(rect(560, 400, 540, 340, 24, "#fff", "#CBD5E1", 'filter="url(#sh)"'))
b.append(t(590, 440, "Thêm giáo viên", 22, 800, TIEU))
for i, (lb, ph) in enumerate([("Email", "co.lan@gmail.com"), ("Họ tên", "Nguyễn Thị Lan")]):
    xx = 590 + i * 250
    b.append(t(xx, 475, lb, 13, 600, "#334155") + rect(xx, 485, 230, 40, 12, "#F8FAFF", "#CBD5E1") + t(xx + 12, 511, ph, 14, 500, "#94A3B8"))
b.append(t(590, 555, "Vai trò", 13, 600, "#334155") + rect(590, 565, 480, 40, 12, "#F8FAFF", "#CBD5E1") + t(602, 591, "Giáo viên — chỉ lớp được gán  ▾", 14, 500, "#1E293B"))
b.append(t(590, 630, "Lớp phụ trách", 13, 600, "#334155"))
xx = 590
for l, on in [("6A1", True), ("6A2", True), ("7A1", False), ("8A1", False)]:
    b.append(rect(xx, 640, 70, 32, 16, "#EEF4FF" if on else "#fff", XANH if on else "#CBD5E1") + t(xx + 35, 661, ("☑ " if on else "☐ ") + l, 13, 600, XANH if on else "#64748B", "middle")); xx += 80
b.append(btn(900, 690, "Tạo tài khoản", "cam", 170, 40))
save("qt-giao-vien", b, "Quản trị – Quản lý giáo viên")

# ---------- 11. HS Làm bài: code trái, kết quả phải (kiểu W3Schools) ----------
b = chrome("Bài tập", HS_MENU, user="Minh An", lop="Lớp 6A1")
b.append(t(225, 105, "Bài tập 7.1: Tính tổng các số từ 1 đến n", 26, 800, TIEU))
b.append(card(225, 125, 1150, 620))
b.append(t(250, 165, "Soạn thảo code", 15, 700, XANH) + f'<line x1="245" y1="175" x2="375" y2="175" stroke="{XANH}" stroke-width="3"/>' + t(400, 165, "Upload file", 15, 500, "#64748B"))
b.append(rect(245, 190, 545, 500, 16, "#111827", "none"))
code_ = ['n = int(input("Nhập n: "))', "tong = 0", "for i in range(1, n + 1):", "    tong = tong + i", 'print("Tổng là:", tong)']
for i, l in enumerate(code_):
    b.append(t(262, 225 + i * 26, str(i + 1), 14, 500, "#64748B", extra='font-family="Consolas, monospace"'))
    b.append(t(295, 225 + i * 26, l, 15, 500, "#E5E7EB", extra='font-family="Consolas, monospace" xml:space="preserve"'))
b.append(rect(810, 190, 545, 500, 16, "#0B1220", "none"))
b.append(rect(810, 190, 545, 44, 16, "#0F172A", "none"))
b.append(rect(822, 198, 90, 28, 14, "#16A34A", "none") + t(867, 217, "▶ Chạy", 14, 700, "#fff", "middle"))
b.append(rect(922, 198, 130, 28, 14, "#334155", "none") + t(987, 217, "⌨ Dữ liệu vào", 13, 600, "#fff", "middle"))
b.append(t(1340, 217, "Chạy xong trong 0.03 giây", 12, 500, "#94A3B8", "end"))
b.append(rect(822, 244, 521, 64, 10, "#111827", "#334155") + t(834, 266, "5", 14, 500, "#E5E7EB", extra='font-family="Consolas, monospace"'))
b.append(t(834, 298, "Mỗi dòng là một lần input()", 11, 500, "#64748B"))
for i, (l, c) in enumerate([("Nhập n: ", "#E5E7EB"), ("5", "#FCD34D"), ("Tổng là: 15", "#E5E7EB")]):
    pass
b.append(t(830, 345, "Nhập n: ", 15, 500, "#E5E7EB", extra='font-family="Consolas, monospace" xml:space="preserve"') + t(900, 345, "5", 15, 600, "#FCD34D", extra='font-family="Consolas, monospace"'))
b.append(t(830, 371, "Tổng là: 15", 15, 500, "#E5E7EB", extra='font-family="Consolas, monospace"'))
b.append(rect(822, 520, 521, 150, 10, "#2A0F14", "#7F1D1D"))
b.append(t(836, 548, "Ví dụ khi có lỗi:", 12, 600, "#FCA5A5"))
b.append(t(836, 574, 'Bài làm, line 4', 13, 500, "#FCA5A5", extra='font-family="Consolas, monospace"'))
b.append(t(836, 598, "IndentationError: expected an indented block", 13, 500, "#FCA5A5", extra='font-family="Consolas, monospace"'))
b.append(t(836, 630, "💡 Xem dòng 4. Lỗi thụt lề: các dòng trong cùng một khối", 13, 500, "#FDE68A"))
b.append(t(836, 650, "phải thụt vào bằng nhau, thường là 4 dấu cách.", 13, 500, "#FDE68A"))
b.append(t(245, 715, "Đã lưu nháp lúc 20:15 · Chạy thử chỉ để em kiểm tra, không phải nộp bài.", 13, 500, "#64748B"))
b.append(btn(1175, 700, "Nộp bài", "cam", 180, 40))
save("hs-lam-bai-chay-thu", b, "Học sinh – Làm bài: code bên trái, kết quả bên phải")
print("ok2")
