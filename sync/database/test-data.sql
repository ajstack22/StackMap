-- Test data to verify database setup
-- Run this after setup.sql to ensure everything is working

-- Insert test sync group
INSERT INTO sync_data (sync_id, encrypted_blob, recovery_salt, version, device_count)
VALUES (
  'test-sync-123e4567-e89b-12d3-a456-426614174000',
  'encrypted_test_data_blob_placeholder',
  'test_salt_16bytes',
  1,
  1
);

-- Insert test device
INSERT INTO sync_devices (device_id, sync_id, device_name)
VALUES (
  'test-device-123e4567-e89b-12d3-a456-426614174001',
  'test-sync-123e4567-e89b-12d3-a456-426614174000',
  'Test iPhone 13'
);

-- Insert test metrics
INSERT INTO sync_metrics (event, metadata)
VALUES 
  ('sync_created', '{"device_count": 1}'),
  ('sync_completed', '{"duration_ms": 1250, "data_size": 4096}');

-- Verify data
SELECT 'sync_data table:' as '';
SELECT * FROM sync_data;

SELECT 'sync_devices table:' as '';
SELECT * FROM sync_devices;

SELECT 'sync_metrics table:' as '';
SELECT * FROM sync_metrics;

-- Clean up test data (uncomment to run)
-- DELETE FROM sync_data WHERE sync_id LIKE 'test-%';
-- DELETE FROM sync_metrics WHERE metadata LIKE '%test%';