import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  fontFamily: 'DM Sans, Inter, sans-serif',
  themeVariables: {
    primaryColor: '#ece9ff',
    primaryBorderColor: '#7565e8',
    primaryTextColor: '#202124',
    lineColor: '#9a8ef0',
    secondaryColor: '#fbe7cb',
    tertiaryColor: '#f4f3f1',
    fontSize: '13px',
  },
  er: { useMaxWidth: true },
});

/** Renders Mermaid diagrams; falls back to the raw source (as text, never HTML) if parsing fails. */
export default function MermaidDiagram({ content }) {
  const ref = useRef(null);
  const reactId = useId();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!content || !ref.current) return;
    let cancelled = false;
    const safe = content.replace(/\[([^\]]*)\]/g, (_, inner) => '[' + inner.replace(/[()]/g, ' ') + ']');
    const id = 'mmd-' + reactId.replace(/[^a-zA-Z0-9]/g, '') + '-' + Date.now();
    mermaid.render(id, safe)
      .then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setFailed(false);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [content, reactId]);

  return (
    <div className="ag-mermaid">
      <div ref={ref} className="ag-mermaid-svg" hidden={failed} />
      {failed && <pre className="ag-mermaid-src">{content}</pre>}
    </div>
  );
}
