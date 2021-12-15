const fs = require('fs');
const chokidar = require('chokidar');
const rekognition = require('./rekognition');
const WebSocketManager = require("./utils/webSocketManager.js");

const SCREENSHOTS_RENAMED_DIRECTORY = '/tmp/screenshots-renamed';
const SCREENSHOT_FILENAME_REGEX = /(\d+).png$/;
const BASE_FEED_TIME = parseFloat(process.argv[2]);
const BASE_SECONDS_SINCE_EPOCH = parseFloat(process.argv[3]);

const webSocketManager = new WebSocketManager(process.env.WEBSOCKET_SERVER_URI);
webSocketManager.connect();

// pass the WebSocket manager object as a dependency to the Rekognition process
const processScreenshot = rekognition(webSocketManager);

const watcher = chokidar.watch(SCREENSHOTS_RENAMED_DIRECTORY, { ignoreInitial: true });

watcher.on('add', async path => { 
  
  try {

    const millisecondsSinceEpoch = parseFloat(path.match(SCREENSHOT_FILENAME_REGEX)[1]);
    const feedTime = BASE_FEED_TIME + ((millisecondsSinceEpoch / 1000) - BASE_SECONDS_SINCE_EPOCH);
  
    if (feedTime < 0) throw new Error('Feed time is negative'); 
  
    console.log(JSON.stringify({
      origin: 'watcherProcessFiles.js',
      path,
      millisecondsSinceEpoch,
      baseFeedTime: BASE_FEED_TIME,
      baseSecondsSinceEpoch: BASE_SECONDS_SINCE_EPOCH,
      feedTime
    }));
  
    await processScreenshot(path, feedTime);

  } catch (error) {

    console.error(JSON.stringify({
      origin: 'watcherProcessFiles.js',
      error,
      path,
      baseFeedTime: BASE_FEED_TIME,
      baseSecondsSinceEpoch: BASE_SECONDS_SINCE_EPOCH
    }));

  } finally {
    fs.unlinkSync(path);
  }

});