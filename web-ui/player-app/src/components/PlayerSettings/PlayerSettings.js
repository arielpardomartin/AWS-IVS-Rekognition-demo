import React from 'react';
import { Close } from '../../assets/icons';
import './PlayerSettings.css';

const PlayerSettings = ({ toggleSettings, toggleDebugInfo, toggleDebugLabels, toggleLatencySlider, showDebugInfo, showDebugLabels, latencySliderEnabled }) => {
  return (
    <div className='player-settings'>
      <div className='player-settings-title-container'>

        <h3>Settings</h3>

        <button className='player-settings-close-button' onClick={toggleSettings}>
          <Close />
        </button>

      </div>

      <hr />

      <div className='player-settings-options-container'>
        <label className='player-settings-option'>
          <input
            className='player-settings-option-checkbox'
            type='checkbox'
            onChange={toggleDebugInfo}
            checked={showDebugInfo}
          />{' '}
          Show debug info
        </label>
        <label className='player-settings-option'>
          <input
            className='player-settings-option-checkbox'
            type='checkbox'
            onChange={toggleDebugLabels}
            checked={showDebugLabels}
          />{' '}
          Show labels info
        </label>
        <label className='player-settings-option'>
          <input
            className='player-settings-option-checkbox'
            type='checkbox'
            onChange={toggleLatencySlider}
            checked={latencySliderEnabled}
          />{' '}
          Enable latency slider
        </label>
      </div>
    </div>
  );
};

export default PlayerSettings;
