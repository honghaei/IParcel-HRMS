<?php
require_once __DIR__ . '/config.php';send_cors_headers();$conn=db();$result=$conn->query('SELECT * FROM announcements ORDER BY created_at DESC');$rows=[];while($result&&$row=$result->fetch_assoc()){$row['id']=(string)$row['id'];$rows[]=$row;}echo json_encode($rows);$conn->close();
