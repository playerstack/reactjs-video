import React from 'react';
import { parseVTTCaptions, DEFAULT_CAPTION_STYLE, getCookie, setCookie } from '@playerstack/web-core';

const CAPTION_STYLE_COOKIE = 'caption_style';

/**
 * Hook that manages caption state: fetches VTT, parses cues, manages style preferences.
 */
const useCaptions = ({ captions, activeCaption }) => {
  const [cues, setCues] = React.useState([]);
  const [captionStyle, setCaptionStyle] = React.useState(() => {
    // Restore from cookie if available
    const saved = getCookie(CAPTION_STYLE_COOKIE);
    if (saved) {
      try {
        return { ...DEFAULT_CAPTION_STYLE, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_CAPTION_STYLE;
      }
    }
    return DEFAULT_CAPTION_STYLE;
  });

  // Fetch and parse active caption VTT
  React.useEffect(() => {
    if (!activeCaption || !captions || captions.length === 0) {
      setCues([]);
      return;
    }

    const track = captions.find((c) => c.language === activeCaption);
    if (!track) {
      setCues([]);
      return;
    }

    // Guard environments without `fetch` (SSR / test env): skip loading rather than throwing.
    if (typeof fetch !== 'function') {
      setCues([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(track.src);
        const text = await response.text();
        if (cancelled) return;
        const parsed = parseVTTCaptions(text);
        setCues(parsed);
      } catch (error) {
        console.error('Failed to load caption file:', error);
        if (!cancelled) setCues([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCaption, captions]);

  // Persist style changes to cookie
  const updateCaptionStyle = React.useCallback((newStyle) => {
    setCaptionStyle(newStyle);
    setCookie(CAPTION_STYLE_COOKIE, JSON.stringify(newStyle), 365);
  }, []);

  return {
    cues,
    captionStyle,
    updateCaptionStyle,
  };
};

export default useCaptions;
