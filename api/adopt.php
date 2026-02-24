<?php
// api/adopt.php
require 'db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$pet_id = intval($input['pet_id'] ?? 0);

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'not_logged_in']);
    exit;
}

if ($pet_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid pet id']);
    exit;
}

$user_id = intval($_SESSION['user_id']);

try {
    // insert adoption request
    $stmt = $pdo->prepare("INSERT INTO adoptions (user_id, pet_id, status) VALUES (?, ?, 'requested')");
    $stmt->execute([$user_id, $pet_id]);

    // mark pet unavailable
    $stmt2 = $pdo->prepare("UPDATE pets SET available = 0 WHERE id = ?");
    $stmt2->execute([$pet_id]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB error', 'detail' => $e->getMessage()]);
}
?>
