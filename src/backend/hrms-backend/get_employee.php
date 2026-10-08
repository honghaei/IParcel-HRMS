<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

$conn = db();
$result = $conn->query('SELECT * FROM employees ORDER BY last_name, first_name');
$employees = [];

while ($row = $result->fetch_assoc()) {
    if (!empty($row['profile_picture'])) {
        $row['profile_picture'] = basename($row['profile_picture']);
    }
    $employees[] = $row;
}

echo json_encode($employees);
$conn->close();
