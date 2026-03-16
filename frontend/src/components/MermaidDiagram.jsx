import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

export default function MermaidDiagram({ content }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!content || !ref.current) return;
    const render = async () => {
      try {
        const safe = content.replace(
          /\[([^\]]*)\]/g,
          (_, inner) => '[' + inner.replace(/\(/g, ' ').replace(/\)/g, ' ') + ']'
        );
        const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), safe);
        ref.current.innerHTML = svg;
      } catch {
        ref.current.innerHTML = `<pre style="font-size:0.78rem;color:#3a3a3c;white-space:pre-wrap;padding:8px">${content}</pre>`;
      }
    };
    render();
  }, [content]);

  return <div className="mermaid-diagram" ref={ref} />;
}
