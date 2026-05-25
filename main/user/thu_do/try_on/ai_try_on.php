<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
    exit;
}

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Payload JSON khong hop le.'
    ]);
    exit;
}

$garments = $payload['garments'] ?? [];

if (!is_array($garments) || count($garments) === 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Chua co san pham nao de render AI.'
    ]);
    exit;
}

$endpoint = getenv('AI_TRYON_ENDPOINT') ?: '';
$apiKey = getenv('AI_TRYON_API_KEY') ?: '';

if ($endpoint === '') {
    http_response_code(501);
    echo json_encode([
        'success' => false,
        'message' => 'Chua cau hinh AI_TRYON_ENDPOINT tren server.'
    ]);
    exit;
}

$requestBody = [
    'model_image_url' => $payload['modelImageUrl'] ?? '',
    'gender' => $payload['gender'] ?? 'male',
    'height' => intval($payload['height'] ?? 170),
    'weight' => intval($payload['weight'] ?? 60),
    'garments' => array_values(array_map(function ($item) {
        return [
            'type' => $item['type'] ?? '',
            'image_url' => $item['imageUrl'] ?? ''
        ];
    }, $garments))
];

$headers = [
    'Content-Type: application/json'
];

if ($apiKey !== '') {
    $headers[] = 'Authorization: Bearer ' . $apiKey;
}

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => json_encode($requestBody),
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 120
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => 'Khong goi duoc dich vu AI: ' . $curlError
    ]);
    exit;
}

$aiResult = json_decode($response, true);

if ($statusCode < 200 || $statusCode >= 300 || !is_array($aiResult)) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => 'Dich vu AI tra ve ket qua khong hop le.',
        'statusCode' => $statusCode
    ]);
    exit;
}

$imageUrl = $aiResult['imageUrl']
    ?? $aiResult['image_url']
    ?? $aiResult['output']
    ?? null;

if (is_array($imageUrl)) {
    $imageUrl = $imageUrl[0] ?? null;
}

if (!$imageUrl) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => 'Dich vu AI khong tra ve imageUrl.'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'imageUrl' => $imageUrl
]);
