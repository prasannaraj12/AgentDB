import { useRef } from 'react';
import { usePointerVars } from '../landing/motion';

/**
 * AgentDB Intelligence Core — a small CSS-3D brand object: a pearl-glass sphere with a
 * database-disc motif, a pulsing violet/cyan core, three tilted brushed-metal rings with
 * orbiting data particles, and a soft contact shadow. No 3D library; transforms only.
 * Decorative (aria-hidden). Pointer tilt is desktop-only and skipped for reduced motion.
 */
export default function IntelligenceCore() {
  const ref = useRef(null);
  usePointerVars(ref, { global: true, ease: 0.06 });

  return (
    <div className="ag-core" ref={ref} aria-hidden="true">
      <div className="ag-core-float">
        <div className="ag-core-tilt">
          <span className="ag-core-halo" />

          <div className="ag-core-ring ring-1"><i className="ag-core-dot d1" /><i className="ag-core-dot d2" /></div>
          <div className="ag-core-ring ring-2"><i className="ag-core-dot d3" /></div>

          <div className="ag-core-sphere">
            <span className="ag-core-energy" />
            <svg className="ag-core-discs" viewBox="0 0 60 60">
              <ellipse cx="30" cy="21" rx="14" ry="4.6" />
              <path d="M16 21v18c0 2.5 6.3 4.6 14 4.6s14-2.1 14-4.6V21" />
              <path d="M16 30c0 2.5 6.3 4.6 14 4.6s14-2.1 14-4.6" />
            </svg>
            <span className="ag-core-sheen" />
            <span className="ag-core-spec" />
          </div>

          <div className="ag-core-ring ring-3"><i className="ag-core-dot d4" /></div>
        </div>
      </div>
      <span className="ag-core-shadow" />
    </div>
  );
}
