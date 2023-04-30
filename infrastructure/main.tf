terraform {
  cloud {
    organization = "simoni-enterprises"

    workspaces {
      # name = "warmane-pvp-analytics-api"
      tags = ["warmane_api"]
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.57"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}


locals {
  openapi_spec                               = yamldecode(file("./openapi.yaml"))
  warmane_analytics_api_v2_main_function_arn = aws_lambda_function.warmane_analytics_api_v2_main_function.arn
}

data "template_file" "openapi_template" {
  template = file("./openapi.yaml")


  vars = {
    warmane_analytics_api_v2_main_function_arn = "${aws_lambda_function.warmane_analytics_api_v2_main_function.arn}"
    aws_region                                 = "us-east-1"
  }

}

