data "aws_route53_zone" "warmane_dot_dog" {
  name         = "warmane.dog"
  private_zone = false
}

resource "aws_api_gateway_domain_name" "api" {
  domain_name              = var.domain_name[terraform.workspace]
  regional_certificate_arn = aws_acm_certificate.api.arn
  security_policy          = "TLS_1_2"
  depends_on               = [aws_acm_certificate_validation.api]

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_route53_record" "api" {
  name    = aws_api_gateway_domain_name.api.domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.warmane_dot_dog.zone_id

  alias {
    name                   = aws_api_gateway_domain_name.api.regional_domain_name
    zone_id                = aws_api_gateway_domain_name.api.regional_zone_id
    evaluate_target_health = false
  }
}


resource "aws_api_gateway_base_path_mapping" "api" {
  api_id      = aws_api_gateway_rest_api.warmane_api_gateway.id
  domain_name = aws_api_gateway_domain_name.api.id
  stage_name  = aws_api_gateway_stage.main_stage.stage_name
}
