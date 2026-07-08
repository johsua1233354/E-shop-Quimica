<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Soporta instalación en subcarpeta (ej: /miapp/api/purchases)
$apiBase = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); // ej: /miapp/api
$routeBase = $apiBase . '/purchases';

$path = $requestPath;
if (strpos($path, $routeBase) === 0) {
    $path = substr($path, strlen($routeBase));
} else {
    // Fallback por si cambia el servidor/rewrite
    $path = str_replace('/api/purchases', '', $path);
}
$pathParts = array_filter(explode('/', $path));

if ($method === 'GET' && count($pathParts) === 1) {
    $userId = $pathParts[0];
    $stmt = $pdo->prepare("SELECT p.*, u.username, u.email, u.name FROM purchases p INNER JOIN users u ON u.id = p.user_id WHERE p.user_id = ? ORDER BY p.id DESC");
    $stmt->execute([$userId]);
    $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($purchases as &$purchase) {
        $itemsStmt = $pdo->prepare("SELECT * FROM purchase_items WHERE purchase_id = ?");
        $itemsStmt->execute([$purchase['id']]);
        $purchase['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode($purchases);
}

if ($method === 'POST' && (empty($path) || $path === '/')) {
    $data = json_decode(file_get_contents('php://input'), true);
    $date = date('Y-m-d H:i:s');

    $userId = $data['userId'] ?? null;
    $items = $data['items'] ?? null;
    $total = $data['total'] ?? null;

    if (!$userId || !is_array($items) || count($items) === 0 || $total === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos para finalizar la compra.']);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        $purchaseStmt = $pdo->prepare("INSERT INTO purchases (user_id, date, total) VALUES (?, ?, ?)");
        $purchaseStmt->execute([$userId, $date, $total]);
        $purchaseId = $pdo->lastInsertId();
        
        foreach ($items as $item) {
            $itemStmt = $pdo->prepare("INSERT INTO purchase_items (purchase_id, product_id, product_name, product_emoji, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
            $itemStmt->execute([
                $purchaseId,
                $item['id'],
                $item['name'],
                $item['emoji'],
                $item['price'],
                $item['quantity']
            ]);
        }
        
        $clearCartStmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
        $clearCartStmt->execute([$userId]);
        
        $pdo->commit();
        echo json_encode(['id' => $purchaseId, 'success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
