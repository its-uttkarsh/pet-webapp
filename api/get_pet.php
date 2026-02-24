<?php
// api/get_pet.php
require 'db.php';

$id = intval($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid id']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM pets WHERE id = ?");
$stmt->execute([$id]);
$pet = $stmt->fetch();

if (!$pet) {
    http_response_code(404);
    echo json_encode(['error' => 'Pet not found']);
    exit;
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$base = $scheme . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname(dirname($_SERVER['PHP_SELF'])), '/\\') . '/pet_images/';
$pet['image_url'] = $pet['image_filename'] ? $base . $pet['image_filename'] : $base . 'placeholder.png';
$pet['aggressive'] = intval($pet['aggressive']);

echo json_encode(['pet' => $pet]);
?>
