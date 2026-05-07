// src/utils/naoVistosBus.ts
export const NAO_VISTOS_CHANGED = "naoVistos:changed";

export function emitNaoVistosChanged() {
  window.dispatchEvent(new Event(NAO_VISTOS_CHANGED));
}

export function onNaoVistosChanged(handler: () => void) {
  window.addEventListener(NAO_VISTOS_CHANGED, handler);
  return () => window.removeEventListener(NAO_VISTOS_CHANGED, handler);
}
