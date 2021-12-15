const AWS = require('aws-sdk');

const { TABLE_NAME } = process.env;

const dynamoDbClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.handler = async event => {
  console.info('Incoming event:\n', JSON.stringify(event));

  const deleteParams = {
    TableName: TABLE_NAME,
    Key: {
      connectionId: event.requestContext.connectionId
    }
  };

  try {
    await dynamoDbClient.delete(deleteParams).promise();
  } catch (err) {
    return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
  }

  return { statusCode: 200, body: 'Disconnected.' };
};
