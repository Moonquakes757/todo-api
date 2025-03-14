const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const translate = new AWS.Translate();

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log("Event: ", event);

  const method = event.httpMethod;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};

  try {
    // POST /todos - Add to-do list
    if (method === 'POST' && event.resource === '/todos') {
      const body = JSON.parse(event.body);
      const { userId, todoId, description, status, priority } = body;
      const item = {
        userId,
        todoId,
        description,
        status: status || 'pending',
        priority: priority || 1,
        completed: false,
        translations: {}, // Used for caching translation results
      };

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item,
      }).promise();

      return {
        statusCode: 201,
        body: JSON.stringify({ message: 'Todo item created', item }),
      };
    }
    // GET /todos/{userId} - Query the to-do list of a specified user, supporting optional query string filtering (such as status)
    else if (method === 'GET' && event.resource === '/todos/{userId}') {
      const { userId } = pathParams;
      let params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': userId,
        },
      };

      const result = await dynamodb.query(params).promise();
      let items = result.Items;

      // If the status parameter is passed in, filtering will be performed
      if (queryParams.status) {
        items = items.filter(item => item.status === queryParams.status);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ items }),
      };
    }
    // PUT /todos/{userId}/{todoId} - Update to-do list
    else if (method === 'PUT' && event.resource === '/todos/{userId}/{todoId}') {
      const { userId, todoId } = pathParams;
      const body = JSON.parse(event.body);
      const updateExpression = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};

      if (body.description) {
        updateExpression.push('description = :desc');
        expressionAttributeValues[':desc'] = body.description;
      }
      if (body.status) {
        updateExpression.push('#st = :status');
        expressionAttributeNames['#st'] = 'status';
        expressionAttributeValues[':status'] = body.status;
      }
      if (body.priority) {
        updateExpression.push('priority = :priority');
        expressionAttributeValues[':priority'] = body.priority;
      }
      if (body.completed !== undefined) {
        updateExpression.push('completed = :completed');
        expressionAttributeValues[':completed'] = body.completed;
      }

      if (updateExpression.length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'No valid fields to update' }),
        };
      }

      const params = {
        TableName: TABLE_NAME,
        Key: { userId, todoId },
        UpdateExpression: 'set ' + updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ReturnValues: 'ALL_NEW',
      };

      const result = await dynamodb.update(params).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Todo item updated', item: result.Attributes }),
      };
    }
    // GET /todos/{userId}/{todoId}/translation?language=xx - Translate to-do list description
    else if (method === 'GET' && event.resource === '/todos/{userId}/{todoId}/translation') {
      const { userId, todoId } = pathParams;
      const targetLanguage = queryParams.language;
      if (!targetLanguage) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Target language query parameter is required' }),
        };
      }
      // Get to-do list
      const getResult = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { userId, todoId },
      }).promise();

      if (!getResult.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Todo item not found' }),
        };
      }

      const item = getResult.Item;
      // Check if there is already a target language translation in the cache
      if (item.translations && item.translations[targetLanguage]) {
        return {
          statusCode: 200,
          body: JSON.stringify({ translatedDescription: item.translations[targetLanguage], cached: true }),
        };
      }

      // Call Amazon Translate for translation
      const paramsTranslate = {
        Text: item.description,
        SourceLanguageCode: 'auto',
        TargetLanguageCode: targetLanguage,
      };

      const translateResult = await translate.translateText(paramsTranslate).promise();
      const translatedText = translateResult.TranslatedText;

      // Update DynamoDB to cache translation results in the translations attribute
      const updateParams = {
        TableName: TABLE_NAME,
        Key: { userId, todoId },
        UpdateExpression: 'set translations.#lang = :translated',
        ExpressionAttributeNames: {
          '#lang': targetLanguage,
        },
        ExpressionAttributeValues: {
          ':translated': translatedText,
        },
      };

      await dynamodb.update(updateParams).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({ translatedDescription: translatedText, cached: false }),
      };
    }
    // Other unsupported routes or methods
    else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Unsupported route or method' }),
      };
    }
  } catch (error) {
    console.error('Error processing request', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};
