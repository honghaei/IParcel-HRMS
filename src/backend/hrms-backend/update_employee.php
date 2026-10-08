<?php
require_once __DIR__ . '/config.php';
send_cors_headers();

$data=json_input();
$id=value($data,'id');
if ($id==='') {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Employee ID is required.']);
    exit;
}

$firstName=value($data,'firstName'); $middleName=value($data,'middleName'); $lastName=value($data,'lastName');
$employeeNumber=value($data,'employeeNumber'); $designation=value($data,'designation'); $employmentStatus=value($data,'employmentStatus');
$company=value($data,'company'); $department=value($data,'department'); $provincialAddress=value($data,'provincialAddress');
$homeAddress=value($data,'homeAddress'); $location=value($data,'location'); $yearsOfService=value($data,'yearsOfService');
$maritalStatus=value($data,'maritalStatus'); $dateHired=value($data,'dateHired'); $childrenCount=value($data,'childrenCount');
$birthplace=value($data,'birthplace'); $birthdate=value($data,'birthdate'); $contactNumber=value($data,'contactNumber');
$payRate=value($data,'payRate'); $sss=value($data,'sss'); $pagibig=value($data,'pagibig'); $philhealth=value($data,'philhealth');
$tin=value($data,'tin'); $paymentBasis=value($data,'paymentBasis'); $email=value($data,'email');
$emergencyContactPerson=value($data,'emergencyContactPerson'); $emergencyRelationship=value($data,'emergencyRelationship');
$emergencyContactNumber=value($data,'emergencyContactNumber'); $emergencyAddress=value($data,'emergencyAddress');
$profilePicture=isset($data['profile_picture']) ? basename((string)$data['profile_picture']) : '';

$conn=db();
$stmt=$conn->prepare('UPDATE employees SET
 first_name=?,middle_name=?,last_name=?,employee_number=?,designation=?,employment_status=?,company=?,department=?,provincial_address=?,home_address=?,
 location=?,years_of_service=?,marital_status=?,date_hired=?,children_count=?,birthplace=?,birthdate=?,contact_number=?,pay_rate=?,sss=?,pagibig=?,philhealth=?,tin=?,
 payment_basis=?,email=?,emergency_contact_person=?,emergency_relationship=?,emergency_contact_number=?,emergency_address=?,profile_picture=? WHERE id=?');
$stmt->bind_param(str_repeat('s',31),
 $firstName,$middleName,$lastName,$employeeNumber,$designation,$employmentStatus,$company,$department,$provincialAddress,$homeAddress,
 $location,$yearsOfService,$maritalStatus,$dateHired,$childrenCount,$birthplace,$birthdate,$contactNumber,$payRate,$sss,$pagibig,$philhealth,$tin,
 $paymentBasis,$email,$emergencyContactPerson,$emergencyRelationship,$emergencyContactNumber,$emergencyAddress,$profilePicture,$id
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Unable to update employee.','error'=>$stmt->error]);
} else {
    log_activity($conn, 'HR', 'Employee updated', $employeeNumber . ' · ' . $firstName . ' ' . $lastName);
    echo json_encode(['success'=>true,'message'=>'Employee updated successfully.']);
}
$stmt->close(); $conn->close();
