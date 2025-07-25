<?php
header('Content-Type: text/plain');

echo "StackMap File Check\n";
echo "==================\n\n";

echo "Current directory: " . getcwd() . "\n";
echo "Script location: " . __FILE__ . "\n\n";

// Check directories
$dirs = ['fonts', 'api', 'api/sync', 'icons', 'web', 'web/build'];
echo "Directories:\n";
foreach ($dirs as $dir) {
    echo sprintf("  %-20s: %s\n", $dir, is_dir($dir) ? "EXISTS" : "MISSING");
}
echo "\n";

// Check specific files
$files = [
    'fonts/ComicRelief-Regular.ttf',
    'fonts/ComicRelief-Bold.ttf',
    'api/sync/access_share.php',
    'api/sync/create_share.php',
    'api/sync/database.php',
    'workbox-ff8f0705.js',
    'service-worker.js',
    'manifest.json',
    'icons/icon-512.png'
];

echo "Files:\n";
foreach ($files as $file) {
    if (file_exists($file)) {
        $size = filesize($file);
        echo sprintf("  %-35s: EXISTS (%s bytes)\n", $file, number_format($size));
    } else {
        echo sprintf("  %-35s: MISSING\n", $file);
    }
}

echo "\n";

// List contents of fonts directory if it exists
if (is_dir('fonts')) {
    echo "Contents of fonts/:\n";
    $files = scandir('fonts');
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "  - $file\n";
        }
    }
} else {
    echo "fonts/ directory does not exist\n";
}

echo "\n";

// Check git status
echo "Git status:\n";
echo shell_exec('git status --short 2>&1');

echo "\n";
echo "Git branch:\n";
echo shell_exec('git branch --show-current 2>&1');

echo "\n";
echo "Last 5 commits:\n";
echo shell_exec('git log --oneline -5 2>&1');
?>