// In DVR mode the time-slider represents the seekable WINDOW (0..sliderDuration) with the
// position inside it, NOT the absolute media time — parity with the original MobileProgressBar,
// which was bound to `sliderPosition`/`sliderDuration`. So when a usable DVR window exists,
// feed the store the window position/duration (and mark it fully loaded); otherwise use the
// normal absolute time/duration/buffered.
//
// When liveDVR is requested but the DVR window hasn't materialized yet (dvrActive=false because
// the media hasn't reported readyState>=2 / seekable yet), the slider would show 0/0 — a blank
// bar despite being "Live at-edge". In that case, feed a synthetic 1/1 so the bar shows full
// (at-edge) until the real DVR window arrives.
export const computeBridgeState = ({
  dvrActive,
  effectiveDVRPosition,
  currentTime,
  sliderDuration,
  duration,
  bufferedRanges,
  liveDVR,
}) => {
  if (dvrActive) {
    return {
      currentTime: effectiveDVRPosition,
      duration: sliderDuration,
      loaded: sliderDuration,
      bufferedRanges,
    };
  }
  // LiveDVR requested but DVR window not yet materialized (readyState < 2 or seekable empty):
  // show the bar at 100% (at-edge) as a placeholder until the real DVR state arrives. Without
  // this the bar sits at 0% while the LIVE badge already shows at-edge — confusing the user.
  if (liveDVR && !dvrActive) {
    return {
      currentTime: 1,
      duration: 1,
      loaded: 1,
      bufferedRanges: [],
    };
  }
  return {
    currentTime,
    duration,
    loaded: bufferedRanges.length > 0 ? bufferedRanges[bufferedRanges.length - 1].end : 0,
    bufferedRanges,
  };
};
