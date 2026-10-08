<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

$data = json_input();
$id = (int) value($data, 'id');
$status = value($data, 'status');
$reviewer = value($data, 'reviewed_by') ?: 'HR';
$reviewNote = value($data, 'review_note');

if (!$id || !in_array($status, ['Approved', 'Rejected'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'A valid leave request and decision are required.']);
    exit;
}

$conn = db();

$current = $conn->prepare('SELECT status FROM leave_requests WHERE id = ? LIMIT 1');
$current->bind_param('i', $id);
$current->execute();
$row = $current->get_result()->fetch_assoc();
$current->close();

if (!$row) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Leave request not found.']);
    $conn->close();
    exit;
}

if ($row['status'] !== 'Pending') {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'This leave request has already been reviewed.']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare(
    'UPDATE leave_requests
     SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ?
     WHERE id = ?'
);
$stmt->bind_param('sssi', $status, $reviewer, $reviewNote, $id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to update leave request.']);
} else {
    log_activity(
        $conn,
        $reviewer,
        'Leave request ' . $status,
        'Leave request #' . $id . ($reviewNote !== '' ? ' · ' . substr($reviewNote, 0, 140) : '')
    );
    echo json_encode(['success' => true]);
}

$stmt->close();
$conn->close();
