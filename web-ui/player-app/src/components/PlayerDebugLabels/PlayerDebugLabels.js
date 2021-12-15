import React from 'react';
import './PlayerDebugLabels.css';

const PlayerDebugLabels = ({ labelsList }) => {
  return (
    <div className='player-debug-labels'>
      {labelsList.map((box, index) => (
        <li key={index} className='player-labels-list'>
          <div className='player-label-list-name'>{box.Name}</div>
          <div className='player-label-list-percentage'>{box.Confidence.toFixed(2)}%</div>
        </li>
      ))}
    </div>
  );
};

export default PlayerDebugLabels;
