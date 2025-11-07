export function connectWS(path: string): WebSocket {
  const base = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? window.location.origin.replace(/^http/, 'ws') : '');
  return new WebSocket(base + path);
}
