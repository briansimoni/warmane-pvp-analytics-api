variable "artifact_file" {
  type    = string
  default = "briansimoni/warmane-pvp-analytics-api/v2.zip"
}

variable "domain_name" {
  type        = map(string)
  description = "linked to the workspace e.g. (dev/prod) and can be used to prefix resources names"
}
