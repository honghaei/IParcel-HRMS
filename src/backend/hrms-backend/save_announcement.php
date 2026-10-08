<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

$data = json_input();
$id = (int) value($data, 'id');
$title = value($data, 'title');
$message = value($data, 'message');
$audience = value($data, 'audience') ?: 'All Companies';
$priority = value($data, 'priority') ?: 'Normal';
$creator = value($data, 'created_by') ?: 'HR';
$expiresRaw = value($data, 'expires_at');

if ($title === '' || $message === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Title and message are required.']);
    exit;
}

if (!in_array($priority, ['Normal', 'Important', 'Urgent'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Invalid announcement priority.']);
    exit;
}

$expiresAt = null;
if ($expiresRaw !== '') {
    $normalized = str_replace('T', ' ', $expiresRaw);
    $timestamp = strtotime($normalized);

    if ($timestamp === false) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Invalid expiration date.']);
        exit;
    }

    $expiresAt = date('Y-m-d H:i:s', $timestamp);
}

$conn = db();

if ($id) {
    $stmt = $conn->prepare(
        'UPDATE announcements
         SET title = ?, message = ?, audience = ?, priority = ?, expires_at = ?
         WHERE id = ?'
    );
    $stmt->bind_param('sssssi', $title, $message, $audience, $priority, $expiresAt, $id);
} else {
    $stmt = $conn->prepare(
        'INSERT INTO announcements (title, message, audience, priority, created_by, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('ssssss', $title, $message, $audience, $priority, $creator, $expiresAt);
}

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to save announcement.']);
} else {
    log_activity(
        $conn,
        $creator,
        $id ? 'Announcement updated' : 'Announcement published',
        $title
    );
    echo json_encode(['success' => true, 'id' => $id ?: $stmt->insert_id]);
}

$stmt->close();
$conn->close();
