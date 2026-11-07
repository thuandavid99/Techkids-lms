"use client";
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

/** Ô soạn code Python: nền tối, số dòng, tô màu cú pháp (CodeMirror 6) + phím nhanh cho điện thoại */
export function CodeEditor({ value, onChange, readOnly = false, height = 420 }: {
  value: string; onChange?: (v: string) => void; readOnly?: boolean; height?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup, python(), oneDark, keymap.of([indentWithTab]),
          EditorState.readOnly.of(readOnly),
          EditorView.updateListener.of((u) => { if (u.docChanged) cb.current?.(u.state.doc.toString()); }),
          EditorView.theme({ "&": { backgroundColor: "#111827" }, ".cm-gutters": { backgroundColor: "#0b1220", border: "none" } }),
          EditorView.contentAttributes.of({ "aria-label": "Ô soạn code Python", autocapitalize: "off", autocorrect: "off", spellcheck: "false" }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // Chỉ tạo một lần; giá trị ban đầu lấy từ props lần đầu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chen = (s: string) => {
    const v = view.current;
    if (!v) return;
    v.dispatch(v.state.replaceSelection(s));
    v.focus();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-editor">
      {!readOnly && (
        <div className="flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-900 px-2 py-1.5 lg:hidden" aria-label="Phím nhanh">
          {[["⇥", "    "], [":", ":"], ["(", "("], [")", ")"], ['"', '"'], ["[", "["], ["]", "]"], ["=", "="], ["#", "#"]].map(([l, s]) => (
            <button key={l} type="button" onClick={() => chen(s)} className="min-w-9 rounded-md bg-slate-700 px-2 py-1 font-mono text-sm text-white">{l}</button>
          ))}
        </div>
      )}
      <div ref={host} style={{ height }} />
    </div>
  );
}
