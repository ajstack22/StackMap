#!/bin/bash
# Test commands for the Sync API

echo "🧪 Testing StackMap Sync API..."

# Test creating a sync group
echo "1. Testing CREATE endpoint..."
curl -X POST https://stackmap.app/api/sync/create.php \
  -H "Content-Type: application/json" \
  -d '{
    "sync_id": "test-sync-12345",
    "encrypted_blob": "encrypted_test_data_here",
    "recovery_salt": "test_salt_16_bytes"
  }'

echo -e "\n\n2. Testing PUSH endpoint..."
curl -X POST https://stackmap.app/api/sync/push.php \
  -H "Content-Type: application/json" \
  -d '{
    "sync_id": "test-sync-12345",
    "device_id": "test-device-001",
    "device_name": "Test iPhone",
    "encrypted_blob": "updated_encrypted_data_v2"
  }'

echo -e "\n\n3. Testing PULL endpoint..."
curl "https://stackmap.app/api/sync/pull.php?sync_id=test-sync-12345&device_id=test-device-001"

echo -e "\n\n✅ API tests complete!"