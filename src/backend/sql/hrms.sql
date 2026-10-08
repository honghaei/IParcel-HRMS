CREATE DATABASE IF NOT EXISTS hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hrms;

DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS hr_accounts;

CREATE TABLE employees (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) DEFAULT '',
  last_name VARCHAR(100) NOT NULL,
  employee_number VARCHAR(100) NOT NULL,
  designation VARCHAR(150) DEFAULT '',
  employment_status VARCHAR(50) DEFAULT '',
  company VARCHAR(100) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  provincial_address TEXT,
  home_address TEXT,
  location VARCHAR(100) DEFAULT '',
  years_of_service VARCHAR(50) DEFAULT '',
  marital_status VARCHAR(50) DEFAULT '',
  date_hired DATE DEFAULT NULL,
  children_count INT DEFAULT 0,
  birthplace VARCHAR(120) DEFAULT '',
  birthdate DATE DEFAULT NULL,
  contact_number VARCHAR(100) DEFAULT '',
  pay_rate VARCHAR(100) DEFAULT '',
  sss VARCHAR(100) DEFAULT '',
  pagibig VARCHAR(100) DEFAULT '',
  philhealth VARCHAR(100) DEFAULT '',
  tin VARCHAR(100) DEFAULT '',
  payment_basis VARCHAR(50) DEFAULT '',
  email VARCHAR(150) DEFAULT '',
  emergency_contact_person VARCHAR(150) DEFAULT '',
  emergency_relationship VARCHAR(100) DEFAULT '',
  emergency_contact_number VARCHAR(100) DEFAULT '',
  emergency_address TEXT,
  profile_picture VARCHAR(255) DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_employee_number (employee_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hr_accounts (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  role VARCHAR(50) DEFAULT 'HR',
  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demo account password: secret123
INSERT INTO hr_accounts (username,password,name,role) VALUES
('hr1','$2y$12$NZFCkrxQNVl9wLNItoJMJuZ75f1YfeX/3fBVVI6.sRR6TH1wDVFYS','Charles','HR Administrator');

-- Portfolio-safe fictional employee data. Replace with company records only in a private environment.
INSERT INTO employees (
 first_name,middle_name,last_name,employee_number,designation,employment_status,company,department,
 home_address,location,years_of_service,marital_status,date_hired,children_count,birthplace,birthdate,
 contact_number,pay_rate,payment_basis,email,emergency_contact_person,emergency_relationship,emergency_contact_number,emergency_address,profile_picture
) VALUES
('Liam','','Torres','EMP001','Operations Staff','Regular','iparcel plus','Operations','Manila, Philippines','HO','2','Single','2024-01-10',0,'Manila','2001-04-19','0900-000-0001','32000','Monthly','liam.torres@example.test','Alex Torres','Sibling','0900-100-0001','Manila, Philippines',''),
('Sophia','','Lim','EMP002','Human Resource Assistant','Regular','ipxpress','Admin/HR','Quezon City, Philippines','QAVE','2','Single','2024-02-12',0,'Quezon City','2000-01-18','0900-000-0002','31000','Monthly','sophia.lim@example.test','Maria Lim','Mother','0900-100-0002','Quezon City, Philippines',''),
('John','','Santos','EMP003','Motorized Rider','Probationary','swift','Operations','Pasig City, Philippines','STA.CATALINA','1','Single','2025-03-18',0,'Pasig City','1999-06-22','0900-000-0003','850','Daily','john.santos@example.test','Paolo Santos','Brother','0900-100-0003','Pasig City, Philippines',''),
('Maria','','Garcia','EMP004','Property Administrator','Regular','nagali','Admin/HR','Caloocan City, Philippines','HO','3','Married','2023-01-12',1,'Caloocan City','1996-01-15','0900-000-0004','38000','Monthly','maria.garcia@example.test','Jose Garcia','Spouse','0900-100-0004','Caloocan City, Philippines',''),
('Kevin','','Tan','EMP005','Admin/IT Support Staff','Regular','iparcel plus','Admin/HR','Makati City, Philippines','HO','1','Single','2025-01-20',0,'Makati City','2000-01-20','0900-000-0005','35000','Monthly','kevin.tan@example.test','Linda Tan','Mother','0900-100-0005','Makati City, Philippines',''),
('Rizza','','Cruz','EMP006','Accounting Assistant','Regular','iparcel plus','Accounting','Mandaluyong City, Philippines','HO','1','Single','2025-01-25',0,'Mandaluyong City','2001-08-09','0900-000-0006','34000','Monthly','rizza.cruz@example.test','Ramon Cruz','Father','0900-100-0006','Mandaluyong City, Philippines',''),
('Mark','','Dela Cruz','EMP007','Customer Service Agent','Regular','ipxpress','Operations','Taguig City, Philippines','FELIZ','2','Single','2024-03-05',0,'Taguig City','1998-01-15','0900-000-0007','800','Daily','mark.delacruz@example.test','Ana Dela Cruz','Mother','0900-100-0007','Taguig City, Philippines',''),
('Anna','','Reyes','EMP008','Retail Shipping Officer','Probationary','iparcel plus','Operations','Cebu City, Philippines','CEBEMALL','0','Single','2026-08-04',0,'Cebu City','2002-01-18','0900-000-0008','780','Daily','anna.reyes@example.test','Joel Reyes','Father','0900-100-0008','Cebu City, Philippines','');
