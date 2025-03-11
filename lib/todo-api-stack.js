"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoApiStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const apigateway = require("aws-cdk-lib/aws-apigateway");
class TodoApiStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.TodoApiStack = TodoApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby1hcGktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0b2RvLWFwaS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsaURBQWlEO0FBQ2pELHFEQUFxRDtBQUNyRCx5REFBeUQ7QUFFekQsTUFBYSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixrR0FBa0c7UUFDbEcsTUFBTSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDbEQsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDaEUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtTQUNsRCxDQUFDLENBQUM7UUFFSCxpSEFBaUg7UUFDakgsTUFBTSxZQUFZLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDN0QsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1lBQ3JDLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLFdBQVcsRUFBRTtnQkFDWCxVQUFVLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDNUI7U0FDRixDQUFDLENBQUM7UUFFSCw2RUFBNkU7UUFDN0UsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXZDLDJEQUEyRDtRQUMzRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNsRCxXQUFXLEVBQUUsY0FBYztZQUMzQixXQUFXLEVBQUUsNENBQTRDO1NBQzFELENBQUMsQ0FBQztRQUVILGtEQUFrRDtRQUNsRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZDLDhEQUE4RDtRQUM5RCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRTtZQUN6QyxJQUFJLEVBQUUsTUFBTTtZQUNaLFFBQVEsRUFBRTtnQkFDUixTQUFTLEVBQUUsRUFBRTtnQkFDYixVQUFVLEVBQUUsQ0FBQzthQUNkO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ2YsS0FBSyxFQUFFLEdBQUcsQ0FBQyxlQUFlO1NBQzNCLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixNQUFNLGlCQUFpQixHQUFHLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXpFLCtCQUErQjtRQUUvQixrQkFBa0I7UUFDbEIsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFcEQsaUhBQWlIO1FBQ2pILE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0QsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtRQUUxRSxpREFBaUQ7UUFDakQsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUU7WUFDakQsY0FBYyxFQUFFLElBQUk7U0FDckIsQ0FBQyxDQUFDO1FBRUgscUVBQXFFO1FBQ3JFLE1BQU0sa0JBQWtCLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoRSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFO1lBQ3JELGNBQWMsRUFBRSxJQUFJO1NBQ3JCLENBQUMsQ0FBQztRQUVILGtIQUFrSDtRQUNsSCxNQUFNLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMxRSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpREFBaUQ7SUFDNUcsQ0FBQztDQUNGO0FBMUVELG9DQTBFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcblxuZXhwb3J0IGNsYXNzIFRvZG9BcGlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBEeW5hbW9EQiB0YWJsZSB3aXRoIGNvbXBvc2l0ZSBwcmltYXJ5IGtleXM6IHVzZXJJZCAoUGFydGl0aW9uIEtleSkgYW5kIHRvZG9JZCAoU29ydCBLZXkpXG4gICAgY29uc3QgdGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1RvZG9UYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RvZG9JZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGEgTGFtYmRhIGZ1bmN0aW9uLCB0aGUgY29kZSBpcyBsb2NhdGVkIGluIHRoZSBsYW1iZGEvZGlyZWN0b3J5LCBhbmQgdGhlIGVudHJ5IGZ1bmN0aW9uIGlzIGluZGV4LmhhbmRsZXJcbiAgICBjb25zdCB0b2RvRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdUb2RvRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCwgIFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGEnKSxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudGluZyByZWFkIGFuZCB3cml0ZSBwZXJtaXNzaW9ucyB0byBMYW1iZGEgZnVuY3Rpb25zIG9uIER5bmFtb0RCIHRhYmxlc1xuICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0b2RvRnVuY3Rpb24pO1xuXG4gICAgLy8gQ3JlYXRlIEFQSSBHYXRld2F5IFJFU1QgQVBJIGFuZCBpbnRlZ3JhdGUgaXQgd2l0aCBMYW1iZGFcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdUb2RvQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdUb0RvIFNlcnZpY2UnLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGlzIHNlcnZpY2Ugc2VydmVzIGEgVG9EbyBtYW5hZ2VtZW50IEFQSS4nLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIEFQSSBLZXkgdG8gcHJvdGVjdCBQT1NUIGFuZCBQVVQgcmVxdWVzdHNcbiAgICBjb25zdCBhcGlLZXkgPSBhcGkuYWRkQXBpS2V5KCdBcGlLZXknKTtcblxuICAgIC8vIERlZmluZSBhIHVzYWdlIHBsYW4gYW5kIGFzc29jaWF0ZSB0aGUgQVBJIEtleSB3aXRoIHRoZSBwbGFuXG4gICAgY29uc3QgcGxhbiA9IGFwaS5hZGRVc2FnZVBsYW4oJ1VzYWdlUGxhbicsIHtcbiAgICAgIG5hbWU6ICdFYXN5JyxcbiAgICAgIHRocm90dGxlOiB7XG4gICAgICAgIHJhdGVMaW1pdDogMTAsXG4gICAgICAgIGJ1cnN0TGltaXQ6IDIsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcGxhbi5hZGRBcGlLZXkoYXBpS2V5KTtcbiAgICBwbGFuLmFkZEFwaVN0YWdlKHtcbiAgICAgIHN0YWdlOiBhcGkuZGVwbG95bWVudFN0YWdlLFxuICAgIH0pO1xuXG4gICAgLy8gRGVmaW5lIExhbWJkYSBJbnRlZ3JhdGlvblxuICAgIGNvbnN0IGxhbWJkYUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odG9kb0Z1bmN0aW9uKTtcblxuICAgIC8vIERlZmluZSByZXNvdXJjZXMgYW5kIG1ldGhvZHNcblxuICAgIC8vIC90b2RvcyByZXNvdXJjZVxuICAgIGNvbnN0IHRvZG9zUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgndG9kb3MnKTtcbiAgICBcbiAgICAvLyBHRVQgL3RvZG9zL3t1c2VySWR9OiBRdWVyeSBhbGwgdG8tZG8gaXRlbXMgb2YgdGhlIHNwZWNpZmllZCB1c2VyLCBvcHRpb25hbGx5IHdpdGggYSBxdWVyeSBzdHJpbmcgZm9yIGZpbHRlcmluZ1xuICAgIGNvbnN0IHVzZXJSZXNvdXJjZSA9IHRvZG9zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3t1c2VySWR9Jyk7XG4gICAgdXNlclJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbGFtYmRhSW50ZWdyYXRpb24pOyAvLyBBUEkgS2V5IG5vdCBuZWVkIGhlcmVcblxuICAgIC8vIFBPU1QgL3RvZG9zOiBBZGQgdG8tZG8gbGlzdCAocmVxdWlyZXMgQVBJIEtleSlcbiAgICB0b2Rvc1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIGxhbWJkYUludGVncmF0aW9uLCB7XG4gICAgICBhcGlLZXlSZXF1aXJlZDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIFBVVCAvdG9kb3Mve3VzZXJJZH0ve3RvZG9JZH06IFVwZGF0ZSB0by1kbyBsaXN0IChyZXF1aXJlcyBBUEkgS2V5KVxuICAgIGNvbnN0IHNpbmdsZVRvZG9SZXNvdXJjZSA9IHVzZXJSZXNvdXJjZS5hZGRSZXNvdXJjZSgne3RvZG9JZH0nKTtcbiAgICBzaW5nbGVUb2RvUmVzb3VyY2UuYWRkTWV0aG9kKCdQVVQnLCBsYW1iZGFJbnRlZ3JhdGlvbiwge1xuICAgICAgYXBpS2V5UmVxdWlyZWQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL3RvZG9zL3t1c2VySWR9L3t0b2RvSWR9L3RyYW5zbGF0aW9uOiBSZXR1cm4gdGhlIHRyYW5zbGF0aW9uIHJlc3VsdCBvZiB0aGUgc3BlY2lmaWVkIHRvLWRvIGl0ZW0gZGVzY3JpcHRpb25cbiAgICBjb25zdCB0cmFuc2xhdGlvblJlc291cmNlID0gc2luZ2xlVG9kb1Jlc291cmNlLmFkZFJlc291cmNlKCd0cmFuc2xhdGlvbicpO1xuICAgIHRyYW5zbGF0aW9uUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBsYW1iZGFJbnRlZ3JhdGlvbik7IC8vIFRyYW5zbGF0aW9uIGludGVyZmFjZSBkb2VzIG5vdCByZXF1aXJlIEFQSSBLZXlcbiAgfVxufVxuXG4iXX0=