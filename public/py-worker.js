/* =====================================================================
 * py-worker.js — CHẠY CODE PYTHON NGAY TRÊN TRÌNH DUYỆT (Pyodide)
 * Chạy trong Web Worker (luồng riêng) để:
 *   - Code của học sinh KHÔNG chạy trên server (an toàn, đúng quy tắc dự án)
 *   - Vòng lặp vô hạn không làm treo trang: trang chính sẽ dừng worker sau N giây
 * Tin nhắn nhận:  { type: "chay", code, input, indexURL }
 * Tin nhắn gửi:   bat_dau | out | err | nhap | xong | loi | loi_tai
 * ===================================================================== */
/* global importScripts, loadPyodide */
let pyodide = null;
let dangTai = null;
const dec = new TextDecoder();
const GIOI_HAN = 200000; // ký tự kết quả tối đa mỗi lần chạy
let daGhi = 0;

function khoiDong(indexURL) {
  if (pyodide) return Promise.resolve(pyodide);
  if (!dangTai) {
    dangTai = (async () => {
      importScripts(indexURL + "pyodide.js");
      const py = await loadPyodide({ indexURL });
      pyodide = py;
      return py;
    })();
  }
  return dangTai;
}

function boGhi(kieu) {
  return {
    isatty: true, // in theo từng dòng (giống màn hình console)
    write(buf) {
      if (daGhi < GIOI_HAN) {
        let t = dec.decode(buf);
        daGhi += t.length;
        if (daGhi >= GIOI_HAN) t += "\n… (kết quả quá dài, đã cắt bớt)\n";
        postMessage({ type: kieu, text: t });
      }
      return buf.length;
    },
  };
}

/** Bỏ các dòng nội bộ của Pyodide trong thông báo lỗi, chỉ giữ phần liên quan bài làm */
function rutGonLoi(msg) {
  const dong = String(msg).split("\n");
  const i = dong.findIndex((d) => d.includes('File "<exec>"'));
  const giu = i >= 0 ? [dong[0], ...dong.slice(i)] : dong.filter((d) => !d.includes("/lib/python") && !d.includes("_pyodide"));
  return giu.join("\n").replace(/File "<exec>"/g, 'Bài làm').trim();
}

self.onmessage = async (e) => {
  const m = e.data || {};
  if (m.type !== "chay") return;
  let py;
  try {
    py = await khoiDong(m.indexURL);
  } catch (err) {
    postMessage({ type: "loi_tai", text: String(err && err.message ? err.message : err) });
    return;
  }
  // Dữ liệu vào: mỗi dòng của ô "Dữ liệu vào" là một lần input()
  const dong = String(m.input || "").replace(/\r/g, "").split("\n");
  if (dong.length && dong[dong.length - 1] === "") dong.pop();
  let i = 0;
  daGhi = 0;
  py.setStdout(boGhi("out"));
  py.setStderr(boGhi("err"));
  py.setStdin({
    isatty: false,
    stdin() {
      if (i < dong.length) {
        const s = dong[i++];
        postMessage({ type: "nhap", text: s + "\n" }); // hiện giá trị đã nhập như trên console
        return s + "\n";
      }
      return undefined; // hết dữ liệu → EOFError
    },
  });

  postMessage({ type: "bat_dau" });
  const t0 = performance.now();
  const g = py.globals.get("dict")(); // mỗi lần chạy một "bộ nhớ" mới, không lẫn biến lần trước
  try {
    try { await py.loadPackagesFromImports(m.code); } catch (_) { /* thư viện không có: lỗi sẽ báo khi import */ }
    await py.runPythonAsync(m.code, { globals: g });
    try { py.runPython("import sys\nsys.stdout.flush()\nsys.stderr.flush()"); } catch (_) {}
    postMessage({ type: "xong", ms: Math.round(performance.now() - t0) });
  } catch (err) {
    try { py.runPython("import sys\nsys.stdout.flush()\nsys.stderr.flush()"); } catch (_) {}
    postMessage({ type: "loi", text: rutGonLoi(err && err.message ? err.message : err), ms: Math.round(performance.now() - t0) });
  } finally {
    try { g.destroy(); } catch (_) {}
  }
};
