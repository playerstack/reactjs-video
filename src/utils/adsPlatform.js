/**
 * Web platform adapter for ads — provides media session blocking and URL opening.
 * Passed as the `platform` param to the core useAds hook.
 */
export const webAdsPlatform = {
  /**
   * Block native media session seek controls during ads.
   * Returns a cleanup function that restores the original handlers.
   */
  blockMediaSession: () => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) {
      return () => {};
    }

    const block = () => {};
    navigator.mediaSession.setActionHandler('seekbackward', block);
    navigator.mediaSession.setActionHandler('seekforward', block);
    navigator.mediaSession.setActionHandler('seekto', block);
    navigator.mediaSession.setActionHandler('previoustrack', block);
    navigator.mediaSession.setActionHandler('nexttrack', block);

    return () => {
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  },

  /**
   * Open a URL in a new browser tab.
   */
  openUrl: (url) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },
};
