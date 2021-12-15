const AWS = require('aws-sdk');

const { TABLE_NAME } = process.env;

const dynamoDbClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.handler = async event => {
  console.info('Incoming event:\n', JSON.stringify(event));

  const putParams = {
    TableName: TABLE_NAME,
    Item: {
      connectionId: event.requestContext.connectionId
    }
  };

  try {
    await dynamoDbClient.put(putParams).promise();
  } catch (err) {
    return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
  }

  return { statusCode: 200, body: 'Connected.' };
};
