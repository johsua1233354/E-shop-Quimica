<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api/users', '', $path);

if ($method === 'GET' && empty($path)) {
    $stmt = $pdo->query("SELECT * FROM users");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'POST' && str_contains($path, 'login')) {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'];
    $password = $data['password'];
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?");
    $stmt->execute([$username, $username, $password]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode($user);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
}

if ($method === 'POST' && str_contains($path, 'register')) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['email'], $data['username'], $data['password']]);
        
        $userId = $pdo->lastInsertId();
        echo json_encode([
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username']
        ]);
    } catch (PDOException $e) {
        http_response_code(400);
        if (str_contains($e->getMessage(), 'Duplicate')) {
            echo json_encode(['error' => 'User or email already exists']);
        } else {
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
