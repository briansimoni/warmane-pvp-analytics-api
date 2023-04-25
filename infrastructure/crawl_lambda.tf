resource "aws_cloudwatch_log_group" "crawler_log_group" {
  name = "/aws/lambda/${aws_lambda_function.warmane_analytics_api_v2_crawler_function.function_name}"

  retention_in_days = 30
}

resource "aws_iam_role" "crawler_lambda_role" {
  name = "crawler_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
    ]
  })
}


// TODO: reduce privilege here
resource "aws_iam_role_policy_attachment" "crawler_lambda_sqs_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
  role       = aws_iam_role.crawler_lambda_role.name
}

resource "aws_lambda_event_source_mapping" "crawler_mapping" {
  event_source_arn = aws_sqs_queue.crawl_queue.arn
  function_name    = aws_lambda_function.warmane_analytics_api_v2_crawler_function.function_name
  batch_size       = 10
}

resource "aws_lambda_function" "warmane_analytics_api_v2_crawler_function" {
  function_name = "warmane_analytics_api_v2_crawler_function"

  architectures = ["arm64"]

  s3_bucket         = "simoni-enterprises-artifacts"
  s3_key            = data.aws_s3_object.lambda_bundle.key
  s3_object_version = data.aws_s3_object.lambda_bundle.version_id

  source_code_hash = data.aws_s3_object.lambda_bundle.etag

  runtime = "nodejs18.x"
  timeout = 180
  handler = "main.sqsHandler"

  role = aws_iam_role.crawler_lambda_role.arn
}
