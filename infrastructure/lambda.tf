resource "aws_cloudwatch_log_group" "hello_world" {
  name = "/aws/lambda/${aws_lambda_function.warmane_analytics_api_v2_main_function.function_name}"

  retention_in_days = 30
}

resource "aws_iam_role" "lambda_exec" {
  name = "warmane_v2_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.warmane_analytics_api_v2_main_function.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

resource "aws_lambda_function" "warmane_analytics_api_v2_main_function" {
  function_name = "warmane_analytics_api_v2_main_function"

  architectures = ["arm64"]

  s3_bucket         = "simoni-enterprises-artifacts"
  s3_key            = data.aws_s3_object.lambda_bundle.key
  s3_object_version = data.aws_s3_object.lambda_bundle.version_id

  source_code_hash = data.aws_s3_object.lambda_bundle.etag

  runtime = "nodejs18.x"
  timeout = 10
  handler = "main.handler"

  role = aws_iam_role.lambda_exec.arn
}

data "aws_s3_object" "lambda_bundle" {
  bucket = "simoni-enterprises-artifacts"
  key    = var.artifact_file
}

variable "artifact_file" {
  type    = string
  default = "briansimoni/warmane-pvp-analytics-api/v2.zip"
}
