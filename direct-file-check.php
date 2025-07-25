<?php
header('Content-Type: text/plain');

echo "Direct File System Check\n";
echo "=======================\n\n";

// Check what's actually on the filesystem
$checks = [
    'fonts' => [
        'fonts/',
        'fonts/ComicRelief-Regular.ttf',
        'fonts/ComicRelief-Bold.ttf'
    ],
    'api' => [
        'api/',
        'api/sync/',
        'api/sync/access_share.php',
        'api/sync/create_share.php',
        'api/sync/database.php',
        'api/sync/config.php'
    ],
    'root_files' => [
        'workbox-ff8f0705.js',
        'service-worker.js',
        'index.html',
        'manifest.json',
        '.htaccess'
    ],
    'icons' => [
        'icons/',
        'icons/icon-512.png',
        'icons/icon-192.png'
    ]
];

foreach ($checks as $category => $files) {
    echo "\n=== $category ===\n";
    foreach ($files as $file) {
        if (file_exists($file)) {
            $size = filesize($file);
            $type = is_dir($file) ? 'DIR' : 'FILE';
            echo sprintf("%-40s %s (%s bytes)\n", $file, $type, number_format($size));
            
            // For small text files that might be error pages, show content
            if (!is_dir($file) && $size < 1000 && $size > 0 && 
                (strpos($file, '.ttf') !== false || strpos($file, '.js') !== false || strpos($file, '.png') !== false)) {
                $content = file_get_contents($file);
                $preview = substr($content, 0, 100);
                echo "  Preview: " . json_encode($preview) . "\n";
            }
        } else {
            echo sprintf("%-40s MISSING\n", $file);
        }
    }
}

echo "\n\n=== Directory Listings ===\n";

// List what's actually in key directories
$dirs_to_list = ['fonts', 'api/sync', 'icons'];
foreach ($dirs_to_list as $dir) {
    if (is_dir($dir)) {
        echo "\nContents of $dir/:\n";
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file != '.' && $file != '..') {
                $path = $dir . '/' . $file;
                $size = filesize($path);
                echo sprintf("  %-30s %s bytes\n", $file, number_format($size));
            }
        }
    }
}

echo "\n\n=== Git Information ===\n";
echo "Git directory exists: " . (is_dir('.git') ? 'YES' : 'NO') . "\n";
if (is_dir('.git')) {
    echo "Git HEAD: " . trim(file_get_contents('.git/HEAD')) . "\n";
}

// Check actual file contents vs expected
echo "\n\n=== File Content Checks ===\n";
$ttf_header = file_exists('fonts/ComicRelief-Regular.ttf') ? 
    bin2hex(substr(file_get_contents('fonts/ComicRelief-Regular.ttf'), 0, 4)) : 'N/A';
echo "TTF file header (should be 00010000): $ttf_header\n";

$js_start = file_exists('service-worker.js') ? 
    substr(file_get_contents('service-worker.js'), 0, 20) : 'N/A';
echo "service-worker.js starts with: " . json_encode($js_start) . "\n";
?>