import React, { useEffect, useCallback, useRef, useState } from 'react';

import { closeSocket, createSocket } from '../../helpers/websocket';
import { getManifestStreamTime, displayDataIos } from '../../helpers/iosOffset';
import { getRandomColor } from '../../helpers/color';
import config from '../../config';
import canAutoPlay from 'can-autoplay';

import Placeholder from '../Placeholder';
import PlayerControls from '../PlayerControls';
import PlayerDebugInfo from '../PlayerDebugInfo';
import PlayerSettings from '../PlayerSettings';
import PlayerAutoPlayBlocked from '../PlayerAutoPlayBlocked';
import PlayerDebugLabels from '../PlayerDebugLabels';
import Box from '../Box/Box';

import './PlayerIVS.css';

const BOUNDING_BOXES_UPDATE_INTERVAL = 100;
const DISPLAY_OFFSET_THRESHOLD = 1.5;
const MAX_ERROR_COUNT_UNTIL_WINDOW_REFRESH = 300; // 30 seconds
const MAX_ERROR_COUNT_UNTIL_BOX_REMOVAL = 20; // 2 seconds
const LATENCY_SLIDER_OFFSET = 3;

const PlayerIVS = ({ streamUrl }) => {
  const deviceDetect = require('react-device-detect');

  const { IVSPlayer } = window;
  const { isPlayerSupported } = IVSPlayer;
  const [placeHolderStatus, setPlaceHolderStatus] = useState('loading');
  const [showSettings, setShowSettings] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showDebugLabels, setShowDebugLabels] = useState(false);
  const [latencySliderEnabled, setLatencySliderEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [isVideoBlocked, setIsVideoBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [colorList, setColorList] = useState(new Map());
  const [isPaused, setIsPaused] = useState(false);
  const [labelSetsQueue, setLabelSetsQueue] = useState([]);
  const [activeLabels, setActiveLabels] = useState([]);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [calculatedLatency, setCalculatedLatency] = useState(1);
  const [manualLatency, setManualLatency] = useState(1);
  const [errorCountUntilWindowRefresh, setErrorCountUntilWindowRefresh] = useState(0);
  const [errorCountUntilBoxRemoval, setErrorCountUntilBoxRemoval] = useState(0);
  const [latencySliderMinValue, setLatencySliderMinValue] = useState(0);
  const [latencySliderMaxValue, setLatencySliderMaxValue] = useState(50);

  const player = useRef(null);
  const videoEl = useRef(null);
  const trackEl = useRef(null);
  const playerWrapper = useRef(null);
  const webSocket = useRef(null);
  const boundingBoxesInterval = useRef(null);

  /** DOCUMENT EVENTS LISTENERS useEffect - START **/

  const handleVisibilityChange = () => {
    // in iOS, when putting the app in background and then foreground again, video and boxes get frozen, this is to bypass that issue
    if (deviceDetect.isIOS && document.visibilityState === 'visible') window.location.reload();

    if (document.visibilityState === 'hidden' && player.current.getState() === IVSPlayer.PlayerState.PLAYING && webSocket.current) {
      closeSocket(webSocket.current);
      webSocket.current = null;
      setActiveLabels([]);
      setLabelSetsQueue([]);
    }

    if (document.visibilityState === 'visible' && player.current.getState() === IVSPlayer.PlayerState.PLAYING && !webSocket.current) {
      webSocket.current = createSocket(
        config.WS_REKOGNITION_URL,
        showDebugInfo,
        onMessage
      );
    }
  };

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** DOCUMENT EVENTS LISTENERS useEffect - END **/

  // player event listeners
  const onStateChange = useCallback(() => {
    const playerState = player.current.getState();

    console.log(`Player State - ${playerState}`);
    setIsPlaying(playerState === IVSPlayer.PlayerState.PLAYING);

    if (playerState === IVSPlayer.PlayerState.PLAYING) {
      setPlaceHolderStatus(null);
      if (trackEl && trackEl.current) {
        trackEl.current.track.mode = 'showing';
      }
    } else if (playerState === IVSPlayer.PlayerState.ENDED) {
      setShowDebugLabels(false);
      setPlaceHolderStatus('This live stream has ended');
    }
  }, [IVSPlayer.PlayerState]);

  const onError = (err) => {
    console.warn('Player Event - ERROR:', err);
    setPlaceHolderStatus('This live stream is currently offline');
  };

  const onRebuffering = () => {
    console.log('Player State - Rebuffering');
    player.current.setRebufferToLive(true);
  };

  const onFullScreenChange = () => {
    if (document.fullscreenElement) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  };

  const onTextMetadataCue = (textMetadataCue) => {
    const millisecondsSinceEpochServer = JSON.parse(textMetadataCue.text);
    const millisecondsSinceEpochClient = new Date().getTime();
    const result = (millisecondsSinceEpochClient - millisecondsSinceEpochServer) / 1000;

    setCalculatedLatency(result);

    if (showDebugInfo) {
      console.log('[onTextMetadataCue function message] Latency synchronization data:', {
        millisecondsSinceEpochServer,
        millisecondsSinceEpochClient,
        calculatedLatency,
        getLiveLatency: player.current.getLiveLatency()
      });
    }
  };

  /** IVS PLAYER EVENTS LISTENERS useEffect - START **/

  const AddEventListeners = useCallback(() => {
    const video = playerWrapper.current.getElementsByTagName('video')[0];

    player.current.addEventListener(IVSPlayer.PlayerState.READY, onStateChange);
    player.current.addEventListener(IVSPlayer.PlayerState.PLAYING, onStateChange);
    player.current.addEventListener(IVSPlayer.PlayerState.BUFFERING, onStateChange);
    player.current.addEventListener(IVSPlayer.PlayerState.IDLE, onStateChange);
    player.current.addEventListener(IVSPlayer.PlayerState.ENDED, onStateChange);
    player.current.addEventListener(IVSPlayer.PlayerEventType.ERROR, onError);
    player.current.addEventListener(IVSPlayer.PlayerEventType.REBUFFERING, onRebuffering);
    player.current.addEventListener(IVSPlayer.PlayerEventType.TEXT_METADATA_CUE, onTextMetadataCue);

    if (deviceDetect.isMobileSafari) {
      video.addEventListener('webkitendfullscreen', onFullScreenChange);
    } else if (deviceDetect.isSafari) {
      document.addEventListener('webkitfullscreenchange', onFullScreenChange);
    } else {
      document.addEventListener('fullscreenchange', onFullScreenChange);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [IVSPlayer.PlayerState, IVSPlayer.PlayerEventType, deviceDetect.isMobileSafari, deviceDetect.isSafari, onStateChange]);

  const RemoveEventListeners = useCallback(() => {
    const video = playerWrapper.current.getElementsByTagName('video')[0];

    player.current.removeEventListener(IVSPlayer.PlayerState.READY, onStateChange);
    player.current.removeEventListener(IVSPlayer.PlayerState.PLAYING, onStateChange);
    player.current.removeEventListener(IVSPlayer.PlayerState.BUFFERING, onStateChange);
    player.current.removeEventListener(IVSPlayer.PlayerState.IDLE, onStateChange);
    player.current.removeEventListener(IVSPlayer.PlayerState.ENDED, onStateChange);
    player.current.removeEventListener(IVSPlayer.PlayerEventType.ERROR, onError);
    player.current.removeEventListener(IVSPlayer.PlayerEventType.REBUFFERING, onRebuffering);
    player.current.removeEventListener(IVSPlayer.PlayerEventType.TEXT_METADATA_CUE, onTextMetadataCue);

    if (deviceDetect.isMobileSafari) {
      video.removeEventListener('webkitendfullscreen', onFullScreenChange);
    } else if (deviceDetect.isSafari) {
      document.removeEventListener('webkitfullscreenchange', onFullScreenChange);
    } else {
      document.removeEventListener('fullscreenchange', onFullScreenChange);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [IVSPlayer.PlayerState, IVSPlayer.PlayerEventType, deviceDetect.isMobileSafari, deviceDetect.isSafari, onStateChange]);

  useEffect(() => {
    if (!isPlayerSupported) {
      console.warn('The current browser does not support the Amazon IVS player.');
      return;
    }

    player.current = IVSPlayer.create();
    player.current.attachHTMLVideoElement(videoEl.current);

    AddEventListeners();

    player.current.load(streamUrl);

    // Ask if the browser allows autoplay with sound
    canAutoPlay.video({ muted: false, inline: true, timeout: 1000 }).then(({ result, error }) => {
      if (result) {
        player.current.play();
      } else {
        console.warn(error);
        setIsAudioBlocked(true);
        canAutoplayMuted();
      }
    });

    // Ask for autoplay without sound
    const canAutoplayMuted = () =>
      canAutoPlay.video({ muted: true, inline: true, timeout: 1000 }).then(({ result, error }) => {
        if (result) {
          player.current.setMuted(true);
          player.current.play();
        } else {
          setIsVideoBlocked(true);
        }
      });

    return () => {
      RemoveEventListeners();
    };
  }, [IVSPlayer, isPlayerSupported, streamUrl, AddEventListeners, RemoveEventListeners]);

  /** IVS PLAYER EVENTS LISTENERS useEffect - END **/

  /** WEBSOCKET CONNECTION useEffect - START **/

  const onMessage = (data) => {
    const parsedData = JSON.parse(data);
    setLabelSetsQueue(oldQueue => {
      const newQueue = [...oldQueue];
      newQueue.push(parsedData);
      newQueue.sort((a, b) => (a.feedTime - b.feedTime));
      return newQueue;
    });
  };

  useEffect(() => {
    if (isPlaying) {
      if (webSocket.current) {
        closeSocket(webSocket.current);
        webSocket.current = null;
      }
      webSocket.current = createSocket(
        config.WS_REKOGNITION_URL,
        showDebugInfo,
        onMessage
      );
    }
  }, [isPlaying, showDebugInfo]);

  /** WEBSOCKET CONNECTION useEffect - END **/

  /** iOS STREAM TIME HANDLE useEffect - START **/

  useEffect(() => {
    if (deviceDetect.isIOS && (deviceDetect.deviceType === 'mobile' || deviceDetect.isChrome)) {
      getManifestStreamTime(isPlaying, streamUrl, player);
    }
  }, [isPlaying, streamUrl, deviceDetect.isIOS, deviceDetect.isChrome, deviceDetect.deviceType]);

  /** iOS STREAM TIME HANDLE useEffect - END **/

  /** UPDATE BOUNDING BOXES useEffect - START **/

  const removeLabelSetsFromQueue = (syncPosition) => {
    setLabelSetsQueue(oldQueue => {
      const newQueue = [...oldQueue];
      let i = 0;

      while (i < newQueue.length && (newQueue[i].feedTime <= syncPosition)) {
        i++;
      }

      newQueue.splice(0, i + 1);

      return newQueue;
    });
  };

  const shiftLabelSetsQueue = () => {
    setLabelSetsQueue(oldQueue => {
      const newQueue = [...oldQueue];
      newQueue.shift();
      return newQueue;
    });
  };

  const displayBoundingBoxes = (labels) => {
    setShowBoundingBoxes(true);
    setActiveLabels(labels);
    shiftLabelSetsQueue();
  };

  const updateBoundingBoxes = () => {
    // sanity checks
    if (!labelSetsQueue.length || !isPlaying) return;

    if (!showBoundingBoxes) {
      shiftLabelSetsQueue();
      return;
    }

    if (player.current.getStartOffset() < 0) {
      return;
    }

    // get new bounding boxes
    const boundingBoxes = labelSetsQueue[0];

    // iOS handling
    if (deviceDetect.isIOS && (deviceDetect.deviceType === 'mobile' || deviceDetect.isChrome)) {
      displayDataIos(boundingBoxes, player, displayBoundingBoxes, removeLabelSetsFromQueue);
      return;
    }

    const playerStartOffset = player.current.getStartOffset();
    const playerPosition = player.current.getPosition();
    const latency = latencySliderEnabled ? manualLatency : calculatedLatency;
    const displayTime = boundingBoxes.feedTime - playerStartOffset - latency;

    if (showDebugInfo) {
      console.log('[updateBoundingBoxes function message] New bounding boxes data:', {
        boundingBoxes: boundingBoxes,
        originalDisplayTime: boundingBoxes.feedTime,
        finalDisplayTime: displayTime,
        playerStartOffset: playerStartOffset,
        playerPosition: playerPosition,
        calculatedLatency,
        manualLatency,
        latency,
        getLiveLatency: player.current.getLiveLatency(),
        shouldBeDisplayed: displayTime >= playerPosition - DISPLAY_OFFSET_THRESHOLD && displayTime <= playerPosition + DISPLAY_OFFSET_THRESHOLD
      });
    }

    // check times and display bounding boxes
    if (displayTime >= playerPosition - DISPLAY_OFFSET_THRESHOLD && displayTime <= playerPosition + DISPLAY_OFFSET_THRESHOLD) {
      setErrorCountUntilBoxRemoval(0);
      setErrorCountUntilWindowRefresh(0);
      displayBoundingBoxes(boundingBoxes.labels);
    } else if (displayTime < playerPosition - DISPLAY_OFFSET_THRESHOLD) {
      setErrorCountUntilBoxRemoval(errors => errors + 1);
      setErrorCountUntilWindowRefresh(errors => errors + 1);
      removeLabelSetsFromQueue(boundingBoxes.feedTime);
    }
  };

  /** UPDATE BOUNDING BOXES useEffect - END **/

  /** ERROR COUNT useEffect - START **/

  useEffect(() => {
    if (errorCountUntilBoxRemoval > MAX_ERROR_COUNT_UNTIL_BOX_REMOVAL) {
      setActiveLabels([]);
    }
  }, [errorCountUntilBoxRemoval]);

  useEffect(() => {
    if (errorCountUntilWindowRefresh > MAX_ERROR_COUNT_UNTIL_WINDOW_REFRESH) {
      window.location.reload();
    }
  }, [errorCountUntilWindowRefresh]);

  /** ERROR COUNT useEffect - END **/

  useEffect(() => {
    boundingBoxesInterval.current = setInterval(updateBoundingBoxes, BOUNDING_BOXES_UPDATE_INTERVAL);
    return () => clearInterval(boundingBoxesInterval.current);
  });

  useEffect(() => {
    const colorsToMergeToList = {};
    activeLabels.forEach((label) => {
      if (!colorList[label.Name]) colorsToMergeToList[label.Name] = getRandomColor();
    });
    if (Object.keys(colorsToMergeToList).length > 0) setColorList({ ...colorList, ...colorsToMergeToList });
  }, [activeLabels, colorList]);

  useEffect(() => {
    if (showDebugInfo) console.log('activeLabels', activeLabels);
  }, [showDebugInfo, activeLabels]);

  useEffect(() => {
    if (showDebugInfo) console.log('labelSetsQueue', labelSetsQueue);
  }, [showDebugInfo, labelSetsQueue]);

  useEffect(() => {
    if (latencySliderEnabled) {
      setManualLatency(calculatedLatency);
      setLatencySliderMinValue(Math.max(0, calculatedLatency - LATENCY_SLIDER_OFFSET));
      setLatencySliderMaxValue(calculatedLatency + LATENCY_SLIDER_OFFSET);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latencySliderEnabled]);

  useEffect(() => {
    // avoid frozen boxes
    setActiveLabels([]);
    // avoid long time without boxes (i.e. time until the elements that not match with the new latency are removed from the queue)
    setLabelSetsQueue([]);
  }, [manualLatency]);

  // TOGGLE FUNCTIONS
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  const toggleDebugLabels = () => {
    setShowDebugLabels(!showDebugLabels);
  };

  const toggleLatencySlider = () => {
    setLatencySliderEnabled(!latencySliderEnabled);
  };

  const toggleFullscreen = () => {
    const elem = document;
    const video = playerWrapper.current.getElementsByTagName('video')[0];
    if (isFullscreen) {
      if (elem.exitFullscreen) {
        elem.exitFullscreen();
      } else if (elem.webkitExitFullscreen) {
        /* Safari */
        elem.webkitExitFullscreen();
      } else if (elem.msExitFullscreen) {
        /* IE11 */
        elem.msExitFullscreen();
      } else if (video.webkitExitFullScreen) {
        /* IOS */
        video.webkitExitFullScreen();
      }
    } else {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        /* Safari */
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        /* IE11 */
        video.msRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        /* IOS */
        video.webkitEnterFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const togglePause = () => {
    const shouldPause = !player.current.isPaused();

    if (shouldPause) {
      player.current.pause();
    } else {
      player.current.play();
    }

    setIsPaused(shouldPause);
  };

  // PLAY FUNCTION
  const startPlayback = () => {
    player.current.play();
    setIsVideoBlocked(false);
  };

  // FILTER BOUNDING BOXES TO SHOW FUNCTION
  const getFilteredBoundingBoxes = (rekognitionLabels) => {
    const groupedInstancesNotOrdered = rekognitionLabels.flatMap((label) =>
      label.Instances.map((instance) => ({ Name: label.Name, ...instance }))
    );
    return groupedInstancesNotOrdered
      .filter((instance) => instance.Confidence >= config.DISPLAY_CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.Confidence - a.Confidence)
      .slice(0, config.MAX_CONCURRENT_BOXES);
  };

  return (
    <div className='stream-wrapper' ref={playerWrapper}>
      <div className={`player-container ${showDebugLabels && 'show-labels'}`}>
        <div className='aspect-16x9'>
          {placeHolderStatus && !isVideoBlocked && <Placeholder status={placeHolderStatus} />}
          <div className='player'>
            <video ref={videoEl} className='video-el' playsInline preload='metadata' crossOrigin='anonymous' />

            {showBoundingBoxes &&
              getFilteredBoundingBoxes(activeLabels).map((box) => {
                const { Name, Confidence, BoundingBox: { Width, Height, Top, Left } } = box;

                return (
                  <Box
                    key={`boundingbox-${Width}-${Height}-${Top}-${Left}`}
                    width={Width}
                    height={Height}
                    top={Top}
                    left={Left}
                    boxIsSmall={Width < 0.1}
                    placeLabelOnTop={Height + Top >= 0.8}
                    color={colorList[Name]}
                  >
                    <span> {Name} {Math.trunc(Confidence)}%</span>
                  </Box>
                );
              })}

            <div className='player-ui'>
              {showDebugInfo &&
                <PlayerDebugInfo
                  player={player.current}
                  latencySliderEnabled={latencySliderEnabled}
                  calculatedLatency={calculatedLatency}
                  manualLatency={manualLatency}
                />}

              {showSettings &&
                <PlayerSettings
                  toggleSettings={toggleSettings}
                  toggleDebugInfo={toggleDebugInfo}
                  toggleDebugLabels={toggleDebugLabels}
                  toggleLatencySlider={toggleLatencySlider}
                  showDebugInfo={showDebugInfo}
                  showDebugLabels={showDebugLabels}
                  latencySliderEnabled={latencySliderEnabled}
                />}

              {player.current && !isVideoBlocked &&
                <PlayerControls
                  player={player.current}
                  toggleSettings={toggleSettings}
                  toggleFullscreen={toggleFullscreen}
                  togglePause={togglePause}
                  isFullscreen={isFullscreen}
                  isPaused={isPaused}
                  startsMuted={isAudioBlocked}
                  manualLatency={manualLatency}
                  setManualLatency={setManualLatency}
                  latencySliderEnabled={latencySliderEnabled}
                  latencySliderMinValue={latencySliderMinValue}
                  latencySliderMaxValue={latencySliderMaxValue}
                />}

              {isVideoBlocked &&
                <PlayerAutoPlayBlocked
                  startPlayback={startPlayback}
                />}
            </div>
          </div>
        </div>
        {
          showDebugLabels && (
            <PlayerDebugLabels
              labelsList={activeLabels}
            />
          )
        }
      </div>
    </div>
  );
};

export default PlayerIVS;
