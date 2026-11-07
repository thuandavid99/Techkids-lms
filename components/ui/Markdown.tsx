import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Hiển thị Markdown AN TOÀN: react-markdown không chạy HTML thô (không dùng
 * dangerouslySetInnerHTML); link chỉ cho http/https/mailto.
 */
export function Markdown({ children }: { children: string | null | undefined }) {
  if (!children?.trim()) return null;
  return (
    <div className="prose-lms">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => (/^(https?:|mailto:|\/|#)/i.test(url) ? url : "")}
        components={{
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer nofollow">{children}</a>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
