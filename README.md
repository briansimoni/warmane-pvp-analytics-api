# warmane-pvp-analytics-api

### Running locally

`npm install`
`npm start`

It will run two local servers. One will simulate API Gateway and the corresponding Lambda. The other will simulate the Lambda listening for SQS events. If you want to simulate queuing up a message, send a request with an HTTP body. Middleware will take care of the transformation into the `SQSEvent` data type.

Example:

```
curl localhost:4001 \
-X POST \
-d '{"character": "Dumpster", "realm": "Blackrock"}'
```

### Useful

`aws logs tail /aws/lambda/warmane_analytics_api_v2_main_function --follow`

### Deployment

Right now, changes to the `v2` branch will be deployed automatically to the dev environment. If that is successful, it will automatically deploy to prod.

If you want to manually trigger a deployment to the dev environment, go to the [github action](https://github.com/briansimoni/warmane-pvp-analytics-api/actions/workflows/github-actions.yml) and click run workflow.
