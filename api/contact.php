<?php
require_once '../config.php';

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$name = isset($input['name']) ? trim((string)$input['name']) : '';
$email = isset($input['email']) ? trim((string)$input['email']) : '';
$message = isset($input['message']) ? trim((string)$input['message']) : '';

if ($name === '' || $email === '' || $message === '') {
    jsonResponse(['error' => 'Completa nombre, correo y mensaje.'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Correo inválido.'], 400);
}
if (mb_strlen($message) < 5) {
    jsonResponse(['error' => 'Escribe un mensaje más detallado.'], 400);
}

// Guardar en base de datos
try {
    $stmt = $pdo->prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $message]);
    $contactId = (int)$pdo->lastInsertId();
} catch (Exception $e) {
    jsonResponse(['error' => 'No se pudo guardar tu mensaje.'], 500);
}

// Enviar correo al administrador (opcional)
$sentToAdmin = false;
$sentToUser = false;

try {
    global $CONTACT_TO_EMAIL;
    $subject = "Nuevo mensaje de contacto - E-Shop Coco (#{$contactId})";
    $html = '
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2 style="margin:0 0 12px;">Nuevo mensaje de contacto</h2>
            <p style="margin:0 0 6px;"><strong>Nombre:</strong> ' . htmlspecialchars($name, ENT_QUOTES, "UTF-8") . '</p>
            <p style="margin:0 0 6px;"><strong>Correo:</strong> ' . htmlspecialchars($email, ENT_QUOTES, "UTF-8") . '</p>
            <p style="margin:12px 0 6px;"><strong>Mensaje:</strong></p>
            <div style="padding:12px 14px;background:#f6f6f6;border-radius:10px;">' . nl2br(htmlspecialchars($message, ENT_QUOTES, "UTF-8")) . '</div>
            <p style="margin:12px 0 0;color:#555;font-size:12px;">ID: ' . $contactId . '</p>
        </div>
    ';

    if ($CONTACT_TO_EMAIL) {
        $sentToAdmin = sendHtmlEmail($CONTACT_TO_EMAIL, 'E-Shop Coco', $subject, $html);
    }
} catch (Exception $e) {
    $sentToAdmin = false;
}

// Confirmación al usuario (opcional)
try {
    $subject2 = "Recibimos tu mensaje - E-Shop Coco";
    $html2 = '
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2 style="margin:0 0 12px;">¡Gracias por escribirnos!</h2>
            <p style="margin:0 0 8px;">Hola ' . htmlspecialchars($name, ENT_QUOTES, "UTF-8") . ',</p>
            <p style="margin:0 0 12px;">Recibimos tu mensaje y te responderemos lo antes posible.</p>
            <div style="padding:12px 14px;background:#f6f6f6;border-radius:10px;">
                <div style="font-weight:700;margin-bottom:6px;">Tu mensaje:</div>
                <div>' . nl2br(htmlspecialchars($message, ENT_QUOTES, "UTF-8")) . '</div>
            </div>
            <p style="margin:12px 0 0;color:#555;font-size:12px;">Referencia: #' . $contactId . '</p>
        </div>
    ';
    $sentToUser = sendHtmlEmail($email, $name, $subject2, $html2);
} catch (Exception $e) {
    $sentToUser = false;
}

jsonResponse([
    'success' => true,
    'id' => $contactId,
    'sentToAdmin' => (bool)$sentToAdmin,
    'sentToUser' => (bool)$sentToUser
]);
?>

