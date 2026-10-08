<?php
require_once __DIR__ . '/config.php';
send_cors_headers();
$conn = db();

function scalar(mysqli $conn, string $sql): int {
    $result = $conn->query($sql);
    if (!$result) return 0;
    $row = $result->fetch_row();
    return (int)($row[0] ?? 0);
}

$totalEmployees = scalar($conn, "SELECT COUNT(*) FROM employees WHERE LOWER(employment_status) NOT IN ('resigned','terminated')");
$activeEmployees = scalar($conn, "SELECT COUNT(*) FROM employees WHERE LOWER(employment_status) IN ('regular','probationary')");
$presentToday = scalar($conn, "SELECT COUNT(*) FROM attendance WHERE work_date = CURDATE() AND time_in IS NOT NULL");
$lateToday = scalar($conn, "SELECT COUNT(*) FROM attendance WHERE work_date = CURDATE() AND status = 'Late'");
$onLeaveToday = scalar($conn, "SELECT COUNT(*) FROM leave_requests WHERE status = 'Approved' AND CURDATE() BETWEEN start_date AND end_date");
$pendingLeaves = scalar($conn, "SELECT COUNT(*) FROM leave_requests WHERE status = 'Pending'");

$companyCounts=[];
$result=$conn->query("SELECT company, COUNT(*) total FROM employees WHERE LOWER(employment_status) NOT IN ('resigned','terminated') GROUP BY company ORDER BY total DESC");
while($result && $row=$result->fetch_assoc()) $companyCounts[]=['company'=>$row['company'],'count'=>(int)$row['total']];

$birthdays=[];
$result=$conn->query("SELECT id, CONCAT(first_name,' ',last_name) name, company, birthdate FROM employees WHERE birthdate IS NOT NULL ORDER BY DATE_FORMAT(birthdate,'%m-%d') LIMIT 12");
while($result && $row=$result->fetch_assoc()){
    $birthdays[]=['id'=>(string)$row['id'],'name'=>$row['name'],'company'=>$row['company'],'date'=>$row['birthdate'],'detail'=>date('M j',strtotime($row['birthdate']))];
}

$anniversaries=[];
$result=$conn->query("SELECT id, CONCAT(first_name,' ',last_name) name, company, date_hired, TIMESTAMPDIFF(YEAR,date_hired,CURDATE()) years FROM employees WHERE date_hired IS NOT NULL ORDER BY DATE_FORMAT(date_hired,'%m-%d') LIMIT 12");
while($result && $row=$result->fetch_assoc()){
    $anniversaries[]=['id'=>(string)$row['id'],'name'=>$row['name'],'company'=>$row['company'],'date'=>$row['date_hired'],'detail'=>((int)$row['years']).' yrs'];
}

$recentHires=[];
$result=$conn->query("SELECT id, CONCAT(first_name,' ',last_name) name, company, date_hired FROM employees ORDER BY date_hired DESC LIMIT 5");
while($result && $row=$result->fetch_assoc()) $recentHires[]=['id'=>(string)$row['id'],'name'=>$row['name'],'company'=>$row['company'],'date'=>$row['date_hired']];

$activities=[];
$result=$conn->query("SELECT id, actor, action, details, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 8");
while($result && $row=$result->fetch_assoc()) $activities[]=$row;

echo json_encode(compact('totalEmployees','activeEmployees','presentToday','lateToday','onLeaveToday','pendingLeaves','companyCounts','birthdays','anniversaries','recentHires','activities'));
$conn->close();
