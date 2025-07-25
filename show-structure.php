<?php
header('Content-Type: text/plain');

echo "Server Directory Structure\n";
echo "=========================\n\n";

echo "Current script location: " . __FILE__ . "\n";
echo "Document root: " . $_SERVER['DOCUMENT_ROOT'] . "\n\n";

function showTree($dir, $prefix = '', $level = 0) {
    if ($level > 3) return; // Limit depth
    
    $files = scandir($dir);
    $files = array_diff($files, array('.', '..'));
    
    foreach ($files as $file) {
        $path = $dir . '/' . $file;
        $isDir = is_dir($path);
        $size = $isDir ? '' : ' (' . number_format(filesize($path)) . ' bytes)';
        
        echo $prefix . '├── ' . $file . ($isDir ? '/' : '') . $size . "\n";
        
        if ($isDir && in_array($file, ['api', 'sync', 'fonts', 'icons'])) {
            showTree($path, $prefix . '│   ', $level + 1);
        }
    }
}

echo "Structure of current directory:\n";
showTree('.');

echo "\n\nChecking specific paths:\n";
$paths = [
    'api/sync/access_share.php',
    'sync/api/access_share.php',
    '../api/sync/access_share.php',
    'fonts/ComicRelief-Regular.ttf',
    'workbox-ff8f0705.js'
];

foreach ($paths as $path) {
    echo sprintf("%-40s: %s\n", $path, file_exists($path) ? 'EXISTS' : 'NOT FOUND');
}

echo "\n\nRealpath checks:\n";
echo "Current dir realpath: " . realpath('.') . "\n";
echo "api/sync realpath: " . realpath('api/sync') . "\n";
echo "sync/api realpath: " . realpath('sync/api') . "\n";
?>