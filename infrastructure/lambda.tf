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

resource "aws_lambda_function" "warmane_analytics_api_v2_main_function" {
  function_name = "warmane_analytics_api_v2_main_function"

  s3_bucket = aws_s3_bucket.code_artifact_bucket.id
  s3_key    = aws_s3_object.lambda_code_artifact.key

  runtime = "nodejs18.x"
  handler = "main.handler"

  source_code_hash = data.archive_file.main_lambda_code.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
}
