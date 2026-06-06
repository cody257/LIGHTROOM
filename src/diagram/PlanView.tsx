import { useRef } from 'react';
import { useRig } from '../store/rigStore';
import { polarToXY, xyToPolar } from '../domain/geometry';

const SIZE = 320;
const SCALE = 80; // px per metre
const CENTER = { x: SIZE / 2, y: SIZE / 2 };

export function PlanView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const rig = useRig((s) => s.rig);
  const selectedId = useRig((s) => s.selectedLightId);
  const updateLight = useRig((s) => s.updateLight);
  const selectLight = useRig((s) => s.selectLight);

  function onPointerMove(id: string, e: React.PointerEvent) {
    if (e.buttons !== 1 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const { angleDeg, distanceM } = xyToPolar(p, CENTER, SCALE);
    updateLight(id, { angleDeg, distanceM: Math.min(3.5, Math.max(0.4, distanceM)) });
  }

  const camera = polarToXY(0, 1.4, SCALE, CENTER);

  return (
    <svg
      ref={svgRef}
      width={SIZE}
      height={SIZE}
      style={{ background: '#54565a', borderRadius: 8, touchAction: 'none' }}
    >
      <circle cx={CENTER.x} cy={CENTER.y} r={14} fill="#3a7bd5" stroke="#e8923a" strokeWidth={3} />
      <text x={CENTER.x} y={CENTER.y - 20} fill="#f0c36a" fontSize={11} textAnchor="middle">Talent</text>
      <rect x={camera.x - 12} y={camera.y - 8} width={24} height={16} rx={3} fill="#2f3a45" />
      <text x={camera.x} y={camera.y + 24} fill="#c7ccd2" fontSize={10} textAnchor="middle">camera</text>
      {rig.lights.map((l) => {
        const pos = polarToXY(l.angleDeg, l.distanceM, SCALE, CENTER);
        const selected = l.id === selectedId;
        return (
          <g key={l.id}
             onPointerDown={() => selectLight(l.id)}
             onPointerMove={(e) => onPointerMove(l.id, e)}
             style={{ cursor: 'grab' }}>
            <line x1={pos.x} y1={pos.y} x2={CENTER.x} y2={CENTER.y}
                  stroke="#ffffff" strokeOpacity={0.25} strokeDasharray="3 3" />
            <circle cx={pos.x} cy={pos.y} r={13}
                    fill={selected ? '#ffd36b' : '#ddd'} stroke="#222" strokeWidth={selected ? 3 : 1} />
            <text x={pos.x} y={pos.y - 18} fill="#fff" fontSize={11} textAnchor="middle">
              {Math.round(l.angleDeg)}°
            </text>
          </g>
        );
      })}
    </svg>
  );
}
