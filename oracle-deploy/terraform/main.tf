terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0.0"
    }
  }
}

provider "oci" {
  region = "uk-london-1"
}

# HARDCODED VARIABLES
locals {
  compartment_id = "ocid1.tenancy.oc1..aaaaaaaan3fwo3yruzh7ucpbnlw4rhuytctzjh42gobfniscdda4cotv5lwq"
  image_id       = "ocid1.image.oc1.uk-london-1.aaaaaaaaw2hy6tmpi4k2mjbuj3japjqiw32fbaz6ffhglzkwpdy4pholqynq"
  
  # IMPORTANT: SSH Key from User
  ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCbhQnvCisZtYgt6hceo+toD3M9Av6D629QGV6EwXN2IjMNgsxTMZX1w/ttHO0sQa8QWmvxGoJpUROpG1RsuEf67kp+T2wyq9wiN+XL3+J1klD0C6nmeW5GQ4vMSlPk+k0OGqIoaWhywUaZrON0cR/hpABAnvABlAq1hie0Xtcvo/1SSJ6UMVvjz3wnkrPNriDkjd93UAGDxI/ciN6xIVkSxzBQQoznFLbhW6DjKeF/WQ4SiaMUR8wkDRXBTnZErffpTVpX3lKkITj7qVVMR+ZniDF1TmtbO7yUT8uUzK+TGG5Tmuh8Bb4I7lAhPnG+mAl2qgGo+ZhnuXeNKQAN2WWT ssh-key-2025-12-08"
  availability_domain = "YqAQ:UK-LONDON-1-AD-1"
}

resource "oci_core_vcn" "starsector_vcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = local.compartment_id
  display_name   = "starsector-vcn"
  dns_label      = "starsector"
}

resource "oci_core_subnet" "starsector_subnet" {
  cidr_block        = "10.0.0.0/24"
  compartment_id    = local.compartment_id
  vcn_id            = oci_core_vcn.starsector_vcn.id
  display_name      = "starsector-subnet"
  dns_label         = "starsector"
  security_list_ids = [oci_core_vcn.starsector_vcn.default_security_list_id]
  route_table_id    = oci_core_vcn.starsector_vcn.default_route_table_id
}

resource "oci_core_internet_gateway" "starsector_ig" {
  compartment_id = local.compartment_id
  display_name   = "starsector-ig"
  vcn_id         = oci_core_vcn.starsector_vcn.id
  enabled        = true
}

resource "oci_core_default_route_table" "starsector_rt" {
  manage_default_resource_id = oci_core_vcn.starsector_vcn.default_route_table_id
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.starsector_ig.id
  }
}

# HACK: Use null_resource to run infinite retry loop
resource "null_resource" "retry_instance" {
  triggers = {
    # Always run (can add timestamp here)
    always_run = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = "chmod +x ${path.module}/retry_script.sh && ${path.module}/retry_script.sh ${oci_core_subnet.starsector_subnet.id}"
    environment = {
      TF_VAR_ssh_key = local.ssh_public_key
    }
  }
}

output "subnet_id" {
  value = oci_core_subnet.starsector_subnet.id
}
# Cannot output Public IP immediately as it's created by script asynchronously
