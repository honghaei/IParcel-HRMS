USE hrms;

CREATE TABLE IF NOT EXISTS departments (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  company VARCHAR(100) NOT NULL,
  head_employee_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_department_company (name, company),
  CONSTRAINT fk_department_head FOREIGN KEY (head_employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id INT NOT NULL,
  work_date DATE NOT NULL,
  time_in TIME NULL,
  time_out TIME NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Present',
  notes VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_employee_date (employee_id, work_date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type VARCHAR(80) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  reviewed_by VARCHAR(120) DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  audience VARCHAR(100) NOT NULL DEFAULT 'All Companies',
  priority VARCHAR(30) NOT NULL DEFAULT 'Normal',
  created_by VARCHAR(120) NOT NULL DEFAULT 'HR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  actor VARCHAR(120) NOT NULL,
  action VARCHAR(160) NOT NULL,
  details VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO departments (name, company)
SELECT DISTINCT NULLIF(TRIM(department),''), LOWER(TRIM(company))
FROM employees
WHERE NULLIF(TRIM(department),'') IS NOT NULL;

INSERT INTO attendance (employee_id,work_date,time_in,time_out,status)
SELECT id,CURDATE(),'08:00:00','17:00:00','Present' FROM employees ORDER BY id LIMIT 3
ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id);

INSERT INTO attendance (employee_id,work_date,time_in,time_out,status)
SELECT id,CURDATE(),'08:17:00','17:05:00','Late' FROM employees ORDER BY id LIMIT 3,1
ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id);

INSERT INTO leave_requests (employee_id,leave_type,start_date,end_date,reason,status)
SELECT id,'Vacation Leave',CURDATE()+INTERVAL 5 DAY,CURDATE()+INTERVAL 7 DAY,'Family trip','Pending' FROM employees ORDER BY id LIMIT 1;
INSERT INTO leave_requests (employee_id,leave_type,start_date,end_date,reason,status)
SELECT id,'Sick Leave',CURDATE(),CURDATE(),'Medical rest','Approved' FROM employees ORDER BY id LIMIT 1 OFFSET 4;

INSERT INTO announcements (title,message,audience,priority,created_by)
VALUES
('Welcome to IParcel HRMS','The upgraded HR workspace is ready for employee management, attendance, leave review, reports, and company updates.','All Companies','Important','HR Administrator'),
('HR Records Reminder','Please verify employee contact and emergency information when records are updated.','All Companies','Normal','HR Administrator');

INSERT INTO activity_logs (actor,action,details)
VALUES
('HR Administrator','HRMS upgraded','New HR administration modules enabled'),
('HR Administrator','Employee directory reviewed','Latest employee records loaded');
