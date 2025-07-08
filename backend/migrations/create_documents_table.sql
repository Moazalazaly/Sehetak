-- Create Document Categories table
CREATE TABLE IF NOT EXISTS Document_Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (category_name)
);

-- Create Document Sharing table for sharing documents between users
CREATE TABLE IF NOT EXISTS Document_Sharing (
    share_id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    shared_by_user_id INT NOT NULL,
    shared_with_user_id INT NOT NULL,
    permission_level ENUM('view', 'edit', 'delete') DEFAULT 'view',
    share_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (document_id) REFERENCES Documents(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY (document_id, shared_with_user_id)
);

-- Create Document Versions table for version control
CREATE TABLE IF NOT EXISTS Document_Versions (
    version_id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    version_number INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_data LONGBLOB NOT NULL,
    uploaded_by_user_id INT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_description TEXT,
    FOREIGN KEY (document_id) REFERENCES Documents(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY (document_id, version_number)
);

-- Drop existing Documents table if it exists
DROP TABLE IF EXISTS Documents;

-- Create Documents table with updated foreign key
CREATE TABLE IF NOT EXISTS Documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_data LONGBLOB NOT NULL,
    file_size BIGINT NOT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    encryption_key VARCHAR(255),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Document_Categories(category_id) ON DELETE SET NULL
);

-- Add indexes for faster lookups
CREATE INDEX idx_documents_user_id ON Documents(user_id);
CREATE INDEX idx_documents_category_id ON Documents(category_id);
CREATE INDEX idx_documents_type ON Documents(type);
CREATE INDEX idx_documents_upload_date ON Documents(upload_date);

-- Insert some default document categories
INSERT INTO Document_Categories (category_name, description) VALUES
('Medical Records', 'Patient medical history and records'),
('Lab Results', 'Laboratory test results and reports'),
('Prescriptions', 'Medical prescriptions and medication records'),
('Imaging', 'X-rays, MRIs, and other imaging results'),
('Insurance', 'Insurance documents and claims'),
('Vaccination', 'Vaccination records and certificates'),
('Surgical', 'Surgical reports and procedures'),
('Other', 'Other medical documents'); 