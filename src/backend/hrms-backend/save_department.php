<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

$data = json_input();
$id = (int) value($data, 'id');
$name = trim(value($data, 'name'));
$company = strtolower(trim(value($data, 'company')));
$head = value($data, 'head_employee_id');
$headId = $head === '' ? null : (int)$head;

if ($name === '' || $company === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Name and company are required.']);
    exit;
}

$conn = db();

$duplicate = $conn->prepare(
    'SELECT id FROM departments
     WHERE LOWER(name) = LOWER(?) AND LOWER(company) = LOWER(?) AND id <> ?
     LIMIT 1'
);
$duplicate->bind_param('ssi', $name, $company, $id);
$duplicate->execute();
$duplicateRow = $duplicate->get_result()->fetch_assoc();
$duplicate->close();

if ($duplicateRow) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'That department already exists for the selected company.']);
    $conn->close();
    exit;
}

if ($headId !== null) {
    $headCheck = $conn->prepare('SELECT company FROM employees WHERE id = ? LIMIT 1');
    $headCheck->bind_param('i', $headId);
    $headCheck->execute();
    $headRow = $headCheck->get_result()->fetch_assoc();
    $headCheck->close();

    if (!$headRow || strtolower(trim($headRow['company'])) !== $company) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Department Head must belong to the selected company.']);
        $conn->close();
        exit;
    }
}

$conn->begin_transaction();

try {
    if ($id) {
        $oldQuery = $conn->prepare('SELECT name, company FROM departments WHERE id = ? LIMIT 1');
        $oldQuery->bind_param('i', $id);
        $oldQuery->execute();
        $old = $oldQuery->get_result()->fetch_assoc();
        $oldQuery->close();

        if (!$old) {
            throw new Exception('Department not found.');
        }

        $countQuery = $conn->prepare(
            'SELECT COUNT(*) total FROM employees
             WHERE LOWER(department) = LOWER(?) AND LOWER(company) = LOWER(?)'
        );
        $countQuery->bind_param('ss', $old['name'], $old['company']);
        $countQuery->execute();
        $assigned = (int)$countQuery->get_result()->fetch_assoc()['total'];
        $countQuery->close();

        if ($assigned > 0 && strtolower(trim($old['company'])) !== $company) {
            throw new RuntimeException('Cannot change the company while employees are assigned to this department.');
        }

        $stmt = $conn->prepare(
            'UPDATE departments SET name = ?, company = ?, head_employee_id = ? WHERE id = ?'
        );
        $stmt->bind_param('ssii', $name, $company, $headId, $id);
        if (!$stmt->execute()) {
            throw new Exception('Unable to update department.');
        }
        $stmt->close();

        if (
            $assigned > 0 &&
            strtolower(trim($old['company'])) === $company &&
            strtolower(trim($old['name'])) !== strtolower($name)
        ) {
            $move = $conn->prepare(
                'UPDATE employees
                 SET department = ?
                 WHERE LOWER(department) = LOWER(?) AND LOWER(company) = LOWER(?)'
            );
            $move->bind_param('sss', $name, $old['name'], $old['company']);
            if (!$move->execute()) {
                throw new Exception('Unable to update assigned employee department names.');
            }
            $move->close();
        }

        log_activity($conn, 'HR', 'Department updated', $name . ' · ' . $company);
        $savedId = $id;
    } else {
        $stmt = $conn->prepare(
            'INSERT INTO departments (name, company, head_employee_id) VALUES (?, ?, ?)'
        );
        $stmt->bind_param('ssi', $name, $company, $headId);
        if (!$stmt->execute()) {
            throw new Exception('Unable to add department.');
        }
        $savedId = $stmt->insert_id;
        $stmt->close();

        log_activity($conn, 'HR', 'Department added', $name . ' · ' . $company);
    }

    $conn->commit();
    echo json_encode(['success' => true, 'id' => $savedId]);
} catch (RuntimeException $e) {
    $conn->rollback();
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
