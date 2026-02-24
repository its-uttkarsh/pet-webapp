<?php
// api/reset_request.php
require 'db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$ue = trim($input['ue'] ?? '');

if (!$ue) {
    http_response_code(400);
    echo json_encode(['error' => 'Enter username or email']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, security_question FROM users WHERE username = ? OR email = ?");
$stmt->execute([$ue, $ue]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

echo json_encode(['success' => true, 'user_id' => $user['id'], 'question' => $user['security_question']]);
?>
