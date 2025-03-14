import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class TodoApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table with composite primary keys: userId (Partition Key) and todoId (Sort Key)
    const table = new dynamodb.Table(this, 'TodoTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'todoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create a Lambda function, the code is located in the lambda/directory, and the entry function is index.handler
    const todoFunction = new lambda.Function(this, 'TodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,  
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Granting read and write permissions to Lambda functions on DynamoDB tables
    table.grantReadWriteData(todoFunction);

    // Add permission to call Amazon Translate for Lambda functions
    todoFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['translate:TranslateText'],
      resources: ['*'],
    }));

    // Create API Gateway REST API and integrate it with Lambda
    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'ToDo Service',
      description: 'This service serves a ToDo management API.',
    });

    // Create API Key to protect POST and PUT requests
    const apiKey = api.addApiKey('ApiKey');

    // Define a usage plan and associate the API Key with the plan
    const plan = api.addUsagePlan('UsagePlan', {
      name: 'Easy',
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });

    plan.addApiKey(apiKey);
    plan.addApiStage({
      stage: api.deploymentStage,
    });

    // Define Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(todoFunction);

    // Define resources and methods

    // /todos resource
    const todosResource = api.root.addResource('todos');
    
    // GET /todos/{userId}: Query all to-do items of the specified user, optionally with a query string for filtering
    const userResource = todosResource.addResource('{userId}');
    userResource.addMethod('GET', lambdaIntegration); // API Key not need here

    // POST /todos: Add to-do list (requires API Key)
    todosResource.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
    });

    // PUT /todos/{userId}/{todoId}: Update to-do list (requires API Key)
    const singleTodoResource = userResource.addResource('{todoId}');
    singleTodoResource.addMethod('PUT', lambdaIntegration, {
      apiKeyRequired: true,
    });

    // GET /todos/{userId}/{todoId}/translation: Return the translation result of the specified to-do item description
    const translationResource = singleTodoResource.addResource('translation');
    translationResource.addMethod('GET', lambdaIntegration); // Translation interface does not require API Key
  }
}

