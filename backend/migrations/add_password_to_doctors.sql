-- Add password column to Doctors table
ALTER TABLE Doctors ADD COLUMN password VARCHAR(255) NOT NULL AFTER docLicenseNumber;
 
-- Add index on email for faster lookups
CREATE INDEX idx_doctor_email ON Doctors(doctor_email); 