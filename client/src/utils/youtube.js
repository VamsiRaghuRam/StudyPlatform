/**
 * Extract an 11-character YouTube video ID from various standard YouTube URL formats.
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If already 11-char alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export function isValidYouTubeUrl(url) {
  return !!extractYouTubeId(url);
}

/**
 * Format raw seconds to MM:SS or HH:MM:SS format
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const total = Math.round(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Guaranteed singleton loader for YouTube IFrame API
 */
let ytApiPromise = null;

export function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not defined'));

  // Already loaded
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }

  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise((resolve, reject) => {
    // Check if script tag exists
    let tag = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!tag) {
      tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Interval poll for window.YT.Player in case onYouTubeIframeAPIReady already triggered or overwritten
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        resolve(window.YT);
      }
    }, 50);

    // Also register onYouTubeIframeAPIReady callback
    const prevHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevHandler === 'function') prevHandler();
      clearInterval(checkInterval);
      resolve(window.YT);
    };

    // Timeout safety (12 seconds)
    setTimeout(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        resolve(window.YT);
      } else {
        clearInterval(checkInterval);
        reject(new Error('YouTube IFrame API script failed to load. Please check your internet connection.'));
      }
    }, 12000);
  });

  return ytApiPromise;
}
