<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

$data = json_input();
$username = value($data, 'username');
$password = value($data, 'password');

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit;
}

$conn = db();
$stmt = $conn->prepare('SELECT id, username, password, name, role FROM hr_accounts WHERE username = ? LIMIT 1');
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

$valid = false;
if ($user) {
    $stored = (string)$user['password'];
    $valid = password_get_info($stored)['algo'] !== null
        ? password_verify($password, $stored)
        : hash_equals($stored, $password); // backward compatibility with the existing company DB
}

if (!$valid) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    exit;
}

unset($user['password']);
echo json_encode(['success' => true, 'user' => $user]);
$stmt->close();
$conn->close();
