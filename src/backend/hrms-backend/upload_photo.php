<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'No valid image was uploaded.']);
    exit;
}

$file=$_FILES['photo'];
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(422);
    echo json_encode(['success'=>false,'error'=>'Image must be 5 MB or smaller.']);
    exit;
}

$finfo=new finfo(FILEINFO_MIME_TYPE);
$mime=$finfo->file($file['tmp_name']);
$allowed=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
if (!isset($allowed[$mime])) {
    http_response_code(422);
    echo json_encode(['success'=>false,'error'=>'Only JPG, PNG, and WebP images are allowed.']);
    exit;
}

$uploadDir=__DIR__ . '/images/';
if (!is_dir($uploadDir)) mkdir($uploadDir,0755,true);
$name=$_POST['fullName'] ?? 'employee';
$clean=preg_replace('/[^a-zA-Z0-9]+/','_',strtolower($name));
$filename=trim($clean,'_') . '_' . bin2hex(random_bytes(5)) . '.' . $allowed[$mime];
$target=$uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'],$target)) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'Failed to save uploaded image.']);
    exit;
}

echo json_encode(['success'=>true,'filename'=>$filename]);
