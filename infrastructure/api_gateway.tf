resource "aws_api_gateway_rest_api" "rest_api" {
  name = "warmane_pvp_analytics_v2_api"
  #body = yamlencode(local.openapi_spec)
  body = data.template_file.openapi_template.rendered

}

resource "aws_api_gateway_deployment" "main_deployment" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.rest_api.body))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main_stage" {
  deployment_id = aws_api_gateway_deployment.main_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  stage_name    = "main_stage"
}
