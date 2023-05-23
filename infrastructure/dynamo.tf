resource "aws_dynamodb_table" "warmane_dynamo_table" {
  name         = "${terraform.workspace}_warmane_matches"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "document_type"
  server_side_encryption {
    enabled = true
  }
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "document_type"
    type = "S"
  }
}
