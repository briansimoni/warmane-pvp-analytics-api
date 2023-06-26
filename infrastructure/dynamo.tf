resource "aws_dynamodb_table" "warmane_dynamo_table" {
  name         = "${terraform.workspace}_warmane_matches"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "document_key"
  server_side_encryption {
    enabled = true
  }
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "document_key"
    type = "S"
  }

  attribute {
    name = "name"
    type = "S"
  }


  attribute {
    name = "realm"
    type = "S"
  }



  global_secondary_index {
    name            = "CharacterNameIndex"
    hash_key        = "name"
    range_key       = "realm"
    projection_type = "ALL"
  }
}
