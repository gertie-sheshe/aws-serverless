import {DynamoDBStreamEvent, DynamoDBStreamHandler} from 'aws-lambda';
import 'source-map-support/register';

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing events batch from DynamoBD', JSON.stringify(event));

  for (const record of event.Records) {
    console.log('Processing record', JSON.stringify(record));
  }
}
