<?php
// api/reset_update.php
require 'db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id = intval($input['user_id'] ?? 0);
$pass = $input['password'] ?? '';

if ($id <= 0 || !$pass) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

if (strlen($pass) < 4) {
    http_response_code(400);
    echo json_encode(['error' => 'Password too short']);
    exit;
}

$hash = password_hash($pass, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
try {
    $stmt->execute([$hash, $id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB error']);
}
?>
