/**
 * Extract an 11-character YouTube video ID from various standard YouTube URL formats.
 * Handles:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&t=10s&feature=shared
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Direct 11-char ID
 */
function extractYouTubeId(url) {
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

function isValidYouTubeUrl(url) {
  return !!extractYouTubeId(url);
}

module.exports = {
  extractYouTubeId,
  isValidYouTubeUrl
};
