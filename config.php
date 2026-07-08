<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = 'localhost';
$dbname = 'eshop_quimica';
$username = 'root';
$password = '';

// =========================
// Configuración de correo
// =========================
// NOTA:
// - En hosting, normalmente mail() funciona si el servidor tiene correo saliente configurado.
// - En localhost (XAMPP/WAMP), mail() suele NO funcionar sin configurar SMTP o un servicio externo.
//
// Recomendado: define estas variables en el servidor (panel / .env / variables de entorno):
//   MAIL_FROM=no-reply@tudominio.com
//   MAIL_FROM_NAME=E-Shop Coco
//
$MAIL_FROM = getenv('MAIL_FROM') ?: 'no-reply@tudominio.com';
$MAIL_FROM_NAME = getenv('MAIL_FROM_NAME') ?: 'E-Shop Coco';

// Correo que recibe los mensajes del formulario de contacto (si lo quieres usar)
//   CONTACT_TO_EMAIL=tuemail@gmail.com
$CONTACT_TO_EMAIL = getenv('CONTACT_TO_EMAIL') ?: $MAIL_FROM;

// Envío de correos por API (recomendado en hostings gratuitos que bloquean mail()).
// Brevo (Sendinblue) - crea tu cuenta, verifica el remitente y pega la API Key:
//   BREVO_API_KEY=xxxxxxxx
$BREVO_API_KEY = getenv('BREVO_API_KEY') ?: '';

function sendEmailViaBrevo($toEmail, $toName, $subject, $htmlBody) {
    global $MAIL_FROM, $MAIL_FROM_NAME, $BREVO_API_KEY;

    if (!$BREVO_API_KEY) return false;
    if (!function_exists('curl_init')) return false;

    $payload = [
        'sender' => [
            'name' => (string)$MAIL_FROM_NAME,
            'email' => (string)$MAIL_FROM
        ],
        'to' => [
            [
                'email' => (string)$toEmail,
                'name' => (string)$toName
            ]
        ],
        'subject' => (string)$subject,
        'htmlContent' => (string)$htmlBody
    ];

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: application/json',
        'content-type: application/json',
        'api-key: ' . $BREVO_API_KEY
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Brevo responde 201/202 si aceptó el envío.
    if ($httpCode >= 200 && $httpCode < 300) return true;

    // Opcional: si quieres depurar, puedes revisar $raw y/o $httpCode.
    return false;
}

function sendHtmlEmail($toEmail, $toName, $subject, $htmlBody) {
    global $MAIL_FROM, $MAIL_FROM_NAME;

    $toEmail = trim((string)$toEmail);
    if ($toEmail === '' || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    // Primero intenta por API (funciona mejor en hostings gratis).
    $apiOk = sendEmailViaBrevo($toEmail, $toName, $subject, $htmlBody);
    if ($apiOk) return true;

    $safeFromName = str_replace(["\r", "\n"], '', (string)$MAIL_FROM_NAME);
    $safeFromEmail = str_replace(["\r", "\n"], '', (string)$MAIL_FROM);

    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-type: text/html; charset=UTF-8';
    $headers[] = 'From: ' . $safeFromName . ' <' . $safeFromEmail . '>';
    $headers[] = 'Reply-To: ' . $safeFromEmail;
    $headers[] = 'X-Mailer: PHP/' . phpversion();

    $to = $toName ? ($toName . ' <' . $toEmail . '>') : $toEmail;

    // mail() devuelve true si el servidor aceptó el envío (no garantiza entrega).
    return @mail($to, $subject, $htmlBody, implode("\r\n", $headers));
}

function sendRegistrationEmail($toEmail, $toName) {
    $subject = 'Registro confirmado - E-Shop Coco';
    $safeName = htmlspecialchars((string)$toName, ENT_QUOTES, 'UTF-8');

    $html = '
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2 style="margin: 0 0 12px;">¡Registro confirmado!</h2>
            <p style="margin: 0 0 8px;">Hola ' . ($safeName ?: '👋') . ',</p>
            <p style="margin: 0 0 12px;">
                Te confirmamos que tu correo <strong>' . htmlspecialchars((string)$toEmail, ENT_QUOTES, 'UTF-8') . '</strong>
                fue registrado correctamente en <strong>E-Shop Coco</strong>.
            </p>
            <p style="margin: 0 0 12px;">
                Si no realizaste este registro, por favor ignora este mensaje.
            </p>
            <hr style="border:0;border-top:1px solid #eee;margin:16px 0;">
            <p style="margin:0;font-size:12px;color:#555;">
                Este es un mensaje automático, por favor no respondas a este correo.
            </p>
        </div>
    ';

    return sendHtmlEmail($toEmail, $toName, $subject, $html);
}

// OpenAI API Key:
// - Recomendado: definir variable de entorno OPENAI_API_KEY en el servidor (más seguro)
// - Alternativa (no recomendado para producción): pegar la clave aquí
$OPENAI_API_KEY = getenv('OPENAI_API_KEY') ?: '';

// Gemini (Google AI Studio) API Key:
// - Defínela como variable de entorno GEMINI_API_KEY (recomendado)
// - Alternativa (no recomendado para producción): pegar la clave aquí
$GEMINI_API_KEY = 'AIzaSyDAQUq-s5VcKrexy27TclvaHmpF0NYC_80';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $dbname CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE $dbname");
    
    initDatabase($pdo);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

function initDatabase($pdo) {
    $queries = [
        "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS purchases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            date DATETIME NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS purchase_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            purchase_id INT NOT NULL,
            product_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            product_emoji VARCHAR(10) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            quantity INT NOT NULL,
            FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS cart (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            product_emoji VARCHAR(10) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_product (user_id, product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS chat_conversations (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_chat_conversations_user (user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS chat_messages (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            conversation_id BIGINT NOT NULL,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_chat_messages_conversation (conversation_id),
            FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS contact_messages (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_contact_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    foreach ($queries as $query) {
        $pdo->exec($query);
    }
    
    $checkUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($checkUsers == 0) {
        $stmt = $pdo->prepare("INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Administrador', 'admin@eshopquimica.com', 'admin', password_hash('admin123', PASSWORD_DEFAULT)]);
        $stmt->execute(['Usuario Demo', 'demo@eshopquimica.com', 'usuario', password_hash('123456', PASSWORD_DEFAULT)]);
    }

    $pdo->exec("DROP VIEW IF EXISTS purchases_with_user");
    $pdo->exec("CREATE VIEW purchases_with_user AS
        SELECT
            p.id,
            p.user_id,
            u.username,
            u.email,
            u.name,
            p.date,
            p.total
        FROM purchases p
        INNER JOIN users u ON u.id = p.user_id");

    $pdo->exec("DROP VIEW IF EXISTS purchase_items_with_user");
    $pdo->exec("CREATE VIEW purchase_items_with_user AS
        SELECT
            pi.id,
            pi.purchase_id,
            p.user_id,
            u.username,
            u.email,
            u.name,
            p.date,
            p.total,
            pi.product_id,
            pi.product_name,
            pi.product_emoji,
            pi.price,
            pi.quantity
        FROM purchase_items pi
        INNER JOIN purchases p ON p.id = pi.purchase_id
        INNER JOIN users u ON u.id = p.user_id");
}
?>
