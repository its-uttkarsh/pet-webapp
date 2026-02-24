<?php
// api/register.php
require 'db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$username = trim($input['username'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$question = trim($input['question'] ?? null);
$answer = trim($input['answer'] ?? null);

if (!$username || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

// Optionally hash security answer? For simplicity we store plain but you can hash if desired.
try {
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, security_question, security_answer) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$username, $email, $hash, $question, $answer]);
    $id = $pdo->lastInsertId();
    $_SESSION['user_id'] = $id;
    echo json_encode(['success' => true, 'user_id' => $id]);
} catch (PDOException $e) {
    // check duplicate key
    if ($e->getCode() == 23000) {
        http_response_code(400);
        echo json_encode(['error' => 'Username or email already exists']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'DB error', 'detail' => $e->getMessage()]);
    }
}
?>
