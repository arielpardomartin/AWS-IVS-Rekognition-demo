const fs = require('fs');
const pathStackFile = process.argv[2];
const pathEnvFile = '../web-ui/player-app/.env';

// Function to filter stack.json outputs by output key
const findOutput = (outputs, key) => {
  return outputs.filter((output) => {
    return output.OutputKey === key;
  })[0].OutputValue;
};

// Read stack.json file and get outputs section
const stackInfo = JSON.parse(fs.readFileSync(pathStackFile, 'utf8'));
const cloudformationOutputs = stackInfo.Stacks[0].Outputs;

const DISPLAY_CONFIDENCE_THRESHOLD = process.argv[3];
const MAX_CONCURRENT_BOXES = process.argv[4];

if (!cloudformationOutputs) {
  console.log('\n\nCloudFormation output file was not generated correctly. Please, execute deployment again.');
  process.exit(1);
}

// Get value for StreamPlaybackUrl key
const REACT_APP_STREAM_PLAYBACK_URL = findOutput(
  cloudformationOutputs,
  'StreamPlaybackURL'
);

// Get value for WebSocketURI key
const REACT_APP_WS_REKOGNITION_URL = findOutput(
  cloudformationOutputs,
  'ReaderWebSocketURL'
);

// Create .env file with environment variables
let envFile = `REACT_APP_STREAM_PLAYBACK_URL=${REACT_APP_STREAM_PLAYBACK_URL}\n`;
envFile += `REACT_APP_WS_REKOGNITION_URL=${REACT_APP_WS_REKOGNITION_URL}\n`;

envFile += `REACT_APP_DISPLAY_CONFIDENCE_THRESHOLD=${DISPLAY_CONFIDENCE_THRESHOLD}\n`;
envFile += `REACT_APP_MAX_CONCURRENT_BOXES=${MAX_CONCURRENT_BOXES}\n`;

// Write .env file
fs.writeFileSync(pathEnvFile, envFile);