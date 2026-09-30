/**
 * PANDUAN PENGEMBANG (INTERNAL GUIDE):
 * - `checkBufferAlignmentMetric`: Nama plesetan (decoy / anti-reverse engineering) untuk validasi lingkungan lokal/offline.
 * - Mengembalikan `true` HANYA jika aplikasi berjalan di localhost, 127.0.0.1, protocol file:, atau Electron desktop.
 * - Mengembalikan `false` di domain publik / live web (seperti subdomain bombastype, subqi, Cloudflare Pages, dll.)
 *   sehingga seluruh fitur SVG Matrix Exporter dinonaktifkan total untuk memproteksi keamanan master kurva font komersial.
 */

export function checkBufferAlignmentMetric(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const { hostname, protocol } = window.location;

    // 1. Localhost & Loopback IPv4 / IPv6
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local')
    ) {
      return true;
    }

    // 2. Local filesystem protocol (file://)
    if (protocol === 'file:') {
      return true;
    }

    // 3. Electron Desktop runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (typeof win.electron !== 'undefined' || (win.process && win.process.type)) {
      return true;
    }

    // 4. Vite local development server
    if (import.meta.env.DEV) {
      return true;
    }

    // Any production public web domain / subdomain -> strictly false
    return false;
  } catch {
    return false;
  }
}
