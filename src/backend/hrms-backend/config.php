<?php
function send_cors_headers(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function db(): mysqli {
    $conn = new mysqli('localhost', 'root', '', 'hrms');
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

function json_input(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function value(array $data, string $key): string {
    return isset($data[$key]) ? trim((string)$data[$key]) : '';
}

function log_activity(mysqli $conn, string $actor, string $action, string $details): void {
    $stmt = $conn->prepare('INSERT INTO activity_logs (actor, action, details) VALUES (?, ?, ?)');
    if (!$stmt) return;
    $stmt->bind_param('sss', $actor, $action, $details);
    $stmt->execute();
    $stmt->close();
}
