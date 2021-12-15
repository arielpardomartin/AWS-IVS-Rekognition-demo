import React, { useEffect, useState } from 'react';

import {
  Play,
  Pause,
  VolumeOff,
  VolumeUp,
  Fullscreen,
  ExitFullscreen,
  Settings
} from '../../assets/icons';

const LATENCY_SLIDER_STEP = 0.1;

const PlayerControls = ({ player, toggleSettings, toggleFullscreen, togglePause, isFullscreen, isPaused, startsMuted, manualLatency, setManualLatency, latencySliderEnabled, latencySliderMinValue, latencySliderMaxValue }) => {
  const [muted, setMuted] = useState(startsMuted);

  useEffect(() => {
    setMuted(player.isMuted());
  }, [player]);

  useEffect(() => {
    setMuted(startsMuted);
  }, [startsMuted]);

  const toggleMute = () => {
    const shouldMute = !player.isMuted();

    player.setMuted(shouldMute);
    setMuted(shouldMute);
  };

  const handleSliderChange = (event) => {
    setManualLatency(event.target.valueAsNumber);
  };

  return (
    <div className='player-ui-controls'>
      <div className='player-ui-controls__actions player-ui-controls__actions--left'>
        <button className='player-ui-button' onClick={togglePause}>
          {isPaused ? <Play /> : <Pause />}
        </button>

        <button className='player-ui-button' onClick={toggleMute}>
          {muted ? <VolumeOff /> : <VolumeUp />}
        </button>
      </div>

      {latencySliderEnabled
        ? <div className='player-ui-controls__actions player-ui-controls__actions--center'>
          <input
            className='slider'
            type='range'
            min={latencySliderMinValue}
            max={latencySliderMaxValue}
            value={manualLatency}
            onChange={handleSliderChange}
            step={LATENCY_SLIDER_STEP}
          />
          <div className='slider-text'>
            {`Current latency value: ${manualLatency.toFixed(1)}`}
          </div>
        </div>
        : null};

      <div className='player-ui-controls__actions player-ui-controls__actions--right'>
        <button className='player-ui-button' onClick={toggleFullscreen}>
          {isFullscreen ? <ExitFullscreen /> : <Fullscreen />}
        </button>
        <button className='player-ui-button' onClick={toggleSettings}>
          <Settings />
        </button>
      </div>
    </div>
  );
};

export default PlayerControls;
