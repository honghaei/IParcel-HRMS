<?php
require_once __DIR__ . '/config.php';
send_cors_headers();
$conn=db();
$date=isset($_GET['date'])?trim($_GET['date']):'';
$sql="SELECT a.*, e.employee_number, CONCAT(e.first_name,' ',e.last_name) employee_name, e.company, e.department FROM attendance a JOIN employees e ON e.id=a.employee_id";
if($date!==''){
    $stmt=$conn->prepare($sql.' WHERE a.work_date=? ORDER BY e.last_name,e.first_name');
    $stmt->bind_param('s',$date);$stmt->execute();$result=$stmt->get_result();
}else{$result=$conn->query($sql.' ORDER BY a.work_date DESC,e.last_name,e.first_name');}
$rows=[];while($result && $row=$result->fetch_assoc()){$row['id']=(string)$row['id'];$row['employee_id']=(string)$row['employee_id'];$rows[]=$row;}
echo json_encode($rows);$conn->close();
