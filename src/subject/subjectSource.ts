/** Subject model selection: a known key ('genericHead') or a model URL (e.g. an uploaded object URL). */

export const GENERIC_HEAD = 'genericHead';
export const GENERIC_HEAD_URL = '/models/LeePerrySmith.glb';
export const MAX_SUBJECT_BYTES = 50 * 1024 * 1024; // 50 MB

/** Resolve a stored subject model value to a loadable URL. */
export function resolveModelUrl(model: string): string {
  return model === GENERIC_HEAD || model === '' ? GENERIC_HEAD_URL : model;
}

/** Whether an uploaded file is an acceptable subject: a non-empty .glb/.gltf within the size cap. */
export function isAllowedSubjectFile(file: { name: string; size: number }): boolean {
  return /\.(glb|gltf)$/i.test(file.name) && file.size > 0 && file.size <= MAX_SUBJECT_BYTES;
}
