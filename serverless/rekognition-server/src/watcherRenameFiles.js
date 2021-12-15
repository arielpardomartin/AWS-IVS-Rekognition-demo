const chokidar = require('chokidar');
const { renameSync } = require('fs');

const SCREENSHOTS_ORIGINAL_DIRECTORY = '/tmp/screenshots-original';
const SCREENSHOTS_RENAMED_DIRECTORY = '/tmp/screenshots-renamed';
const SCREENSHOT_FILENAME_REGEX = /(\d+).png$/;
const MAX_SUPPORTED_SCREENSHOTS_PER_SECOND = 4;
const MILLISECONDS_PER_COUNT = {
  0: 0,
  1: 200,
  2: 400,
  3: 600,
  4: 800 
};

let sameSecondsSinceEpochScreenshotCount = 0;
let previousSecondsSinceEpochScreenshot;

const watcher = chokidar.watch(SCREENSHOTS_ORIGINAL_DIRECTORY, { ignoreInitial: true });

watcher.on('add', async path => {
    const secondsSinceEpochScreenshot = parseFloat(path.match(SCREENSHOT_FILENAME_REGEX)[1]);

    if (sameSecondsSinceEpochScreenshotCount === MAX_SUPPORTED_SCREENSHOTS_PER_SECOND && secondsSinceEpochScreenshot === previousSecondsSinceEpochScreenshot) return;

    if (secondsSinceEpochScreenshot === previousSecondsSinceEpochScreenshot) sameSecondsSinceEpochScreenshotCount++;
    else sameSecondsSinceEpochScreenshotCount = 0;

    const filename = secondsSinceEpochScreenshot * 1000 + MILLISECONDS_PER_COUNT[sameSecondsSinceEpochScreenshotCount];

    previousSecondsSinceEpochScreenshot = secondsSinceEpochScreenshot;

    console.log(JSON.stringify({
      origin: 'watcherRenameFiles.js',
      path,
      secondsSinceEpochScreenshot,        
      previousSecondsSinceEpochScreenshot,
      sameSecondsSinceEpochScreenshotCount,
      filename
    }));

    renameSync(path, `${SCREENSHOTS_RENAMED_DIRECTORY}/${filename}.png`);
});