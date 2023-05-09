resource "aws_cloudwatch_log_group" "crawler_log_group" {
  name = "/aws/lambda/${aws_lambda_function.warmane_analytics_api_v2_crawler_function.function_name}"

  retention_in_days = 30
}

resource "aws_iam_role" "crawler_lambda_role" {
  name = "${terraform.workspace}_crawler_lambda_role"

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

resource "aws_iam_policy" "crawler_resources_policy" {
  name = "${terraform.workspace}_crawler-lambda-sqs-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:ChangeMessageVisibility",
          "sqs:GetQueueUrl"
        ]
        Effect   = "Allow"
        Resource = "${aws_sqs_queue.crawl_queue.arn}"
      },
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:DeleteItem"
        ]
        Effect   = "Allow"
        Resource = "${aws_dynamodb_table.warmane_dynamo_table.arn}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "crawler_lambda_sqs_policy_attachment" {
  role       = aws_iam_role.crawler_lambda_role.name
  policy_arn = aws_iam_policy.crawler_resources_policy.arn
}

resource "aws_iam_role_policy_attachment" "crawler_lambda_policy" {
  role       = aws_iam_role.crawler_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_event_source_mapping" "crawler_mapping" {
  event_source_arn = aws_sqs_queue.crawl_queue.arn
  function_name    = aws_lambda_function.warmane_analytics_api_v2_crawler_function.function_name
  batch_size       = 10
}

resource "aws_lambda_function" "warmane_analytics_api_v2_crawler_function" {
  function_name = "${terraform.workspace}_warmane_analytics_api_v2_crawler_function"

  architectures = ["arm64"]

  s3_bucket         = "simoni-enterprises-artifacts"
  s3_key            = data.aws_s3_object.lambda_bundle.key
  s3_object_version = data.aws_s3_object.lambda_bundle.version_id

  source_code_hash = data.aws_s3_object.lambda_bundle.etag

  runtime = "nodejs18.x"
  timeout = 180
  handler = "handlers.crawlerHandler"

  role = aws_iam_role.crawler_lambda_role.arn

  environment {
    variables = {
      CRAWLER_SQS_URL = "${aws_sqs_queue.crawl_queue.url}"
      LOG_LEVEL       = var.log_level[terraform.workspace]
      SERVICE_NAME    = "${terraform.workspace}_warmane_api"
    }
  }
}
