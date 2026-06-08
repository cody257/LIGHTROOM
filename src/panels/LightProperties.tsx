import { useRig } from '../store/rigStore';
import type { Modifier } from '../domain/types';

const pill: React.CSSProperties = { display: 'block', margin: '8px 0', fontSize: 13 };

const MODIFIERS: { value: Modifier; label: string }[] = [
  { value: 'octa', label: 'Octabox' },
  { value: 'softbox', label: 'Softbox' },
  { value: 'strip', label: 'Strip box' },
  { value: 'umbrellaWhite', label: 'Umbrella (shoot-through)' },
  { value: 'umbrellaSilver', label: 'Umbrella (silver)' },
  { value: 'beautyDish', label: 'Beauty dish' },
  { value: 'parabolic', label: 'Parabolic' },
  { value: 'fresnel', label: 'Fresnel' },
  { value: 'bare', label: 'Bare reflector' },
  { value: 'snoot', label: 'Snoot' },
];

export function LightProperties() {
  const rig = useRig((s) => s.rig);
  const selectedId = useRig((s) => s.selectedLightId);
  const updateLight = useRig((s) => s.updateLight);
  const setExposure = useRig((s) => s.setExposure);
  const light = rig.lights.find((l) => l.id === selectedId) ?? rig.lights[0];

  return (
    <div style={{ width: 240 }}>
      <label style={pill}>
        Exposure: {rig.camera.exposure.toFixed(1)} EV
        <input type="range" min={-4} max={4} step={0.1} value={rig.camera.exposure}
               onChange={(e) => setExposure(parseFloat(e.target.value))} style={{ width: '100%' }} />
      </label>
      {light && (
        <>
          <div style={{ fontWeight: 600, margin: '12px 0 4px' }}>Selected light</div>
          <label style={pill}>
            Modifier
            <select value={light.modifier}
                    onChange={(e) => updateLight(light.id, { modifier: e.target.value as Modifier })}
                    style={{ width: '100%' }}>
              {MODIFIERS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          <label style={pill}>
            Modifier size: {light.modifierSizeCm} cm
            <input type="range" min={20} max={200} step={5} value={light.modifierSizeCm}
                   onChange={(e) => updateLight(light.id, { modifierSizeCm: parseInt(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
          <label style={pill}>
            Feather: {Math.round((light.feather ?? 0) * 100)}%
            <input type="range" min={0} max={1} step={0.05} value={light.feather ?? 0}
                   onChange={(e) => updateLight(light.id, { feather: parseFloat(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
          <label style={{ ...pill, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={light.grid ?? false}
                   onChange={(e) => updateLight(light.id, { grid: e.target.checked })} />
            Grid (restrict spill)
          </label>
          <label style={pill}>
            Height: {light.heightM.toFixed(2)} m
            <input type="range" min={0.2} max={3} step={0.05} value={light.heightM}
                   onChange={(e) => updateLight(light.id, { heightM: parseFloat(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
          <label style={pill}>
            Tilt: {light.tiltDeg.toFixed(0)}°
            <input type="range" min={-60} max={60} step={1} value={light.tiltDeg}
                   onChange={(e) => updateLight(light.id, { tiltDeg: parseInt(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
          <label style={pill}>
            Power: {light.power.toFixed(2)}
            <input type="range" min={0} max={3} step={0.05} value={light.power}
                   onChange={(e) => updateLight(light.id, { power: parseFloat(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
          <label style={pill}>
            Colour: {light.kelvin} K
            <input type="range" min={2000} max={9000} step={100} value={light.kelvin}
                   onChange={(e) => updateLight(light.id, { kelvin: parseInt(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
        </>
      )}
    </div>
  );
}
