import { useState } from 'react';
import { PlanView } from './diagram/PlanView';
import { ElevationView } from './diagram/ElevationView';
import { LightProperties } from './panels/LightProperties';
import { useRig } from './store/rigStore';
import { RasterCaptureRenderer } from './render/rasterCaptureRenderer';
import { GENERIC_HEAD, isAllowedSubjectFile } from './subject/subjectSource';

const renderer = new RasterCaptureRenderer();

export function App() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const subjectModel = useRig((s) => s.rig.subject.model);
  const setSubjectModel = useRig((s) => s.setSubjectModel);

  async function capture() {
    setBusy(true);
    try {
      const url = await renderer.render(useRig.getState().rig);
      setPhoto(url);
    } finally {
      setBusy(false);
    }
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

  const customSubject = subjectModel !== GENERIC_HEAD;

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start' }}>
      <div>
        <h2 style={{ marginTop: 0 }}>LIGHT ROOM</h2>
        <div style={{ fontSize: 11, color: '#9aa0a6', margin: '0 0 4px' }}>Plan (top-down)</div>
        <PlanView />
        <div style={{ fontSize: 11, color: '#9aa0a6', margin: '12px 0 4px' }}>Elevation (side)</div>
        <ElevationView />
        <button onClick={capture} disabled={busy}
                style={{ marginTop: 12, padding: '10px 18px', fontSize: 15, cursor: 'pointer' }}>
          {busy ? 'Rendering…' : '📷 Capture'}
        </button>
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
      <div style={{ width: 384, minHeight: 512, background: '#15171b', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo
          ? <img src={photo} alt="capture" style={{ maxWidth: '100%', borderRadius: 8 }} />
          : <span style={{ color: '#6b7280' }}>Press Capture to shoot</span>}
      </div>
    </div>
  );
}
