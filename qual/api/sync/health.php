<?php
/**
 * Health check endpoint for the sync API
 * Used by the app to verify API availability
 */

require_once '../utils/response.php';

setCorsHeaders();

// Simple health check - just verify we can respond
sendHealthCheck();
?>