<?php
require_once __DIR__ . '/config.php';send_cors_headers();$conn=db();
$result=$conn->query("SELECT l.*, e.employee_number, CONCAT(e.first_name,' ',e.last_name) employee_name, e.company, e.department FROM leave_requests l JOIN employees e ON e.id=l.employee_id ORDER BY CASE l.status WHEN 'Pending' THEN 0 ELSE 1 END,l.created_at DESC");
$rows=[];while($result&&$row=$result->fetch_assoc()){$row['id']=(string)$row['id'];$row['employee_id']=(string)$row['employee_id'];$rows[]=$row;}echo json_encode($rows);$conn->close();
