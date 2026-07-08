<?php
require_once '../config.php';

/**
 * Endpoint: POST /api/ai-chat
 * Body JSON: { message: string, userId?: number|null, conversationId?: number|null }
 * Response: { success: true, conversationId: number, reply: string }
 */

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$message = isset($input['message']) ? trim((string)$input['message']) : '';
$userId = isset($input['userId']) ? $input['userId'] : null;
$conversationId = isset($input['conversationId']) ? $input['conversationId'] : null;

if ($message === '') {
    jsonResponse(['error' => 'Message is required'], 400);
}

// Gemini API Key
global $GEMINI_API_KEY;
if (!$GEMINI_API_KEY) {
    jsonResponse([
        'error' => 'Falta configurar GEMINI_API_KEY en el servidor (variable de entorno o config.php).'
    ], 500);
}

$GEMINI_MODEL = getenv('GEMINI_MODEL') ?: 'gemini-1.5-flash';

// Crear/validar conversación
try {
    if ($conversationId) {
        $stmt = $pdo->prepare("SELECT id, user_id FROM chat_conversations WHERE id = ?");
        $stmt->execute([$conversationId]);
        $conv = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$conv) {
            $conversationId = null;
        } else {
            // Si el chat está asociado a un usuario, validar que coincida.
            if ($conv['user_id'] !== null && $userId !== null && (int)$conv['user_id'] !== (int)$userId) {
                $conversationId = null;
            }
        }
    }

    if (!$conversationId) {
        $stmt = $pdo->prepare("INSERT INTO chat_conversations (user_id) VALUES (?)");
        $stmt->execute([$userId]);
        $conversationId = (int)$pdo->lastInsertId();
    }

    // Guardar mensaje del usuario
    $stmt = $pdo->prepare("INSERT INTO chat_messages (conversation_id, role, content) VALUES (?, 'user', ?)");
    $stmt->execute([$conversationId, $message]);

    $pdo->prepare("UPDATE chat_conversations SET last_active_at = NOW() WHERE id = ?")->execute([$conversationId]);
} catch (Exception $e) {
    jsonResponse(['error' => 'Error guardando chat: ' . $e->getMessage()], 500);
}

// Cargar historial reciente para contexto
$history = [];
try {
    $stmt = $pdo->prepare("
        SELECT role, content
        FROM chat_messages
        WHERE conversation_id = ?
        ORDER BY id DESC
        LIMIT 20
    ");
    $stmt->execute([$conversationId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $rows = array_reverse($rows);
    foreach ($rows as $r) {
        $role = $r['role'] === 'assistant' ? 'assistant' : 'user';
        $history[] = ['role' => $role, 'content' => (string)$r['content']];
    }
} catch (Exception $e) {
    // Si falla el historial, seguimos sin él
}

// Contexto del negocio (ajustable)
$storeContext = [
    "Tienda: E-Shop Coco (productos de cuidado capilar a base de coco).",
    "Productos (catálogo actual):",
    "- Champú de Coco Natural (id: 1, precio aproximado: 25.99).",
    "- Gotero de Coco (id: 2, precio aproximado: 19.99).",
    "Stock mostrado en la UI: 100 unidades cada uno (puede variar).",
    "Si preguntan por envíos: entrega rápida (promesa: <48 horas hábiles en la UI), y soporte/asesoría.",
    "Si el usuario pregunta algo general (fuera de la tienda), responde también, pero prioriza orientar a la compra si aplica.",
];

$systemPrompt = implode("\n", array_merge(
    [
        "Eres el chat de asistencia de una tienda en línea. Sé claro, amable y directo.",
        "No digas que eres una IA, un modelo, un bot ni un asistente virtual.",
        "Si te preguntan si eres una IA: responde que eres el chat de asistencia y que puedes orientar al cliente o escalar a un agente humano si hace falta.",
    ],
    $storeContext,
    [
        "",
        "Reglas:",
        "- Responde SIEMPRE en español.",
        "- No inventes políticas (devoluciones, garantías, precios exactos) si no están confirmadas; si falta info, pregunta 1 cosa concreta.",
        "- Mantén respuestas cortas por defecto. Si el cliente pide detalle, amplía.",
        "- Si el cliente quiere comprar: explica pasos (Ventas -> Agregar al carrito -> Carrito -> Finalizar compra).",
    ]
));

// Preparar mensajes para Gemini
$contents = [];
foreach ($history as $m) {
    $role = ($m['role'] === 'assistant') ? 'model' : 'user';
    $contents[] = [
        'role' => $role,
        'parts' => [
            ['text' => (string)$m['content']]
        ]
    ];
}

$payload = [
    'systemInstruction' => [
        'parts' => [
            ['text' => $systemPrompt]
        ]
    ],
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => 0.4,
        'maxOutputTokens' => 250
    ]
];

$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($GEMINI_MODEL) . ':generateContent?key=' . rawurlencode($GEMINI_API_KEY);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$raw = curl_exec($ch);
$curlErr = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($raw === false) {
    jsonResponse(['error' => 'Error llamando a Gemini: ' . $curlErr], 500);
}

$data = json_decode($raw, true);
if ($httpCode < 200 || $httpCode >= 300) {
    $msg = isset($data['error']['message']) ? $data['error']['message'] : $raw;
    jsonResponse(['error' => 'Gemini error: ' . $msg], 500);
}

$reply = '';
if (isset($data['candidates'][0]['content']['parts']) && is_array($data['candidates'][0]['content']['parts'])) {
    $texts = [];
    foreach ($data['candidates'][0]['content']['parts'] as $p) {
        if (isset($p['text'])) $texts[] = (string)$p['text'];
    }
    $reply = trim(implode("\n", $texts));
}
if ($reply === '') {
    $reply = 'Ahora mismo no pude generar una respuesta. Intenta de nuevo.';
}

// Guardar respuesta de asistente
try {
    $stmt = $pdo->prepare("INSERT INTO chat_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)");
    $stmt->execute([$conversationId, $reply]);
    $pdo->prepare("UPDATE chat_conversations SET last_active_at = NOW() WHERE id = ?")->execute([$conversationId]);
} catch (Exception $e) {
    // Si falla guardar, igual devolvemos la respuesta
}

jsonResponse([
    'success' => true,
    'conversationId' => $conversationId,
    'reply' => $reply
]);
?>
