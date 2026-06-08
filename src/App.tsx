import { useRef, useState } from 'react';
import { PlanView } from './diagram/PlanView';
import { ElevationView } from './diagram/ElevationView';
import { LightProperties } from './panels/LightProperties';
import { useRig } from './store/rigStore';
import { createCaptureRenderer } from './render/createCaptureRenderer';
import { PRESETS } from './presets/presets';
import { GENERIC_HEAD, isAllowedSubjectFile } from './subject/subjectSource';

const renderer = createCaptureRenderer();

interface Capture { id: string; url: string; }

export function App() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const seq = useRef(0);
  const setLights = useRig((s) => s.setLights);
  const resetRig = useRig((s) => s.resetRig);
  const subjectModel = useRig((s) => s.rig.subject.model);
  const setSubjectModel = useRig((s) => s.setSubjectModel);

  async function capture() {
    setBusy(true);
    try {
      const url = await renderer.render(useRig.getState().rig);
      const id = `cap-${seq.current++}`;
      setCaptures((c) => [{ id, url }, ...c].slice(0, 12));
      setSelected([id]);
    } finally {
      setBusy(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((sel) => (sel.includes(id) ? sel.filter((s) => s !== id) : [...sel, id].slice(-2)));
  }

  function onUploadSubject(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedSubjectFile(file)) {
      setSubjectError('Use a .glb or .gltf file under 50 MB');
      return;
    }
    setSubjectError(null);
    setSubjectModel(URL.createObjectURL(file));
  }

  const chosen = captures.filter((c) => selected.includes(c.id));
  const compare = chosen.length === 2;
  const customSubject = subjectModel !== GENERIC_HEAD;

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start' }}>
      <div>
        <h2 style={{ marginTop: 0 }}>LIGHT ROOM</h2>
        <div style={{ fontSize: 11, color: '#9aa0a6', margin: '0 0 4px' }}>Plan (top-down)</div>
        <PlanView />
        <div style={{ fontSize: 11, color: '#9aa0a6', margin: '12px 0 4px' }}>Elevation (side)</div>
        <ElevationView />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={capture} disabled={busy}
                  style={{ padding: '10px 18px', fontSize: 15, cursor: 'pointer' }}>
            {busy ? 'Rendering…' : '📷 Capture'}
          </button>
          <button onClick={resetRig} title="Restore the default lighting (keeps your subject)"
                  style={{ padding: '10px 18px', fontSize: 15, cursor: 'pointer' }}>
            ↺ Reset
          </button>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: '#9aa0a6', marginBottom: 4 }}>Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 320 }}>
            {PRESETS.map((p) => (
              <button key={p.name} title={p.description}
                      onClick={() => setLights(p.build())}
                      style={{ padding: '5px 9px', fontSize: 12, cursor: 'pointer' }}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14, maxWidth: 320 }}>
          <div style={{ fontSize: 12, color: '#9aa0a6', marginBottom: 4 }}>
            Subject: {customSubject ? 'your model' : 'generic head'}
          </div>
          <input type="file" accept=".glb,.gltf" onChange={onUploadSubject} style={{ fontSize: 12 }} />
          {customSubject && (
            <button onClick={() => { setSubjectModel(GENERIC_HEAD); setSubjectError(null); }}
                    style={{ marginLeft: 8, fontSize: 12, cursor: 'pointer' }}>
              Reset
            </button>
          )}
          {subjectError && <div style={{ color: '#e2725b', fontSize: 12, marginTop: 4 }}>{subjectError}</div>}
        </div>
      </div>

      <LightProperties />

      <div style={{ width: 384 }}>
        <div style={{ minHeight: 300, background: '#15171b', borderRadius: 8, padding: 8,
                      display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          {chosen.length === 0 && <span style={{ color: '#6b7280' }}>Press Capture to shoot</span>}
          {chosen.map((c) => (
            <img key={c.id} src={c.url} alt="capture"
                 style={{ maxWidth: compare ? '50%' : '100%', borderRadius: 6 }} />
          ))}
        </div>
        {captures.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: '#9aa0a6', margin: '12px 0 4px' }}>
              Gallery — click to view, click two to compare
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {captures.map((c) => (
                <img key={c.id} src={c.url} alt="thumbnail"
                     onClick={() => toggleSelect(c.id)}
                     style={{ width: 64, height: 85, objectFit: 'cover', borderRadius: 4, cursor: 'pointer',
                              outline: selected.includes(c.id) ? '2px solid #ffd36b' : '2px solid transparent' }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
