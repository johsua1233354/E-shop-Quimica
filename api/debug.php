<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Soporta instalación en subcarpeta (ej: /miapp/api/debug)
$apiBase = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); // ej: /miapp/api
$routeBase = $apiBase . '/debug';

$path = $requestPath;
if (strpos($path, $routeBase) === 0) {
    $path = substr($path, strlen($routeBase));
} else {
    $path = str_replace('/api/debug', '', $path);
}

$sessionId = 'login-cart-failure';
$outDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.dbg';
if (!is_dir($outDir)) {
    @mkdir($outDir, 0777, true);
}
$logFile = $outDir . DIRECTORY_SEPARATOR . "trae-debug-log-$sessionId.ndjson";

function readLogs($logFile, $lastN = null) {
    if (!file_exists($logFile)) return [];
    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!$lines) return [];
    if (is_int($lastN) && $lastN > 0) {
        $lines = array_slice($lines, -$lastN);
    }
    $out = [];
    foreach ($lines as $line) {
        $decoded = json_decode($line, true);
        if ($decoded !== null) $out[] = $decoded;
    }
    return $out;
}

function appendLog($logFile, $payload) {
    $payload['ts'] = isset($payload['ts']) ? $payload['ts'] : (int) round(microtime(true) * 1000);
    file_put_contents($logFile, json_encode($payload) . "\n", FILE_APPEND);
}

if ($method === 'GET' && (empty($path) || $path === '/' || strpos($path, 'health') !== false)) {
    $count = count(readLogs($logFile));
    echo json_encode(['ok' => true, 'sessionId' => $sessionId, 'logCount' => $count]);
    exit;
}

if ($method === 'GET' && strpos($path, 'logs') !== false) {
    $last = isset($_GET['last']) ? (int)$_GET['last'] : null;
    echo json_encode(readLogs($logFile, $last));
    exit;
}

if ($method === 'DELETE' && strpos($path, 'logs') !== false) {
    if (file_exists($logFile)) {
        @unlink($logFile);
    }
    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'POST' && strpos($path, 'event') !== false) {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
        exit;
    }
    appendLog($logFile, $payload);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['ok' => false, 'error' => 'Not found']);
?>
