resource "aws_sqs_queue" "crawl_queue" {
  name                       = "${terraform.workspace}_warmane_crawler_queue"
  max_message_size           = 2048
  message_retention_seconds  = 86400
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 180
  sqs_managed_sse_enabled    = true
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.warmane_crawler_queue_dlq.arn
    maxReceiveCount     = 4
  })
}

resource "aws_sqs_queue" "warmane_crawler_queue_dlq" {
  name = "${terraform.workspace}_warmane_crawler_queue_dlq"
}

resource "aws_sqs_queue_redrive_allow_policy" "crawl_queue" {
  queue_url = aws_sqs_queue.crawl_queue.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [aws_sqs_queue.crawl_queue.arn]
  })
}
