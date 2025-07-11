<?php
/**
 * GitHub Webhook Handler for cPanel Deployment
 * 
 * This script handles GitHub webhooks to trigger automatic deployments
 * Place this file in your public_html directory as webhook.php
 */

// Security: Verify GitHub webhook signature
$secret = getenv('GITHUB_WEBHOOK_SECRET') ?: 'your-webhook-secret-here';

// Get the signature from headers
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$payload = file_get_contents('php://input');

// Verify signature
$expected_signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
if (!hash_equals($expected_signature, $signature)) {
    http_response_code(401);
    die('Unauthorized');
}

// Parse the payload
$data = json_decode($payload, true);

// Check if this is a push to main branch
if ($data['ref'] !== 'refs/heads/main') {
    die('Not a push to main branch');
}

// Log the deployment
$log_file = '/home/stachblx/deployment-logs/webhook.log';
$log_dir = dirname($log_file);
if (!is_dir($log_dir)) {
    mkdir($log_dir, 0755, true);
}

$log_entry = date('Y-m-d H:i:s') . " - Deployment triggered by " . $data['pusher']['name'] . "\n";
file_put_contents($log_file, $log_entry, FILE_APPEND);

// Execute deployment
$commands = [
    'cd /home/stachblx/qual',
    'git pull origin main 2>&1',
    '[ -f scripts/cpanel-post-pull.sh ] && bash scripts/cpanel-post-pull.sh',
    'echo "Deployment completed at $(date)"'
];

$output = [];
foreach ($commands as $command) {
    $result = shell_exec($command);
    $output[] = $command . ': ' . $result;
}

// Log the output
file_put_contents($log_file, implode("\n", $output) . "\n\n", FILE_APPEND);

// Return success
http_response_code(200);
echo json_encode([
    'status' => 'success',
    'message' => 'Deployment triggered',
    'timestamp' => date('c')
]);
?>