## Serverless REST Assignment - Distributed Systems.

__Name:__ Shaohua Xu

__Demo:__ https://www.youtube.com/watch?v=tpA_v0w7t2w

### Context.

Context: To-Do List Application
This project implements a To Do management API service for users.

Table item attributes:
+ userId - string (Partition key)
+ todoId - string (Sort key)
+ description - string
+ status - string (e.g. pending, completed)
+ priority - number (e.g. 1 ~ 5)
+ completed - boolean
+ translations - map<string, string>

### App API endpoints.

+ POST /todos - add a new to-do.
+ GET /todos/{userId} - Retrieve all pending tasks for the specified user. Support filtering status by querying the parameter status.
+ PUT /todos/{userId}/{todoId} - Update a specific user's to-do list (such as status, priority, description, etc.).
+ GET /todos/{userId}/{todoId}/translation?language=xx - Translate the description field of a certain to-do item. Use Amazon Translate service and cache translation results to optimize performance.


### Features.

#### Translation persistence (if completed)

In order to meet the requirement of translation persistence, each to-do item contains a translations field, which is a map type used to cache translation content in different language versions. For example:

+ userId - string
+ todoId - string
+ description - string
+ status - string
+ priority - number
+ completed -boolean
+ translations - 
    {
    "es": "tarea pendiente",
    "fr": "tâche en attente"
    }



#### Custom L2 Construct (if completed)

Custom L2 constructors have not been implemented, and all infrastructure resources (such as DynamoDB tables, Lambda functions, API Gateway, etc.) are directly defined and configured in the main Stack (TodoApiStack).

#### Multi-Stack app (if completed)

The multi stack structure has not been implemented. The current project has centralized all resources (including databases, functions, and API gateways) in TodoApiStack, with a simple structure.

#### Lambda Layers (if completed)

Without using Lambda Layers, the Lambda functions in this project directly include the required dependency libraries (such as AWS SDK and Translate client).


#### API Keys. (if completed)

This project implements API Key authentication mechanism through API Gateway. API Key protection has been enabled for critical write operations such as adding and updating to-do items.

    // Create API Key
    const apiKey = api.addApiKey('ApiKey');

    // Binding usage plan
    const plan = api.addUsagePlan('UsagePlan', {
    name: 'Easy',
    throttle: {
        rateLimit: 10,
        burstLimit: 2,
    },
    });
    plan.addApiKey(apiKey);
    plan.addApiStage({ stage: api.deploymentStage });

    // Bind API methods and enable Key authentication
    todosResource.addMethod('POST', lambdaIntegration, {
    apiKeyRequired: true,
    });
    singleTodoResource.addMethod('PUT', lambdaIntegration, {
    apiKeyRequired: true,
    });


###  Extra (If relevant).

