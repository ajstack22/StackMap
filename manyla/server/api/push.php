<?php
/**
 * Push Data Endpoint
 * 
 * Updates sync data with new encrypted blob
 * 
 * Method: POST
 * Required fields: sync_id, device_id, encrypted_blob
 * Optional fields: device_name, sync_type
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/validation.php';
require_once __DIR__ . '/utils/rate-limiter.php';
require_once __DIR__ . '/utils/cors.php';

// Initialize headers
initializeHeaders();

// Check request method
validateRequestMethod('POST');

// Check rate limit
checkRateLimit();

// Get JSON input
$input = getJsonInput();
if (!$input) {
    sendError(ERROR_MESSAGES['INVALID_REQUEST']);
}

// Validate required fields
validateRequired($input, ['sync_id', 'device_id', 'encrypted_blob']);

// Extract and validate inputs
$syncId = $input['sync_id'] ?? '';
$deviceId = $input['device_id'] ?? '';
$encryptedBlob = $input['encrypted_blob'] ?? '';
$deviceName = $input['device_name'] ?? null;
$syncType = $input['sync_type'] ?? 'full';

// Validate inputs
if (!validateSyncId($syncId)) {
    sendError(ERROR_MESSAGES['INVALID_SYNC_ID']);
}

if (!validateDeviceId($deviceId)) {
    sendError(ERROR_MESSAGES['INVALID_DEVICE_ID']);
}

if (!validateEncryptedBlob($encryptedBlob)) {
    sendError(ERROR_MESSAGES['INVALID_BLOB']);
}

if (!validateSyncType($syncType)) {
    sendError('Invalid sync type');
}

if ($deviceName !== null && !validateDeviceName($deviceName)) {
    sendError('Invalid device name format');
}

// Sanitize device name
if ($deviceName !== null) {
    $deviceName = sanitizeString($deviceName);
}

try {
    $db = Database::getInstance();
    $db->beginTransaction();
    
    // Check if sync group exists and get current version
    $sql = "SELECT sync_id, version FROM sync_data WHERE sync_id = ? FOR UPDATE";
    $syncData = $db->fetchOne($sql, [$syncId]);
    
    if (!$syncData) {
        $db->rollback();
        sendError(ERROR_MESSAGES['SYNC_NOT_FOUND'], 404);
    }
    
    $currentVersion = (int)$syncData['version'];
    $newVersion = $currentVersion + 1;
    
    // Update sync data
    $sql = "UPDATE sync_data 
            SET encrypted_blob = ?, 
                version = ?, 
                last_modified = CURRENT_TIMESTAMP 
            WHERE sync_id = ?";
    
    $params = [$encryptedBlob, $newVersion, $syncId];
    $affected = $db->update($sql, $params);
    
    if ($affected === 0) {
        $db->rollback();
        sendError('Failed to update sync data', 500);
    }
    
    // Update device last seen (or insert if new device)
    $sql = "INSERT INTO sync_devices (device_id, sync_id, device_name, last_seen) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE 
            device_name = COALESCE(?, device_name),
            last_seen = CURRENT_TIMESTAMP";
    
    $db->execute($sql, [$deviceId, $syncId, $deviceName, $deviceName]);
    
    $db->commit();
    
    // Return success response
    sendSuccess([
        'sync_id' => $syncId,
        'version' => $newVersion,
        'previous_version' => $currentVersion,
        'sync_type' => $syncType,
        'last_modified' => date('Y-m-d H:i:s')
    ], 'Data synchronized successfully');
    
} catch (Exception $e) {
    if (isset($db)) {
        $db->rollback();
    }
    
    error_log("Push sync error: " . $e->getMessage());
    sendError(ERROR_MESSAGES['SERVER_ERROR'], 500);
}
?>