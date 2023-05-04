# warmane-pvp-analytics-api

### Running locally

`npm install`
`npm start`

### Useful

`aws logs tail /aws/lambda/warmane_analytics_api_v2_main_function --follow`

### Deployment

Right now, changes to the `v2` branch will be deployed automatically to the dev environment. If that is successful, it will automatically deploy to prod.

If you want to manually trigger a deployment to the dev environment, go to the [github action](https://github.com/briansimoni/warmane-pvp-analytics-api/actions/workflows/github-actions.yml) and click run workflow.
