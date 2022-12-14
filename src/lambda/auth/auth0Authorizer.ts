import {CustomAuthorizerResult, APIGatewayTokenAuthorizerEvent} from 'aws-lambda';
import 'source-map-support/register';

import { JwtToken } from 'src/auth/JwtToken';
import * as AWS from 'aws-sdk';
import {verify} from 'jsonwebtoken';

const secretId = process.env.AUTH_0_SECRET_ID;
const secretField = process.env.AUTH_0_SECRET_FIELD;

const client = new AWS.SecretsManager();

// Cache client if a Lambda instance is reused
let cachedSecret: string

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    const decodedToken = await verifyToken(event.authorizationToken);
    console.log('User was authorized');

    return {
      principalId: decodedToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch(e) {
    console.log('User was not authorized', e.message)

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }

  async function verifyToken(authHeader: string): Promise<JwtToken> {
    if(!authHeader)
      throw new Error('No authorization header');

    if (!authHeader.toLocaleLowerCase().startsWith('bearer '))
      throw new Error('Invalid authorization header');

    const split = authHeader.split(' ');
    const token = split[1];

    const secretObject: any = await getSecret();
    const secret = secretObject[secretField];

    return verify(token, secret) as JwtToken;

    // Request has been authorized
  }

  async function getSecret() {
    if (cachedSecret) return cachedSecret;

    const data = await client.getSecretValue({
      SecretId: secretId
    }) 
    .promise();

    cachedSecret = data.SecretString;

    return JSON.parse(cachedSecret);
  }

}
