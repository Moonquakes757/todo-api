"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoApiStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const iam = require("aws-cdk-lib/aws-iam");
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
        // Add permission to call Amazon Translate for Lambda functions
        todoFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['translate:TranslateText'],
            resources: ['*'],
        }));
        // Add permission to call Amazon Comprehend for automatic language detection
        todoFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['comprehend:DetectDominantLanguage'],
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
exports.TodoApiStack = TodoApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby1hcGktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0b2RvLWFwaS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsaURBQWlEO0FBQ2pELHFEQUFxRDtBQUNyRCx5REFBeUQ7QUFDekQsMkNBQTJDO0FBRTNDLE1BQWEsWUFBYSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3pDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsa0dBQWtHO1FBQ2xHLE1BQU0sS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ2xELFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2hFLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7U0FDbEQsQ0FBQyxDQUFDO1FBRUgsaUhBQWlIO1FBQ2pILE1BQU0sWUFBWSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzdELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztZQUNyQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzVCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsNkVBQTZFO1FBQzdFLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUV2QywrREFBK0Q7UUFDL0QsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDbkQsT0FBTyxFQUFFLENBQUMseUJBQXlCLENBQUM7WUFDcEMsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO1NBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBRUosNEVBQTRFO1FBQzVFLFlBQVksQ0FBQyxlQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ25ELE9BQU8sRUFBRSxDQUFDLG1DQUFtQyxDQUFDO1lBQzlDLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNqQixDQUFDLENBQUMsQ0FBQztRQUVKLDJEQUEyRDtRQUMzRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNsRCxXQUFXLEVBQUUsY0FBYztZQUMzQixXQUFXLEVBQUUsNENBQTRDO1NBQzFELENBQUMsQ0FBQztRQUVILGtEQUFrRDtRQUNsRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZDLDhEQUE4RDtRQUM5RCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRTtZQUN6QyxJQUFJLEVBQUUsTUFBTTtZQUNaLFFBQVEsRUFBRTtnQkFDUixTQUFTLEVBQUUsRUFBRTtnQkFDYixVQUFVLEVBQUUsQ0FBQzthQUNkO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ2YsS0FBSyxFQUFFLEdBQUcsQ0FBQyxlQUFlO1NBQzNCLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixNQUFNLGlCQUFpQixHQUFHLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXpFLCtCQUErQjtRQUUvQixrQkFBa0I7UUFDbEIsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFcEQsaUhBQWlIO1FBQ2pILE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0QsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtRQUUxRSxpREFBaUQ7UUFDakQsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUU7WUFDakQsY0FBYyxFQUFFLElBQUk7U0FDckIsQ0FBQyxDQUFDO1FBRUgscUVBQXFFO1FBQ3JFLE1BQU0sa0JBQWtCLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoRSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFO1lBQ3JELGNBQWMsRUFBRSxJQUFJO1NBQ3JCLENBQUMsQ0FBQztRQUVILGtIQUFrSDtRQUNsSCxNQUFNLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMxRSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpREFBaUQ7SUFDNUcsQ0FBQztDQUNGO0FBdEZELG9DQXNGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcblxuZXhwb3J0IGNsYXNzIFRvZG9BcGlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBEeW5hbW9EQiB0YWJsZSB3aXRoIGNvbXBvc2l0ZSBwcmltYXJ5IGtleXM6IHVzZXJJZCAoUGFydGl0aW9uIEtleSkgYW5kIHRvZG9JZCAoU29ydCBLZXkpXG4gICAgY29uc3QgdGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1RvZG9UYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RvZG9JZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGEgTGFtYmRhIGZ1bmN0aW9uLCB0aGUgY29kZSBpcyBsb2NhdGVkIGluIHRoZSBsYW1iZGEvZGlyZWN0b3J5LCBhbmQgdGhlIGVudHJ5IGZ1bmN0aW9uIGlzIGluZGV4LmhhbmRsZXJcbiAgICBjb25zdCB0b2RvRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdUb2RvRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCwgIFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGEnKSxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudGluZyByZWFkIGFuZCB3cml0ZSBwZXJtaXNzaW9ucyB0byBMYW1iZGEgZnVuY3Rpb25zIG9uIER5bmFtb0RCIHRhYmxlc1xuICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0b2RvRnVuY3Rpb24pO1xuXG4gICAgLy8gQWRkIHBlcm1pc3Npb24gdG8gY2FsbCBBbWF6b24gVHJhbnNsYXRlIGZvciBMYW1iZGEgZnVuY3Rpb25zXG4gICAgdG9kb0Z1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbJ3RyYW5zbGF0ZTpUcmFuc2xhdGVUZXh0J10sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEFkZCBwZXJtaXNzaW9uIHRvIGNhbGwgQW1hem9uIENvbXByZWhlbmQgZm9yIGF1dG9tYXRpYyBsYW5ndWFnZSBkZXRlY3Rpb25cbiAgICB0b2RvRnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IFsnY29tcHJlaGVuZDpEZXRlY3REb21pbmFudExhbmd1YWdlJ10sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIENyZWF0ZSBBUEkgR2F0ZXdheSBSRVNUIEFQSSBhbmQgaW50ZWdyYXRlIGl0IHdpdGggTGFtYmRhXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnVG9kb0FwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnVG9EbyBTZXJ2aWNlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBzZXJ2aWNlIHNlcnZlcyBhIFRvRG8gbWFuYWdlbWVudCBBUEkuJyxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBBUEkgS2V5IHRvIHByb3RlY3QgUE9TVCBhbmQgUFVUIHJlcXVlc3RzXG4gICAgY29uc3QgYXBpS2V5ID0gYXBpLmFkZEFwaUtleSgnQXBpS2V5Jyk7XG5cbiAgICAvLyBEZWZpbmUgYSB1c2FnZSBwbGFuIGFuZCBhc3NvY2lhdGUgdGhlIEFQSSBLZXkgd2l0aCB0aGUgcGxhblxuICAgIGNvbnN0IHBsYW4gPSBhcGkuYWRkVXNhZ2VQbGFuKCdVc2FnZVBsYW4nLCB7XG4gICAgICBuYW1lOiAnRWFzeScsXG4gICAgICB0aHJvdHRsZToge1xuICAgICAgICByYXRlTGltaXQ6IDEwLFxuICAgICAgICBidXJzdExpbWl0OiAyLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHBsYW4uYWRkQXBpS2V5KGFwaUtleSk7XG4gICAgcGxhbi5hZGRBcGlTdGFnZSh7XG4gICAgICBzdGFnZTogYXBpLmRlcGxveW1lbnRTdGFnZSxcbiAgICB9KTtcblxuICAgIC8vIERlZmluZSBMYW1iZGEgSW50ZWdyYXRpb25cbiAgICBjb25zdCBsYW1iZGFJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRvZG9GdW5jdGlvbik7XG5cbiAgICAvLyBEZWZpbmUgcmVzb3VyY2VzIGFuZCBtZXRob2RzXG5cbiAgICAvLyAvdG9kb3MgcmVzb3VyY2VcbiAgICBjb25zdCB0b2Rvc1Jlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3RvZG9zJyk7XG4gICAgXG4gICAgLy8gR0VUIC90b2Rvcy97dXNlcklkfTogUXVlcnkgYWxsIHRvLWRvIGl0ZW1zIG9mIHRoZSBzcGVjaWZpZWQgdXNlciwgb3B0aW9uYWxseSB3aXRoIGEgcXVlcnkgc3RyaW5nIGZvciBmaWx0ZXJpbmdcbiAgICBjb25zdCB1c2VyUmVzb3VyY2UgPSB0b2Rvc1Jlc291cmNlLmFkZFJlc291cmNlKCd7dXNlcklkfScpO1xuICAgIHVzZXJSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIGxhbWJkYUludGVncmF0aW9uKTsgLy8gQVBJIEtleSBub3QgbmVlZCBoZXJlXG5cbiAgICAvLyBQT1NUIC90b2RvczogQWRkIHRvLWRvIGxpc3QgKHJlcXVpcmVzIEFQSSBLZXkpXG4gICAgdG9kb3NSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBsYW1iZGFJbnRlZ3JhdGlvbiwge1xuICAgICAgYXBpS2V5UmVxdWlyZWQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBQVVQgL3RvZG9zL3t1c2VySWR9L3t0b2RvSWR9OiBVcGRhdGUgdG8tZG8gbGlzdCAocmVxdWlyZXMgQVBJIEtleSlcbiAgICBjb25zdCBzaW5nbGVUb2RvUmVzb3VyY2UgPSB1c2VyUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3t0b2RvSWR9Jyk7XG4gICAgc2luZ2xlVG9kb1Jlc291cmNlLmFkZE1ldGhvZCgnUFVUJywgbGFtYmRhSW50ZWdyYXRpb24sIHtcbiAgICAgIGFwaUtleVJlcXVpcmVkOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gR0VUIC90b2Rvcy97dXNlcklkfS97dG9kb0lkfS90cmFuc2xhdGlvbjogUmV0dXJuIHRoZSB0cmFuc2xhdGlvbiByZXN1bHQgb2YgdGhlIHNwZWNpZmllZCB0by1kbyBpdGVtIGRlc2NyaXB0aW9uXG4gICAgY29uc3QgdHJhbnNsYXRpb25SZXNvdXJjZSA9IHNpbmdsZVRvZG9SZXNvdXJjZS5hZGRSZXNvdXJjZSgndHJhbnNsYXRpb24nKTtcbiAgICB0cmFuc2xhdGlvblJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbGFtYmRhSW50ZWdyYXRpb24pOyAvLyBUcmFuc2xhdGlvbiBpbnRlcmZhY2UgZG9lcyBub3QgcmVxdWlyZSBBUEkgS2V5XG4gIH1cbn1cblxuIl19