<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api/cart', '', $path);
$pathParts = array_filter(explode('/', $path));

if ($method === 'GET' && count($pathParts) === 1) {
    $userId = $pathParts[0];
    $stmt = $pdo->prepare("SELECT * FROM cart WHERE user_id = ?");
    $stmt->execute([$userId]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'POST' && empty($path)) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $checkStmt = $pdo->prepare("SELECT * FROM cart WHERE user_id = ? AND product_id = ?");
    $checkStmt->execute([$data['userId'], $data['productId']]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        $updateStmt = $pdo->prepare("UPDATE cart SET quantity = quantity + ? WHERE id = ?");
        $updateStmt->execute([$data['quantity'] ?? 1, $existing['id']]);
    } else {
        $insertStmt = $pdo->prepare("INSERT INTO cart (user_id, product_id, product_name, product_emoji, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
        $insertStmt->execute([
            $data['userId'],
            $data['productId'],
            $data['productName'],
            $data['productEmoji'],
            $data['price'],
            $data['quantity'] ?? 1
        ]);
    }
    
    echo json_encode(['success' => true]);
}

if ($method === 'PUT' && count($pathParts) === 1) {
    $id = $pathParts[0];
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
    $stmt->execute([$data['quantity'], $id]);
    echo json_encode(['success' => true]);
}

if ($method === 'DELETE' && count($pathParts) === 1) {
    $id = $pathParts[0];
    $stmt = $pdo->prepare("DELETE FROM cart WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}

if ($method === 'DELETE' && count($pathParts) === 2 && $pathParts[0] === 'user') {
    $userId = $pathParts[1];
    $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
    $stmt->execute([$userId]);
    echo json_encode(['success' => true]);
}
?>
