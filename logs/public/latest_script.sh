#!/bin/bash

SCRIPT_URL="https://192.168.1.102/latest_script.sh"
INSTALL_PATH="~/Desktop/lastest_script.sh"

# Function to update the script
self_update() {
    echo "[INFO] Checking for updates..."
    TMP_PATH="/tmp/install_new.sh"

    # Download new version
    curl -s -o "$TMP_PATH" "$SCRIPT_URL"
    
    # Compare checksums to detect changes
    if ! cmp -s "$INSTALL_PATH" "$TMP_PATH"; then
        echo "[INFO] New version detected. Updating..."
        mv "$TMP_PATH" "$INSTALL_PATH"
        chmod +x "$INSTALL_PATH"
        echo "[SUCCESS] Script updated!"
        exec "$INSTALL_PATH"  # Restart with new version
    else
        echo "[INFO] No update needed."
        rm "$TMP_PATH"
    fi
}

# Run self-update before executing main tasks
self_update

# ✅ Run your main script logic here
echo "[INFO] Running main script tasks..."
