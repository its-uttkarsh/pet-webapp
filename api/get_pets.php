<?php
// api/get_pets.php
require 'db.php';

$stmt = $pdo->query("SELECT id, name, species, breed, color, age, aggressive, description, image_filename, available FROM pets WHERE available = 1 ORDER BY created_at DESC");
$pets = $stmt->fetchAll();

// Build base URL to pet_images
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$base = $scheme . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname(dirname($_SERVER['PHP_SELF'])), '/\\') . '/pet_images/';

foreach ($pets as &$p) {
    $p['image_url'] = $p['image_filename'] ? $base . $p['image_filename'] : $base . 'placeholder.png';
    $p['aggressive'] = intval($p['aggressive']);
}

echo json_encode(['pets' => $pets]);
?>
