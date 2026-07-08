<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Soporta instalación en subcarpeta (ej: /miapp/api/users)
$apiBase = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); // ej: /miapp/api
$routeBase = $apiBase . '/users';

$path = $requestPath;
if (strpos($path, $routeBase) === 0) {
    $path = substr($path, strlen($routeBase));
} else {
    // Fallback por si cambia el servidor/rewrite
    $path = str_replace('/api/users', '', $path);
}

if ($method === 'GET' && empty($path)) {
    $stmt = $pdo->query("SELECT id, name, email, username FROM users");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'POST' && strpos($path, 'login') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'];
    $password = $data['password'];
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE (username = ? OR email = ?)");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password'])) {
        unset($user['password']);
        echo json_encode($user);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
}

if ($method === 'POST' && strpos($path, 'register') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['email'], $data['username'], $hashedPassword]);
        
        $userId = $pdo->lastInsertId();

        // Enviar correo de confirmación (si falla, no bloquea el registro)
        $emailSent = false;
        try {
            if (function_exists('sendRegistrationEmail')) {
                $emailSent = sendRegistrationEmail($data['email'], $data['name']);
            }
        } catch (Exception $e) {
            $emailSent = false;
        }

        echo json_encode([
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'],
            'emailSent' => $emailSent
        ]);
    } catch (PDOException $e) {
        http_response_code(400);
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo json_encode(['error' => 'User or email already exists']);
        } else {
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
