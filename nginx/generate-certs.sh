#!/bin/bash
# Generate self-signed TLS certificates for Nginx HTTPS demo (B1)
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/nginx-selfsigned.key \
  -out nginx/certs/nginx-selfsigned.crt \
  -subj "/C=SV/ST=La Libertad/L=Santa Tecla/O=ITCA-FEPADE/CN=itcago.local"
echo "Certificados TLS autofirmados generados en nginx/certs/"
