<?php
// api/register_pet.php
require 'db.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$species = trim($_POST['species'] ?? '');
$breed = trim($_POST['breed'] ?? '');
$color = trim($_POST['color'] ?? '');
$age = intval($_POST['age'] ?? 0);
$aggressive = isset($_POST['aggressive']) && ($_POST['aggressive'] === '1' || $_POST['aggressive'] === 'on') ? 1 : 0;
$description = trim($_POST['description'] ?? '');

if (!$name || !$species) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and species are required']);
    exit;
}

$image_filename = null;
$upload_dir = realpath(__DIR__ . '/../pet_images') . '/';
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Unable to create image directory']);
        exit;
    }
}

if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $tmp = $_FILES['image']['tmp_name'];
    $orig = basename($_FILES['image']['name']);
    $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
    $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', pathinfo($orig, PATHINFO_FILENAME));
    $newName = $safeName . '_' . time() . '.' . $ext;
    $dest = $upload_dir . $newName;

    // Basic checks
    if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Image too large (max 5MB)']);
        exit;
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $tmp);
    finfo_close($finfo);
    $allowed = ['image/jpeg','image/png','image/gif'];
    if (!in_array($mime, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid image type']);
        exit;
    }

    if (!move_uploaded_file($tmp, $dest)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save uploaded image']);
        exit;
    }
    $image_filename = $newName;
}

try {
    $stmt = $pdo->prepare("INSERT INTO pets (name, species, breed, color, age, aggressive, description, image_filename, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)");
    $stmt->execute([$name, $species, $breed, $color, $age, $aggressive, $description, $image_filename]);
    $pet_id = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'pet_id' => $pet_id]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB insert failed', 'detail' => $e->getMessage()]);
}
?>
