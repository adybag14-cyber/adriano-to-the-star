whi# Oracle Cloud Ampere Auto-Retry Stack

This directory contains the Terraform configuration and retry script to acquire an **Always Free Oracle Cloud Ampere A1 Compute Instance** (4 OCPUs, 24GB RAM).

## Prerequisites

1.  **Terraform** installed.
2.  **Oracle Cloud Infrastructure (OCI) Account**.
3.  **API Key** generated for your user.

## Configuration

1.  Navigate to `terraform/`.
2.  Create a `terraform.tfvars` file with your details:

```hcl
tenancy_ocid     = "ocid1.tenancy.oc1..aaaa..."
user_ocid        = "ocid1.user.oc1..aaaa..."
fingerprint      = "xx:xx:xx..."
private_key_path = "/path/to/your/oci_api_key.pem"
region           = "us-phoenix-1"
compartment_ocid = "ocid1.compartment.oc1..aaaa..."
availability_domain = "Uocm:PHX-AD-1"
image_ocid       = "ocid1.image.oc1.phx.aaaa..." # Canonical Ubuntu 22.04 aarch64
ssh_public_key_path = "/path/to/id_rsa.pub"
```

## Running the Job

Execute the bash script from the `oracle-deploy/` directory:

```bash
cd oracle-deploy/terraform
terraform init
cd ..
./run-terraform-retry.sh
```

or on Windows PowerShell:

```powershell
# You can run the loop manually
while ($true) {
    terraform apply -auto-approve
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 60
}
```

The script will loop indefinitely until Oracle creates the instance (i.e., when capacity becomes available).
