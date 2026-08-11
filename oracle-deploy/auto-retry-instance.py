"""
Oracle Cloud Instance Auto-Retry Script
Attempts to create an instance every 5 minutes until successful
"""

import oci
import time
import sys
from datetime import datetime

# ============================================
# CONFIGURATION
# ============================================
# Update these paths for your environment (e.g., Termux)
# On Termux, you might store keys in /data/data/com.termux/files/home/ or just ./
COMPARTMENT_ID = "ocid1.tenancy.oc1..aaaaaaaan3fwo3yruzh7ucpbnlw4rhuytctzjh42gobfniscdda4cotv5lwq"
AVAILABILITY_DOMAINS = ["YqAQ:UK-LONDON-1-AD-1", "YqAQ:UK-LONDON-1-AD-2"]  # Try both ADs
IMAGE_ID = "ocid1.image.oc1.uk-london-1.aaaaaaaaw2hy6tmpi4k2mjbuj3japjqiw32fbaz6ffhglzkwpdy4pholqynq"
SHAPE = "VM.Standard.A1.Flex"
OCPUS = 4
MEMORY_GB = 24
INSTANCE_NAME = "starsector-server"
# Default to looking in current directory if not specified
# Default to looking in current directory if not specified
SSH_KEY_FILE = r"C:\Users\adyba\Downloads\ssh-key-2025-12-08.key.pub" 
RETRY_INTERVAL_SECONDS = 5  # 5 seconds
VCN_CIDR = "10.0.0.0/16"
SUBNET_CIDR = "10.0.0.0/24"

# ============================================
# SCRIPT
# ============================================

def create_vcn_and_subnet(virtual_network_client, compartment_id):
    """Create VCN and public subnet if they don't exist"""
    print("Checking for existing VCN...")
    
    # Check for existing VCN
    vcns = virtual_network_client.list_vcns(compartment_id).data
    vcn = next((v for v in vcns if v.display_name == "starsector-vcn" and v.lifecycle_state == "AVAILABLE"), None)
    
    if not vcn:
        print("Creating VCN...")
        vcn_details = oci.core.models.CreateVcnDetails(
            compartment_id=compartment_id,
            display_name="starsector-vcn",
            cidr_block=VCN_CIDR
        )
        vcn = virtual_network_client.create_vcn(vcn_details).data
        # Wait for VCN to be available
        vcn = oci.wait_until(virtual_network_client, virtual_network_client.get_vcn(vcn.id), 'lifecycle_state', 'AVAILABLE').data
        print(f"VCN created: {vcn.id}")
        
        # Create Internet Gateway
        print("Creating Internet Gateway...")
        ig_details = oci.core.models.CreateInternetGatewayDetails(
            compartment_id=compartment_id,
            vcn_id=vcn.id,
            display_name="starsector-ig",
            is_enabled=True
        )
        ig = virtual_network_client.create_internet_gateway(ig_details).data
        
        # Update route table to use internet gateway
        print("Updating route table...")
        rt = virtual_network_client.get_route_table(vcn.default_route_table_id).data
        virtual_network_client.update_route_table(
            rt.id,
            oci.core.models.UpdateRouteTableDetails(
                route_rules=[
                    oci.core.models.RouteRule(
                        destination="0.0.0.0/0",
                        destination_type="CIDR_BLOCK",
                        network_entity_id=ig.id
                    )
                ]
            )
        )
        
        # Update security list to allow ingress on port 8080
        print("Updating security list...")
        sl = virtual_network_client.get_security_list(vcn.default_security_list_id).data
        ingress_rules = list(sl.ingress_security_rules) if sl.ingress_security_rules else []
        ingress_rules.append(
            oci.core.models.IngressSecurityRule(
                protocol="6",  # TCP
                source="0.0.0.0/0",
                tcp_options=oci.core.models.TcpOptions(
                    destination_port_range=oci.core.models.PortRange(min=8080, max=8080)
                )
            )
        )
        ingress_rules.append(
            oci.core.models.IngressSecurityRule(
                protocol="6",  # TCP
                source="0.0.0.0/0",
                tcp_options=oci.core.models.TcpOptions(
                    destination_port_range=oci.core.models.PortRange(min=22, max=22)
                )
            )
        )
        virtual_network_client.update_security_list(
            sl.id,
            oci.core.models.UpdateSecurityListDetails(ingress_security_rules=ingress_rules)
        )
    else:
        print(f"Using existing VCN: {vcn.id}")
    
    # Check for existing subnet
    subnets = virtual_network_client.list_subnets(compartment_id, vcn_id=vcn.id).data
    subnet = next((s for s in subnets if s.display_name == "starsector-subnet" and s.lifecycle_state == "AVAILABLE"), None)
    
    if not subnet:
        print("Creating public subnet...")
        subnet_details = oci.core.models.CreateSubnetDetails(
            compartment_id=compartment_id,
            vcn_id=vcn.id,
            display_name="starsector-subnet",
            cidr_block=SUBNET_CIDR,
            prohibit_public_ip_on_vnic=False  # Allow public IPs
        )
        subnet = virtual_network_client.create_subnet(subnet_details).data
        subnet = oci.wait_until(virtual_network_client, virtual_network_client.get_subnet(subnet.id), 'lifecycle_state', 'AVAILABLE').data
        print(f"Subnet created: {subnet.id}")
    else:
        print(f"Using existing subnet: {subnet.id}")
    
    return vcn, subnet


def create_instance(compute_client, compartment_id, availability_domain, subnet_id, ssh_key):
    """Try to create the compute instance"""
    print(f"Attempting to create instance in {availability_domain}...")
    
    instance_details = oci.core.models.LaunchInstanceDetails(
        compartment_id=compartment_id,
        availability_domain=availability_domain,
        display_name=INSTANCE_NAME,
        shape=SHAPE,
        shape_config=oci.core.models.LaunchInstanceShapeConfigDetails(
            ocpus=OCPUS,
            memory_in_gbs=MEMORY_GB
        ),
        source_details=oci.core.models.InstanceSourceViaImageDetails(
            image_id=IMAGE_ID,
            source_type="image"
        ),
        create_vnic_details=oci.core.models.CreateVnicDetails(
            subnet_id=subnet_id,
            assign_public_ip=True
        ),
        metadata={
            "ssh_authorized_keys": ssh_key
        }
    )
    
    instance = compute_client.launch_instance(instance_details).data
    return instance


def main():
    print("=" * 50)
    print("Oracle Cloud Instance Auto-Retry Script (Termux Optimized)")
    print("=" * 50)
    print(f"\nConfiguration:")
    print(f"  Shape: {SHAPE} ({OCPUS} OCPUs, {MEMORY_GB} GB)")
    print(f"  Retry Interval: {RETRY_INTERVAL_SECONDS} seconds")
    print(f"  Availability Domains: {AVAILABILITY_DOMAINS}")
    print("\nPress Ctrl+C to stop at any time.\n")
    print("=" * 50)
    
    # Load SSH key
    try:
        import os
        # Only use default path if relative path doesn't exist
        key_path = SSH_KEY_FILE
        if not os.path.exists(key_path):
             # Fallback check for common termux path or let user know
             print(f"Warning: SSH Key not found at {key_path}")
             key_path = input("Enter path to SSH public key (e.g. id_rsa.pub): ").strip()

        with open(key_path, 'r') as f:
            ssh_key = f.read().strip()
        print(f"SSH key loaded from {key_path}")
    except Exception as e:
        print(f"Error loading SSH key: {e}")
        sys.exit(1)
    
    # Initialize OCI clients
    # Ensure config exists at default location ~/.oci/config or pass explicit path
    try:
        config = oci.config.from_file()
        compute_client = oci.core.ComputeClient(config)
        virtual_network_client = oci.core.VirtualNetworkClient(config)
    except Exception as e:
        print(f"Error loading OCI config: {e}")
        print("Make sure you have copied your OCI config to ~/.oci/config")
        sys.exit(1)
    
    # Create VCN and subnet
    try:
        vcn, subnet = create_vcn_and_subnet(virtual_network_client, COMPARTMENT_ID)
    except Exception as e:
        print(f"Error getting network resources: {e}")
        sys.exit(1)
    
    attempt = 0
    ad_index = 0
    
    while True:
        attempt += 1
        ad = AVAILABILITY_DOMAINS[ad_index % len(AVAILABILITY_DOMAINS)]
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"\n{'=' * 50}")
        print(f"Attempt #{attempt} - {timestamp}")
        print(f"Trying availability domain: {ad}")
        print("=" * 50)
        
        try:
            instance = create_instance(compute_client, COMPARTMENT_ID, ad, subnet.id, ssh_key)
            
            print(f"\n{'=' * 50}")
            print("SUCCESS! Instance creation started!")
            print("=" * 50)
            print(f"\nInstance ID: {instance.id}")
            print(f"Instance Name: {instance.display_name}")
            print(f"State: {instance.lifecycle_state}")
            print("\nWaiting for instance to be RUNNING...")
            
            # Wait for instance to be running
            instance = oci.wait_until(
                compute_client, 
                compute_client.get_instance(instance.id), 
                'lifecycle_state', 
                'RUNNING',
                max_wait_seconds=600
            ).data
            
            # Get VNIC to find public IP
            vnic_attachments = compute_client.list_vnic_attachments(COMPARTMENT_ID, instance_id=instance.id).data
            if vnic_attachments:
                vnic = virtual_network_client.get_vnic(vnic_attachments[0].vnic_id).data
                print(f"\nPublic IP: {vnic.public_ip}")
                print(f"\nConnect with: ssh -i your-key.pem ubuntu@{vnic.public_ip}")
            
            print("\nScript completed successfully!")
            break
            
        except oci.exceptions.ServiceError as e:
            # Enhanced Error Handling
            print(f"\n--- OCI API Error ---")
            print(f"Status: {e.status}")
            print(f"Code: {e.code}")
            print(f"Message: {e.message}")
            print(f"Request ID: {e.request_id}")

            if e.status == 500:
                 print("-> Internal Server Error. Retrying might fix this.")
            elif e.status == 429:
                 print("-> Too Many Requests. Adding extra delay.")
                 time.sleep(30) # Extra wait
            elif e.status == 401 or e.status == 404:
                 print("-> Auth/Not Found Error. Check your configuration!")
                 # We probably shouldn't blindly retry auth errors forever, maybe prompt user?
                 # But keeping retry loop for now as requested.

            if "Out of capacity" in str(e.message) or "out of host capacity" in str(e.message).lower():
                print(f"-> Out of capacity in {ad}")
                ad_index += 1  # Try next AD
            
            print(f"\nWill retry in {RETRY_INTERVAL_SECONDS} seconds...")
            time.sleep(RETRY_INTERVAL_SECONDS)
            
        except Exception as e:
            import traceback
            print(f"\n--- Unexpected Error ---")
            print(f"Type: {type(e).__name__}")
            print(f"Error: {e}")
            traceback.print_exc()
            
            print(f"\nWill retry in {RETRY_INTERVAL_SECONDS} seconds...")
            time.sleep(RETRY_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
