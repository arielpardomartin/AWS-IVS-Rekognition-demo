const fs = require('fs');
const { Rekognition } = require('aws-sdk');

const DEBUG_CONFIDENCE_THRESHOLD = parseFloat(process.env.DEBUG_CONFIDENCE_THRESHOLD);
const WRITER_WEBSOCKET_SENDMESSAGE_ROUTE = "sendmessage";

const rekognition = new Rekognition({
  apiVersion: '2016-06-27',
  region: process.env.REGION
});

const rekognitionProcess = (webSocketManager) => async (file, feedTime) => {
  
  try {
    const time = new Date().getTime(); // used only to identify process
    console.time(`${time} - Rekognition Process - file: ${file} - feedTime: ${feedTime}`);

    // detect labels
    console.time(`${time} - Detect Labels Operation`);
    const screenshot = fs.readFileSync(file);
    const params = {
      Image: {
        Bytes: screenshot
      },
      MinConfidence: DEBUG_CONFIDENCE_THRESHOLD
    };
    const result = await rekognition.detectLabels(params).promise();
    console.timeEnd(`${time} - Detect Labels Operation`);

    // build results
    let labels = [];
    result.Labels.forEach(label => {
      const labelWithFilteredInstances = { ...label, Instances: label.Instances.filter(instance => instance.Confidence >= DEBUG_CONFIDENCE_THRESHOLD) };
      labels.push(labelWithFilteredInstances);
    })

    // send results
    const data = JSON.stringify({
      feedTime,
      labels
    });
    const payload = {
      action: WRITER_WEBSOCKET_SENDMESSAGE_ROUTE,
      data
    };
    webSocketManager.send(payload);
    
    console.timeEnd(`${time} - Rekognition Process - file: ${file} - feedTime: ${feedTime}`);
  } catch (error) {
    console.timeEnd(`${time} - Detect Labels Operation`);
    console.timeEnd(`${time} - Rekognition Process - file: ${file} - feedTime: ${feedTime}`);
    throw error;
  }
}

module.exports = rekognitionProcess;
