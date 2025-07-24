<?php
/**
 * Rate Limiting Implementation
 * 
 * Prevents API abuse by limiting requests per IP/endpoint
 */

require_once __DIR__ . '/../config/database.php';

class RateLimiter {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Check if request should be rate limited
     */
    public function checkLimit($identifier, $endpoint) {
        // Clean up old entries first
        $this->cleanup();
        
        // Get current window
        $windowStart = date('Y-m-d H:i:s', time() - RATE_LIMIT_WINDOW);
        
        // Check existing requests in current window
        $sql = "SELECT request_count FROM rate_limits 
                WHERE identifier = ? AND endpoint = ? AND window_start > ?";
        
        $result = $this->db->fetchOne($sql, [$identifier, $endpoint, $windowStart]);
        
        if ($result) {
            // Check if limit exceeded
            if ($result['request_count'] >= RATE_LIMIT_REQUESTS) {
                return false; // Rate limit exceeded
            }
            
            // Increment counter
            $sql = "UPDATE rate_limits 
                    SET request_count = request_count + 1 
                    WHERE identifier = ? AND endpoint = ?";
            
            $this->db->update($sql, [$identifier, $endpoint]);
        } else {
            // Create new rate limit entry
            $sql = "INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) 
                    VALUES (?, ?, 1, NOW())
                    ON DUPLICATE KEY UPDATE 
                    request_count = 1, window_start = NOW()";
            
            $this->db->execute($sql, [$identifier, $endpoint]);
        }
        
        return true; // Request allowed
    }
    
    /**
     * Get remaining requests for identifier
     */
    public function getRemainingRequests($identifier, $endpoint) {
        $windowStart = date('Y-m-d H:i:s', time() - RATE_LIMIT_WINDOW);
        
        $sql = "SELECT request_count FROM rate_limits 
                WHERE identifier = ? AND endpoint = ? AND window_start > ?";
        
        $result = $this->db->fetchOne($sql, [$identifier, $endpoint, $windowStart]);
        
        if ($result) {
            return max(0, RATE_LIMIT_REQUESTS - $result['request_count']);
        }
        
        return RATE_LIMIT_REQUESTS;
    }
    
    /**
     * Get reset timestamp
     */
    public function getResetTime($identifier, $endpoint) {
        $sql = "SELECT window_start FROM rate_limits 
                WHERE identifier = ? AND endpoint = ?";
        
        $result = $this->db->fetchOne($sql, [$identifier, $endpoint]);
        
        if ($result) {
            return strtotime($result['window_start']) + RATE_LIMIT_WINDOW;
        }
        
        return time() + RATE_LIMIT_WINDOW;
    }
    
    /**
     * Clean up old entries
     */
    private function cleanup() {
        $sql = "DELETE FROM rate_limits 
                WHERE window_start < DATE_SUB(NOW(), INTERVAL ? SECOND)";
        
        $this->db->delete($sql, [RATE_LIMIT_WINDOW * 2]);
    }
    
    /**
     * Apply rate limiting headers
     */
    public function applyHeaders($identifier, $endpoint) {
        $remaining = $this->getRemainingRequests($identifier, $endpoint);
        $resetTime = $this->getResetTime($identifier, $endpoint);
        
        header('X-RateLimit-Limit: ' . RATE_LIMIT_REQUESTS);
        header('X-RateLimit-Remaining: ' . $remaining);
        header('X-RateLimit-Reset: ' . $resetTime);
    }
}

/**
 * Check rate limit for current request
 */
function checkRateLimit() {
    $limiter = new RateLimiter();
    $ip = getClientIp();
    $endpoint = basename($_SERVER['SCRIPT_NAME'], '.php');
    
    // Apply headers
    $limiter->applyHeaders($ip, $endpoint);
    
    // Check limit
    if (!$limiter->checkLimit($ip, $endpoint)) {
        $resetTime = $limiter->getResetTime($ip, $endpoint);
        $retryAfter = $resetTime - time();
        
        header('Retry-After: ' . $retryAfter);
        http_response_code(429);
        
        die(json_encode([
            'error' => ERROR_MESSAGES['RATE_LIMIT'],
            'retry_after' => $retryAfter,
            'reset_time' => $resetTime
        ]));
    }
}
?>