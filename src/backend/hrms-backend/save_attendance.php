<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

$data = json_input();

$employeeId = (int) value($data, 'employee_id');
$date = value($data, 'work_date');
$action = value($data, 'action');
$notes = value($data, 'notes');

if (!$employeeId || $date === '' || !in_array($action, ['in', 'out', 'edit'], true)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Employee, date, and a valid attendance action are required.'
    ]);
    exit;
}

$conn = db();

$employeeCheck = $conn->prepare('SELECT id FROM employees WHERE id = ? LIMIT 1');
$employeeCheck->bind_param('i', $employeeId);
$employeeCheck->execute();
$employee = $employeeCheck->get_result()->fetch_assoc();
$employeeCheck->close();

if (!$employee) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Employee not found.']);
    $conn->close();
    exit;
}

$leaveCheck = $conn->prepare(
    "SELECT id, leave_type
     FROM leave_requests
     WHERE employee_id = ?
       AND status = 'Approved'
       AND ? BETWEEN start_date AND end_date
     LIMIT 1"
);
$leaveCheck->bind_param('is', $employeeId, $date);
$leaveCheck->execute();
$approvedLeave = $leaveCheck->get_result()->fetch_assoc();
$leaveCheck->close();

$check = $conn->prepare(
    'SELECT id, time_in, time_out, status, notes
     FROM attendance
     WHERE employee_id = ? AND work_date = ?
     LIMIT 1'
);
$check->bind_param('is', $employeeId, $date);
$check->execute();
$existing = $check->get_result()->fetch_assoc();
$check->close();

function attendance_minutes(string $value): int {
    $parts = explode(':', $value);
    return ((int)($parts[0] ?? 0) * 60) + (int)($parts[1] ?? 0);
}

if ($action === 'in') {
    $time = value($data, 'time');

    if ($time === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Time In is required.']);
        $conn->close();
        exit;
    }

    if ($approvedLeave) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'This employee has approved leave for the selected date.'
        ]);
        $conn->close();
        exit;
    }

    if ($existing && !empty($existing['time_in'])) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Time In is already recorded. Use Correct Attendance to change it.'
        ]);
        $conn->close();
        exit;
    }

    $status = attendance_minutes($time) > (8 * 60 + 5) ? 'Late' : 'Present';

    if ($existing) {
        $stmt = $conn->prepare(
            'UPDATE attendance
             SET time_in = ?, status = ?, notes = ?
             WHERE id = ?'
        );
        $stmt->bind_param('sssi', $time, $status, $notes, $existing['id']);
    } else {
        $stmt = $conn->prepare(
            'INSERT INTO attendance (employee_id, work_date, time_in, status, notes)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('issss', $employeeId, $date, $time, $status, $notes);
    }

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to record Time In.']);
    } else {
        log_activity(
            $conn,
            'HR',
            'Attendance Time In',
            'Employee ID ' . $employeeId . ' · ' . $date . ' · ' . $time
        );
        echo json_encode(['success' => true]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'out') {
    $time = value($data, 'time');

    if ($time === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Time Out is required.']);
        $conn->close();
        exit;
    }

    if ($approvedLeave) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'This employee has approved leave for the selected date.'
        ]);
        $conn->close();
        exit;
    }

    if (!$existing || empty($existing['time_in'])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Record Time In before Time Out.']);
        $conn->close();
        exit;
    }

    if (!empty($existing['time_out'])) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Time Out is already recorded. Use Correct Attendance to change it.'
        ]);
        $conn->close();
        exit;
    }

    if (attendance_minutes($time) < attendance_minutes($existing['time_in'])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Time Out cannot be earlier than Time In.'
        ]);
        $conn->close();
        exit;
    }

    $savedNotes = $notes !== '' ? $notes : (string)($existing['notes'] ?? '');

    $stmt = $conn->prepare(
        'UPDATE attendance
         SET time_out = ?, notes = ?
         WHERE id = ?'
    );
    $stmt->bind_param('ssi', $time, $savedNotes, $existing['id']);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to record Time Out.']);
    } else {
        log_activity(
            $conn,
            'HR',
            'Attendance Time Out',
            'Employee ID ' . $employeeId . ' · ' . $date . ' · ' . $time
        );
        echo json_encode(['success' => true]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

if (!$existing) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'No attendance record exists for this employee and date.'
    ]);
    $conn->close();
    exit;
}

$timeIn = value($data, 'time_in');
$timeOut = value($data, 'time_out');
$status = value($data, 'status');

if ($timeIn === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Corrected Time In is required.'
    ]);
    $conn->close();
    exit;
}

if ($timeOut !== '' && attendance_minutes($timeOut) < attendance_minutes($timeIn)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Time Out cannot be earlier than Time In.'
    ]);
    $conn->close();
    exit;
}

if (!in_array($status, ['Present', 'Late'], true)) {
    $status = attendance_minutes($timeIn) > (8 * 60 + 5) ? 'Late' : 'Present';
}

$timeOutSql = $timeOut === '' ? null : $timeOut;

$stmt = $conn->prepare(
    'UPDATE attendance
     SET time_in = ?, time_out = ?, status = ?, notes = ?
     WHERE id = ?'
);
$stmt->bind_param('ssssi', $timeIn, $timeOutSql, $status, $notes, $existing['id']);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to correct attendance.']);
} else {
    log_activity(
        $conn,
        'HR',
        'Attendance corrected',
        'Employee ID ' . $employeeId . ' · ' . $date . ' · ' . $status
    );
    echo json_encode(['success' => true]);
}

$stmt->close();
$conn->close();
