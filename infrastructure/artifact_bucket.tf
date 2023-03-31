resource "aws_s3_bucket" "code_artifact_bucket" {
  bucket = "warmane-analytics-api-artifact-bucket"
}

resource "aws_s3_bucket_acl" "bucket_acl" {
  bucket = aws_s3_bucket.code_artifact_bucket.id
  acl    = "private"
}

# data "archive_file" "main_lambda_code" {
#   type = "zip"

#   source_dir  = "${path.module}./build/"
#   output_path = "${path.module}/lambda_code.zip"
# }

resource "aws_s3_object" "lambda_code_artifact" {
  bucket = aws_s3_bucket.code_artifact_bucket.id

  key    = "lambda_code.zip"
  source = "../build.zip"

  etag = filemd5("../build.zip")
}
