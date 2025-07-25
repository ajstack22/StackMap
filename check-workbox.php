<?php
header('Content-Type: text/plain');

echo "Workbox File Check\n";
echo "==================\n\n";

$file = 'workbox-ff8f0705.js';

if (file_exists($file)) {
    $size = filesize($file);
    $content = file_get_contents($file);
    $first_chars = substr($content, 0, 100);
    $mime = mime_content_type($file);
    
    echo "File exists: YES\n";
    echo "Size: " . number_format($size) . " bytes\n";
    echo "MIME type detected: $mime\n";
    echo "First 100 chars:\n$first_chars\n\n";
    
    // Check if it's HTML
    if (stripos($content, '<!DOCTYPE') !== false || stripos($content, '<html') !== false) {
        echo "WARNING: File contains HTML content!\n";
        echo "This is likely an error page.\n";
    } else if (strpos($content, 'define(') === 0 || strpos($content, 'self.') !== false) {
        echo "✓ File appears to be valid JavaScript\n";
    }
} else {
    echo "File does not exist!\n";
}

// Check .htaccess
echo "\n\n.htaccess content:\n";
echo "==================\n";
if (file_exists('.htaccess')) {
    echo file_get_contents('.htaccess');
} else {
    echo "No .htaccess file found\n";
}
?>