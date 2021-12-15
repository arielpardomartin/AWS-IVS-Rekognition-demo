import React from 'react';
import PlayerIVS from '../PlayerIVS';
import configData from '../../config';
import './App.css';

const App = () => {
  return (
    <div className='App'>
      <PlayerIVS streamUrl={configData.STREAM_PLAYBACK_URL} />
    </div>
  );
};

export default App;
