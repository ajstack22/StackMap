<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    require_once 'database.php';
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['sync_id']) || !isset($input['encrypted_blob']) || 
        !isset($input['device_id']) || !isset($input['timestamp'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }
    
    $sync_id = $input['sync_id'];
    $device_id = $input['device_id'];
    $encrypted_blob = $input['encrypted_blob'];
    $client_timestamp = intval($input['timestamp']);
    
    // Validate inputs
    if (!preg_match('/^[a-f0-9]{32}$/', $sync_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid sync_id format']);
        exit();
    }
    
    if (!preg_match('/^[a-f0-9]{32}$/', $device_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid device_id format']);
        exit();
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Check if tables exist and create if needed
    $check_table = $db->query("SHOW TABLES LIKE 'sync_groups'");
    if ($check_table->rowCount() === 0) {
        // Tables don't exist, need to create them
        $schema = file_get_contents(__DIR__ . '/schema_timestamp.sql');
        if ($schema) {
            // Remove comments and split by semicolon
            $schema = preg_replace('/--.*$/m', '', $schema);
            $statements = array_filter(array_map('trim', explode(';', $schema)));
            
            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    $db->exec($statement);
                }
            }
        }
    }
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Check if sync group already exists
        $check_stmt = $db->prepare("SELECT sync_id FROM sync_groups WHERE sync_id = ?");
        $check_stmt->execute([$sync_id]);
        $result = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            // Sync group already exists - this is a join, not a create
            $db->rollBack();
            http_response_code(409);
            echo json_encode(['error' => 'Sync group already exists', 'sync_id' => $sync_id]);
            exit();
        }
        
        // Create new sync group
        $group_stmt = $db->prepare("INSERT INTO sync_groups (sync_id) VALUES (?)");
        $group_stmt->execute([$sync_id]);
        
        // Add device to sync group
        $device_stmt = $db->prepare("INSERT INTO sync_devices (sync_id, device_id) VALUES (?, ?)");
        $device_stmt->execute([$sync_id, $device_id]);
        
        // Insert first sync record
        $record_stmt = $db->prepare("
            INSERT INTO sync_records (sync_id, device_id, client_timestamp, encrypted_blob)
            VALUES (?, ?, ?, ?)
        ");
        $record_stmt->execute([$sync_id, $device_id, $client_timestamp, $encrypted_blob]);
        
        $record_id = $db->lastInsertId();
        
        // Commit transaction
        $db->commit();
        
        // Return success
        echo json_encode([
            'success' => true,
            'sync_id' => $sync_id,
            'device_id' => $device_id,
            'record_id' => $record_id,
            'server_time' => round(microtime(true) * 1000)
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log('Create timestamp error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
?>