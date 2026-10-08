<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

$data = json_input();
$id = (int) value($data, 'id');

if (!$id) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Announcement ID is required.']);
    exit;
}

$conn = db();

$query = $conn->prepare('SELECT title FROM announcements WHERE id = ? LIMIT 1');
$query->bind_param('i', $id);
$query->execute();
$row = $query->get_result()->fetch_assoc();
$query->close();

if (!$row) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Announcement not found.']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare('DELETE FROM announcements WHERE id = ?');
$stmt->bind_param('i', $id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to delete announcement.']);
} else {
    log_activity($conn, 'HR', 'Announcement deleted', $row['title']);
    echo json_encode(['success' => true]);
}

$stmt->close();
$conn->close();
