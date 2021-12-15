let _startOffset;
const DEFAULT_PLAYER_POSITION = 10;
const DIFFERENCE_WITH_LONG_STREAM_TIME = 22;
const DIFFERENCE_WITH_SHORT_STREAM_TIME = 16;
const DISPLAY_OFFSET_THRESHOLD = 0.25;
const FIXED_OPTIMAL_LATENCY = 3;

const getManifestStreamTime = (isPlaying, streamUrl, player) => {
  if (!isPlaying) {
    return;
  }

  /* eslint-disable no-undef */
  fetch(streamUrl).then((response) => {
    if (!response.ok) {
      return;
    }

    response.text().then((data) => {
      const manifest = data.split('\n');
      const manifestMap = {};

      manifest.forEach((dataPair) => {
        const pair = dataPair.split(',');
        if (pair[0]) {
          manifestMap[pair[0]] = pair[1] ?? null;
        }
      });

      const value = manifestMap['#EXT-X-SESSION-DATA:DATA-ID="STREAM-TIME"']?.split('"')[1];

      if (!value) {
        return;
      }

      // The position varies if the stream just started or not. Depending on that the difference changes
      const difference = player.current.getPosition() > DEFAULT_PLAYER_POSITION ? DIFFERENCE_WITH_LONG_STREAM_TIME : DIFFERENCE_WITH_SHORT_STREAM_TIME;
      _startOffset = Number(value) - player.current.getPosition() - difference;
      console.info('Stream Time Updated -> ' + _startOffset);

      return _startOffset;
    });
  }).catch(function (error) {
    console.log("Couldn't get information about stream time. Error details: ", error);
  });
};

const displayDataIos = (data, player, displayCallback, removeDataFromQueueCallback) => {
  if (!_startOffset) {
    return;
  }

  const playerPosition = player.current.getPosition();
  const playerLiveLatency = FIXED_OPTIMAL_LATENCY;
  const timeCorrection = -(_startOffset + playerLiveLatency);
  const displayTime = data.feedTime + timeCorrection;

  if (displayTime >= playerPosition - DISPLAY_OFFSET_THRESHOLD && displayTime <= playerPosition + DISPLAY_OFFSET_THRESHOLD) {
    displayCallback(data.labels);
  } else if (displayTime < playerPosition - DISPLAY_OFFSET_THRESHOLD) {
    removeDataFromQueueCallback(playerPosition - DISPLAY_OFFSET_THRESHOLD);
  }
};

export { getManifestStreamTime, displayDataIos };
