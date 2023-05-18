resource "aws_api_gateway_rest_api" "warmane_api_gateway" {
  name = "${terraform.workspace}_warmane_pvp_analytics_v2_api"
}

resource "aws_api_gateway_resource" "proxy_resource" {
  rest_api_id = aws_api_gateway_rest_api.warmane_api_gateway.id
  parent_id   = aws_api_gateway_rest_api.warmane_api_gateway.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.warmane_api_gateway.id
  resource_id   = aws_api_gateway_resource.proxy_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.warmane_api_gateway.id
  resource_id             = aws_api_gateway_resource.proxy_resource.id
  http_method             = aws_api_gateway_method.proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.warmane_analytics_api_v2_main_function.invoke_arn
}

resource "aws_api_gateway_deployment" "default_deployment" {
  depends_on  = [aws_api_gateway_integration.proxy_integration]
  rest_api_id = aws_api_gateway_rest_api.warmane_api_gateway.id
}

resource "aws_api_gateway_stage" "default_stage" {
  deployment_id = aws_api_gateway_deployment.default_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.warmane_api_gateway.id
  stage_name    = terraform.workspace
}

