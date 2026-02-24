<?php
// api/reset_verify.php
require 'db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id = intval($input['user_id'] ?? 0);
$ans = trim($input['answer'] ?? '');

if ($id <= 0 || $ans === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

$stmt = $pdo->prepare("SELECT security_answer FROM users WHERE id = ?");
$stmt->execute([$id]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

// Compare answers case-insensitively (you can change to hashed compare if you hash answers)
if (strtolower($ans) !== strtolower($user['security_answer'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Incorrect answer']);
    exit;
}

echo json_encode(['success' => true]);
?>
