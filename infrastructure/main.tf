terraform {
  cloud {
    organization = "simoni-enterprises"
    workspaces {
      name = "warmane-pvp-analytics-api"
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
  openapi_spec = yamldecode(file("./openapi.yaml"))
}


resource "aws_api_gateway_rest_api" "rest_api" {
  name = "warmane_pvp_analytics_v2_api"
  body = yamlencode(local.openapi_spec)
}

