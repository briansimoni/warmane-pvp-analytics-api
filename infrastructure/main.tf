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

