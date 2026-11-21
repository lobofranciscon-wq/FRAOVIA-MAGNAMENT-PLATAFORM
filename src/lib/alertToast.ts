/**
 * Reemplaza window.alert por un aviso visible dentro de la propia página.
 * Motivo: en vistas previas incrustadas (iframe sin permiso de ventanas modales)
 * el alert() nativo se bloquea en silencio y el usuario nunca ve el error.
 */
export function installAlertToast(): void {
  if (typeof window === 'undefined') return;

  window.alert = (message?: any) => {
    try {
      const text = String(message ?? '');
      let host = document.getElementById('fraovia-toast-host');
      if (!host) {
        host = document.createElement('div');
        host.id = 'fraovia-toast-host';
        host.style.cssText =
          'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
          'display:flex;flex-direction:column;gap:8px;max-width:min(92vw,520px);width:100%;pointer-events:none;';
        document.body.appendChild(host);
      }

      const isError = /error|no se pudo|fall|inválid|invalid|obligatori|ya existe|permiso|FRAOVIA:/i.test(text);
      const toast = document.createElement('div');
      toast.setAttribute('role', 'alert');
      toast.style.cssText =
        'pointer-events:auto;cursor:pointer;padding:12px 16px;border-radius:14px;font:600 13px/1.4 system-ui,sans-serif;' +
        'box-shadow:0 10px 30px rgba(0,0,0,.45);white-space:pre-wrap;word-break:break-word;color:#fff;' +
        (isError
          ? 'background:#9f1239;border:1px solid #fb7185;'
          : 'background:#065f46;border:1px solid #34d399;');
      toast.textContent = text;
      const remove = () => toast.parentNode && toast.parentNode.removeChild(toast);
      toast.addEventListener('click', remove);
      host.appendChild(toast);
      window.setTimeout(remove, 12000);
    } catch {
      // Si algo falla, al menos queda en consola
    }
    console.warn('[FRAOVIA aviso]', message);
  };
}
