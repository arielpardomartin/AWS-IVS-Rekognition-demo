const AWS = require("aws-sdk");

const ivs = new AWS.IVS({ apiVersion: "2020-07-14" });

const IVS_CHANNEL_ARN = process.env.IVS_CHANNEL_ARN;
const INTERVAL = 1000;

const sendData = async () => {
  try {
    const millisecondsSinceEpoch = new Date().getTime();

    const params = {
      channelArn: IVS_CHANNEL_ARN,
      metadata: millisecondsSinceEpoch.toString(),
    };

    await ivs.putMetadata(params).promise();
  } catch (error) {
    console.log("Latency Synchronizer Process Error:\n", error);
  }
};

setInterval(sendData, INTERVAL);