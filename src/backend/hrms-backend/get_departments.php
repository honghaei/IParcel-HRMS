<?php
require_once __DIR__ . '/config.php';
send_cors_headers();
$conn = db();

$sql = "
SELECT
  d.id,
  d.name,
  d.company,
  d.head_employee_id,
  CONCAT(h.first_name,' ',h.last_name) AS head_name,
  h.designation AS head_designation,
  COUNT(e.id) AS employee_count
FROM departments d
LEFT JOIN employees h ON h.id = d.head_employee_id
LEFT JOIN employees e
  ON LOWER(e.department) = LOWER(d.name)
 AND LOWER(e.company) = LOWER(d.company)
GROUP BY
  d.id,d.name,d.company,d.head_employee_id,
  h.first_name,h.last_name,h.designation
ORDER BY d.company,d.name
";

$result = $conn->query($sql);
$rows = [];

while ($result && $row = $result->fetch_assoc()) {
    $row['id'] = (string)$row['id'];
    $row['head_employee_id'] = $row['head_employee_id'] !== null ? (string)$row['head_employee_id'] : null;
    $row['employee_count'] = (int)$row['employee_count'];
    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
