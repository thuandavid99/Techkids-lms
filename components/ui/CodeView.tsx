/**
 * Hiển thị code của học sinh dạng VĂN BẢN THUẦN (React tự escape ký tự HTML),
 * nền tối, có số dòng. Không chạy code.
 */
export function CodeView({ code, minH = 360 }: { code: string | null | undefined; minH?: number }) {
  const lines = (code ?? "").replace(/\r\n/g, "\n").split("\n");
  return (
    <div className="overflow-auto rounded-2xl bg-editor text-[15px] leading-7 text-slate-100" style={{ minHeight: minH, maxHeight: 640 }}>
      <table className="w-full border-collapse font-mono">
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td className="w-12 select-none bg-slate-900/60 pr-3 text-right align-top text-slate-500">{i + 1}</td>
              <td className="whitespace-pre pl-4 pr-4 align-top">{l || " "}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
