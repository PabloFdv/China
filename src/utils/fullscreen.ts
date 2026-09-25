/**
 * Safe cross-browser Fullscreen API helper.
 * Supports standard Fullscreen API, WebKit (Safari, iOS iPad/Mac), Mozilla, and IE prefixes.
 * Gracefully handles devices without Fullscreen API support (such as iPhone Safari) without throwing errors.
 */

export const isFullscreenAvailable = (): boolean => {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  const docEl = document.documentElement as any;

  return Boolean(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.webkitIsFullScreen !== undefined ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled ||
    (typeof docEl.requestFullscreen === 'function') ||
    (typeof docEl.webkitRequestFullscreen === 'function') ||
    (typeof docEl.webkitRequestFullScreen === 'function') ||
    (typeof docEl.mozRequestFullScreen === 'function') ||
    (typeof docEl.msRequestFullscreen === 'function')
  );
};

export const isFullscreenActive = (): boolean => {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.webkitCurrentFullScreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
};

export const toggleFullscreen = async (): Promise<boolean> => {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  const docEl = document.documentElement as any;

  try {
    if (!isFullscreenActive()) {
      if (typeof docEl.requestFullscreen === 'function') {
        await docEl.requestFullscreen();
        return true;
      } else if (typeof docEl.webkitRequestFullscreen === 'function') {
        docEl.webkitRequestFullscreen();
        return true;
      } else if (typeof docEl.webkitRequestFullScreen === 'function') {
        docEl.webkitRequestFullScreen();
        return true;
      } else if (typeof docEl.mozRequestFullScreen === 'function') {
        docEl.mozRequestFullScreen();
        return true;
      } else if (typeof docEl.msRequestFullscreen === 'function') {
        docEl.msRequestFullscreen();
        return true;
      } else {
        // Fullscreen API is not supported on this device/browser (e.g. iPhone Safari)
        return false;
      }
    } else {
      if (typeof doc.exitFullscreen === 'function') {
        await doc.exitFullscreen();
        return false;
      } else if (typeof doc.webkitExitFullscreen === 'function') {
        doc.webkitExitFullscreen();
        return false;
      } else if (typeof doc.webkitCancelFullScreen === 'function') {
        doc.webkitCancelFullScreen();
        return false;
      } else if (typeof doc.mozCancelFullScreen === 'function') {
        doc.mozCancelFullScreen();
        return false;
      } else if (typeof doc.msExitFullscreen === 'function') {
        doc.msExitFullscreen();
        return false;
      }
      return false;
    }
  } catch (err) {
    // Gracefully catch user rejections or browser policy restrictions
    return false;
  }
};
