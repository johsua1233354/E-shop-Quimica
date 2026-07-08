<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Soporta instalación en subcarpeta (ej: /miapp/api/cart)
$apiBase = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); // ej: /miapp/api
$routeBase = $apiBase . '/cart';

$path = $requestPath;
if (strpos($path, $routeBase) === 0) {
    $path = substr($path, strlen($routeBase));
} else {
    // Fallback por si cambia el servidor/rewrite
    $path = str_replace('/api/cart', '', $path);
}
$pathParts = array_filter(explode('/', $path));

if ($method === 'GET' && count($pathParts) === 1) {
    $userId = $pathParts[0];
    $stmt = $pdo->prepare("SELECT * FROM cart WHERE user_id = ?");
    $stmt->execute([$userId]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'POST' && (empty($path) || $path === '/')) {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validaciones básicas
    $userId = $data['userId'] ?? null;
    $productId = $data['productId'] ?? null;
    $productName = isset($data['productName']) ? (string)$data['productName'] : '';
    $productEmoji = isset($data['productEmoji']) ? (string)$data['productEmoji'] : '';
    $price = $data['price'] ?? null;
    $quantity = isset($data['quantity']) ? (int)$data['quantity'] : 1;
    if ($quantity <= 0) $quantity = 1;

    if (!$userId || !$productId || $productName === '' || $price === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos para agregar al carrito.']);
        exit;
    }

    try {
        $checkStmt = $pdo->prepare("SELECT * FROM cart WHERE user_id = ? AND product_id = ?");
        $checkStmt->execute([$userId, $productId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $updateStmt = $pdo->prepare("UPDATE cart SET quantity = quantity + ? WHERE id = ?");
            $updateStmt->execute([$quantity, $existing['id']]);
        } else {
            $insertStmt = $pdo->prepare("INSERT INTO cart (user_id, product_id, product_name, product_emoji, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
            $insertStmt->execute([
                $userId,
                $productId,
                $productName,
                $productEmoji,
                $price,
                $quantity
            ]);
        }

        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        // Si el hosting/DB no soporta emojis (charset/collation), evitamos romper la compra:
        // reintenta guardando sin emoji.
        $msg = $e->getMessage();
        try {
            $checkStmt = $pdo->prepare("SELECT * FROM cart WHERE user_id = ? AND product_id = ?");
            $checkStmt->execute([$userId, $productId]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $updateStmt = $pdo->prepare("UPDATE cart SET quantity = quantity + ? WHERE id = ?");
                $updateStmt->execute([$quantity, $existing['id']]);
            } else {
                $insertStmt = $pdo->prepare("INSERT INTO cart (user_id, product_id, product_name, product_emoji, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
                $insertStmt->execute([
                    $userId,
                    $productId,
                    $productName,
                    '',
                    $price,
                    $quantity
                ]);
            }

            echo json_encode(['success' => true, 'warning' => 'Carrito guardado sin emoji por compatibilidad del servidor.']);
        } catch (PDOException $e2) {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo agregar al carrito.', 'details' => $msg]);
        }
    }
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
