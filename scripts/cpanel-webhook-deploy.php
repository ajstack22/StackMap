<?php
/**
 * GitHub Webhook Deployment Script for cPanel
 * Place this in your cPanel account (e.g., public_html/deploy/webhook.php)
 * Set up GitHub webhook to POST to this URL
 */

// Configuration
$secret = 'YOUR_WEBHOOK_SECRET'; // Set this to a random string
$qual_deploy_script = '/home/stachblx/scripts/deploy-to-qual.sh';
$prod_deploy_script = '/home/stachblx/scripts/deploy-to-prod.sh';
$log_file = '/home/stachblx/deployment-logs/webhook.log';

// Verify webhook signature
function verify_webhook($payload, $signature, $secret) {
    $calculated = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    return hash_equals($calculated, $signature);
}

// Log function
function log_message($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND);
}

// Get headers and payload
$headers = getallheaders();
$payload = file_get_contents('php://input');
$signature = $headers['X-Hub-Signature-256'] ?? '';

// Verify signature
if (!verify_webhook($payload, $signature, $secret)) {
    http_response_code(401);
    log_message('Invalid webhook signature');
    die('Unauthorized');
}

// Parse payload
$data = json_decode($payload, true);
if (!$data) {
    http_response_code(400);
    log_message('Invalid JSON payload');
    die('Bad Request');
}

// Check if this is a push to main branch
if ($data['ref'] !== 'refs/heads/main') {
    log_message('Push to non-main branch, ignoring');
    die('Not main branch');
}

log_message('Valid webhook received for main branch push');

// Check commit message for deployment instructions
$commit_message = $data['head_commit']['message'] ?? '';
$deploy_to_prod = false;

if (stripos($commit_message, '[deploy:prod]') !== false) {
    $deploy_to_prod = true;
    log_message('Commit message contains [deploy:prod], will deploy to production');
}

// Execute deployment
try {
    // Always deploy to qual first
    log_message('Deploying to qual...');
    $output = shell_exec("bash $qual_deploy_script 2>&1");
    log_message("Qual deployment output: $output");
    
    if ($deploy_to_prod) {
        log_message('Deploying to production...');
        $output = shell_exec("bash $prod_deploy_script 2>&1");
        log_message("Production deployment output: $output");
        echo "Deployed to qual and production";
    } else {
        echo "Deployed to qual only";
    }
    
} catch (Exception $e) {
    http_response_code(500);
    log_message('Deployment error: ' . $e->getMessage());
    die('Deployment failed');
}

http_response_code(200);
?>