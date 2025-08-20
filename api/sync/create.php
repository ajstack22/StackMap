<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'database.php';

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate required fields
if (!$data || !isset($data['sync_id']) || !isset($data['encrypted_blob'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: sync_id, encrypted_blob']);
    exit();
}

try {
    $db = Database::getInstance()->getConnection();

    // Check if sync_id already exists
    $check = $db->prepare("SELECT sync_id, created_at FROM sync_data WHERE sync_id = ?");
    $check->execute([$data['sync_id']]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        error_log("Create sync: Duplicate sync_id " . $data['sync_id'] . " created at " . $existing['created_at']);
        http_response_code(409);
        echo json_encode([
            'success' => false, 
            'error' => 'Sync ID already exists',
            'debug' => [
                'sync_id' => $data['sync_id'],
                'existing_created_at' => $existing['created_at']
            ]
        ]);
        exit();
    }

    // Create new sync group
    $stmt = $db->prepare("
        INSERT INTO sync_data (sync_id, encrypted_blob)
        VALUES (?, ?)
    ");
    $stmt->execute([
        $data['sync_id'],
        $data['encrypted_blob']
    ]);

    // Try to log metric but don't fail if table doesn't exist
    try {
        $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) VALUES (?, ?)");
        $metric->execute(['sync_created', json_encode(['sync_id' => $data['sync_id']])]);
    } catch (Exception $e) {
        // Ignore metrics errors
    }

    // Log successful creation
    error_log("Create sync: Successfully created sync_id " . $data['sync_id']);
    
    // Return success response
    http_response_code(201);
    echo json_encode([
        'success' => true, 
        'sync_id' => $data['sync_id'],
        'debug' => [
            'created' => true,
            'sync_id' => $data['sync_id']
        ]
    ]);

} catch (Exception $e) {
    error_log("Create sync error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to create sync group: ' . $e->getMessage()]);
}
