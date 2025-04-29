#!/bin/bash

# Run arp-scan
scan_results=$(sudo arp-scan --interface=eno01 --localnet)

# Extract lines with valid MACs
echo "$scan_results" | grep -E "([0-9a-f]{2}:){5}[0-9a-f]{2}" | while read -r line; do
  ip=$(echo "$line" | awk '{print $1}')
  mac=$(echo "$line" | awk '{print $2}')
  vendor=$(echo "$line" | cut -f3-)

  # Try to resolve hostname
  name=$(nslookup $ip 2>/dev/null | awk -F'= ' '/name =/ {print $2}' | sed 's/\.$//')
  [ -z "$name" ] && name="Unknown"

  echo "📡 Found device: $ip ($mac, $name, $vendor)"

  # Build JSON payload
  json=$(jq -n \
    --arg ip "$ip" \
    --arg mac "$mac" \
    --arg name "$name" \
    --arg vendor "$vendor" \
    '{ip: $ip, mac: $mac, name: $name, vendor: $vendor}')

  # Post to API endpoint
  curl -s -X POST http://192.168.1.26:3000/api/devices \
    -H "Content-Type: application/json" \
    -d "$json"
    #this is file is for samba to add devices use 
# curl -o ~/Desktop/new.sh http://192.168.1.26:3000/scripts/new.sh
# bash new.sh
done
