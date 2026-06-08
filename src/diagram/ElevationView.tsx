import { useRef } from 'react';
import { useRig } from '../store/rigStore';
import { elevationToXY, xyToElevation } from '../domain/elevation';
import { SUBJECT_HEAD_Y } from '../domain/lightProps';

const WIDTH = 320;
const HEIGHT = 240;
const SCALE = 60; // px per metre
const ORIGIN = { x: 44, y: HEIGHT - 26 };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function ElevationView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const rig = useRig((s) => s.rig);
  const selectedId = useRig((s) => s.selectedLightId);
  const updateLight = useRig((s) => s.updateLight);
  const selectLight = useRig((s) => s.selectLight);

  function onPointerMove(id: string, e: React.PointerEvent) {
    if (e.buttons !== 1 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const { distanceM, heightM } = xyToElevation(p, SCALE, ORIGIN);
    updateLight(id, { distanceM: clamp(distanceM, 0.4, 3.5), heightM: clamp(heightM, 0.2, 3) });
  }

  const head = elevationToXY(0, SUBJECT_HEAD_Y, SCALE, ORIGIN);
  const floorRight = ORIGIN.x + 3.7 * SCALE;

  return (
    <svg ref={svgRef} width={WIDTH} height={HEIGHT}
         style={{ background: '#3c3e42', borderRadius: 8, touchAction: 'none', display: 'block' }}>
      <line x1={ORIGIN.x} y1={ORIGIN.y} x2={floorRight} y2={ORIGIN.y} stroke="#6b6e73" strokeWidth={2} />
      <text x={floorRight} y={ORIGIN.y + 16} fill="#9aa0a6" fontSize={10} textAnchor="end">floor</text>
      <line x1={ORIGIN.x} y1={ORIGIN.y} x2={head.x} y2={head.y} stroke="#3a7bd5" strokeWidth={3} />
      <circle cx={head.x} cy={head.y} r={12} fill="#3a7bd5" stroke="#e8923a" strokeWidth={3} />
      <text x={head.x + 4} y={head.y - 16} fill="#f0c36a" fontSize={11} textAnchor="start">Talent</text>
      {rig.lights.map((l) => {
        const pos = elevationToXY(l.distanceM, l.heightM, SCALE, ORIGIN);
        const aimY = SUBJECT_HEAD_Y + Math.tan((l.tiltDeg * Math.PI) / 180) * l.distanceM;
        const aim = elevationToXY(0, aimY, SCALE, ORIGIN);
        const selected = l.id === selectedId;
        return (
          <g key={l.id}
             onPointerDown={() => selectLight(l.id)}
             onPointerMove={(e) => onPointerMove(l.id, e)}
             style={{ cursor: 'grab' }}>
            <line x1={pos.x} y1={pos.y} x2={aim.x} y2={aim.y}
                  stroke="#ffffff" strokeOpacity={0.25} strokeDasharray="3 3" />
            <circle cx={pos.x} cy={pos.y} r={13}
                    fill={selected ? '#ffd36b' : '#ddd'} stroke="#222" strokeWidth={selected ? 3 : 1} />
            <text x={pos.x} y={pos.y - 18} fill="#fff" fontSize={11} textAnchor="middle">
              {l.heightM.toFixed(1)}m
            </text>
          </g>
        );
      })}
    </svg>
  );
}
