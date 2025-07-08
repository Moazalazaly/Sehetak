const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get all patients with their insurance provider
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const [patients] = await pool.query(`
            SELECT 
                p.*, 
                i.provider_name as insurance_provider_name
            FROM Patient p
            LEFT JOIN Insurance_Providers i ON p.insurance_id = i.insurance_id
        `);
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Error fetching patients', error: error.message });
    }
});

// Get patient by ID with their insurance provider
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const [patients] = await pool.query(`
            SELECT 
                p.*, 
                i.provider_name as insurance_provider_name
            FROM Patient p
            LEFT JOIN Insurance_Providers i ON p.insurance_id = i.insurance_id
            WHERE p.patient_id = ?
        `, [req.params.id]);

        if (patients.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(patients[0]);
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ message: 'Error fetching patient', error: error.message });
    }
});

// Register new patient
router.post('/', async (req, res) => {
    console.log('Received registration request:', { ...req.body, password: '[REDACTED]' });
    
    const {
        insurance_id,
        patient_name,
        patient_phone,
        patient_email,
        P_birth_date,
        patient_address,
        bloodtype,
        allergies,
        gender,
        p_emergency_contact,
        emergency_contact_phone,
        password
    } = req.body;

    // Validate required fields
    const requiredFields = {
        patient_name: 'Full Name',
        patient_phone: 'Phone Number',
        patient_email: 'Email',
        P_birth_date: 'Birth Date',
        patient_address: 'Address',
        bloodtype: 'Blood Type',
        gender: 'Gender',
        p_emergency_contact: 'Emergency Contact Name',
        emergency_contact_phone: 'Emergency Contact Phone',
        password: 'Password'
    };

    const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !req.body[key])
        .map(([_, label]) => label);

    if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields);
        return res.status(400).json({ 
            message: 'Missing required fields',
            missingFields
        });
    }

    // Validate password length
    if (password.length < 8) {
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long'
        });
    }

    // Validate bloodtype enum
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(bloodtype)) {
        console.log('Invalid blood type:', bloodtype);
        return res.status(400).json({ 
            message: 'Invalid blood type',
            validTypes: validBloodTypes
        });
    }

    // Validate gender enum (accepting both full names and single letters)
    const validGenders = {
        'M': 'Male',
        'F': 'Female',
        'O': 'Other',
        'Male': 'Male',
        'Female': 'Female',
        'Other': 'Other'
    };

    const normalizedGender = validGenders[gender];
    if (!normalizedGender) {
        console.log('Invalid gender:', gender);
        return res.status(400).json({ 
            message: 'Invalid gender',
            validTypes: Object.values(validGenders)
        });
    }

    try {
        const pool = await getPool();
        
        // Check if email already exists
        const [existing] = await pool.query(
            'SELECT patient_id FROM Patient WHERE patient_email = ?',
            [patient_email]
        );
        
        if (existing.length > 0) {
            console.log('Email already registered:', patient_email);
            return res.status(400).json({ message: 'Email already registered' });
        }

        // If insurance_id is provided, verify it exists
        if (insurance_id) {
            const [insurance] = await pool.query(
                'SELECT insurance_id FROM Insurance_Providers WHERE insurance_id = ?',
                [insurance_id]
            );
            if (insurance.length === 0) {
                console.log('Invalid insurance provider ID:', insurance_id);
                return res.status(400).json({ message: 'Invalid insurance provider ID' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Log the SQL query parameters (excluding password)
        console.log('Attempting to insert patient with data:', {
            insurance_id,
            patient_name,
            patient_phone,
            patient_email,
            P_birth_date,
            patient_address,
            bloodtype,
            allergies,
            gender: normalizedGender,
            p_emergency_contact,
            emergency_contact_phone
        });

        const [result] = await pool.query(
            `INSERT INTO Patient (
                insurance_id, patient_name, patient_phone, patient_email,
                P_birth_date, patient_address, bloodtype, allergies, gender,
                p_emergency_contact, emergency_contact_phone, password
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                insurance_id || null, patient_name, patient_phone, patient_email,
                P_birth_date, patient_address, bloodtype, allergies || null, normalizedGender,
                p_emergency_contact, emergency_contact_phone, hashedPassword
            ]
        );

        console.log('Patient registered successfully with ID:', result.insertId);

        // Create JWT token
        const token = jwt.sign(
            { 
                patient_id: result.insertId,
                email: patient_email,
                role: 'patient'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'Patient registered successfully',
            patient_id: result.insertId,
            token
        });
    } catch (error) {
        console.error('Error registering patient:', error);
        // Check for specific database errors
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ 
                message: 'Database table does not exist',
                error: 'Please ensure the Patient table is created in the database'
            });
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                message: 'Email already registered',
                error: 'This email address is already in use'
            });
        }
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({ 
                message: 'Database schema error',
                error: 'Please ensure all required columns exist in the Patient table'
            });
        }
        res.status(500).json({ 
            message: 'Error registering patient', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Update patient
router.put('/:id', async (req, res) => {
    const patientId = req.params.id;
    const {
        insurance_id,
        patient_name,
        patient_phone,
        patient_email,
        P_birth_date,
        patient_address,
        bloodtype,
        allergies,
        gender,
        p_emergency_contact,
        emergency_contact_phone
    } = req.body;

    try {
        const pool = await getPool();

        // Check if patient exists
        const [existing] = await pool.query(
            'SELECT patient_id FROM Patient WHERE patient_id = ?',
            [patientId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // If email is being updated, check if new email is already in use
        if (patient_email) {
            const [emailCheck] = await pool.query(
                'SELECT patient_id FROM Patient WHERE patient_email = ? AND patient_id != ?',
                [patient_email, patientId]
            );
            if (emailCheck.length > 0) {
                return res.status(400).json({ message: 'Email already in use by another patient' });
            }
        }

        // If insurance_id is provided, verify it exists
        if (insurance_id) {
            const [insurance] = await pool.query(
                'SELECT insurance_id FROM Insurance_Providers WHERE insurance_id = ?',
                [insurance_id]
            );
            if (insurance.length === 0) {
                return res.status(400).json({ message: 'Invalid insurance provider ID' });
            }
        }

        // Validate bloodtype if provided
        if (bloodtype) {
            const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            if (!validBloodTypes.includes(bloodtype)) {
                return res.status(400).json({ 
                    message: 'Invalid blood type',
                    validTypes: validBloodTypes
                });
            }
        }

        // Validate gender if provided
        if (gender) {
            const validGenders = ['Male', 'Female', 'Other'];
            if (!validGenders.includes(gender)) {
                return res.status(400).json({ 
                    message: 'Invalid gender',
                    validTypes: validGenders
                });
            }
        }

        const [result] = await pool.query(
            `UPDATE Patient SET 
                insurance_id = ?,
                patient_name = COALESCE(?, patient_name),
                patient_phone = COALESCE(?, patient_phone),
                patient_email = COALESCE(?, patient_email),
                P_birth_date = COALESCE(?, P_birth_date),
                patient_address = COALESCE(?, patient_address),
                bloodtype = COALESCE(?, bloodtype),
                allergies = COALESCE(?, allergies),
                gender = COALESCE(?, gender),
                p_emergency_contact = COALESCE(?, p_emergency_contact),
                emergency_contact_phone = COALESCE(?, emergency_contact_phone)
            WHERE patient_id = ?`,
            [
                insurance_id,
                patient_name, patient_phone, patient_email,
                P_birth_date, patient_address, bloodtype, allergies, gender,
                p_emergency_contact, emergency_contact_phone,
                patientId
            ]
        );

        res.json({ message: 'Patient updated successfully' });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ message: 'Error updating patient', error: error.message });
    }
});

// Delete patient
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        
        // Check if patient exists
        const [existing] = await pool.query(
            'SELECT patient_id FROM Patient WHERE patient_id = ?',
            [req.params.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const [result] = await pool.query('DELETE FROM Patient WHERE patient_id = ?', [req.params.id]);
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ message: 'Error deleting patient', error: error.message });
    }
});

// Patient login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const pool = await getPool();
        
        // Find patient by email
        const [patients] = await pool.query(
            'SELECT * FROM Patient WHERE patient_email = ?',
            [email]
        );

        if (patients.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const patient = patients[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, patient.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                patient_id: patient.patient_id,
                email: patient.patient_email,
                role: 'patient'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Return patient data and token
        res.json({
            token,
            patient: {
                patient_id: patient.patient_id,
                patient_name: patient.patient_name,
                patient_email: patient.patient_email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
});

// Get patient's chronic diseases
router.get('/:id/chronic-diseases', async (req, res) => {
    try {
        const pool = await getPool();
        const [diseases] = await pool.query(
            'SELECT * FROM Chronic_Diseases WHERE patient_id = ?',
            [req.params.id]
        );
        res.json(diseases);
    } catch (error) {
        console.error('Error fetching chronic diseases:', error);
        res.status(500).json({ message: 'Error fetching chronic diseases', error: error.message });
    }
});

// Add chronic disease
router.post('/:id/chronic-diseases', async (req, res) => {
    const { disease_name, diagnosis_date, status, notes } = req.body;
    const patient_id = req.params.id;

    if (!disease_name) {
        return res.status(400).json({ message: 'Disease name is required' });
    }

    try {
        const pool = await getPool();
        
        // Check if patient exists
        const [patient] = await pool.query(
            'SELECT patient_id FROM Patient WHERE patient_id = ?',
            [patient_id]
        );
        
        if (patient.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const [result] = await pool.query(
            `INSERT INTO Chronic_Diseases 
            (patient_id, disease_name, diagnosis_date, status, notes) 
            VALUES (?, ?, ?, ?, ?)`,
            [patient_id, disease_name, diagnosis_date || null, status || 'Active', notes || null]
        );

        res.status(201).json({
            message: 'Chronic disease added successfully',
            disease_id: result.insertId
        });
    } catch (error) {
        console.error('Error adding chronic disease:', error);
        res.status(500).json({ message: 'Error adding chronic disease', error: error.message });
    }
});

// Update chronic disease
router.put('/chronic-diseases/:diseaseId', async (req, res) => {
    const { disease_name, diagnosis_date, status, notes } = req.body;
    const disease_id = req.params.diseaseId;

    if (!disease_name) {
        return res.status(400).json({ message: 'Disease name is required' });
    }

    try {
        const pool = await getPool();
        
        // Check if disease exists
        const [disease] = await pool.query(
            'SELECT disease_id FROM Chronic_Diseases WHERE disease_id = ?',
            [disease_id]
        );
        
        if (disease.length === 0) {
            return res.status(404).json({ message: 'Chronic disease not found' });
        }

        await pool.query(
            `UPDATE Chronic_Diseases 
            SET disease_name = ?,
                diagnosis_date = ?,
                status = ?,
                notes = ?
            WHERE disease_id = ?`,
            [disease_name, diagnosis_date || null, status || 'Active', notes || null, disease_id]
        );

        res.json({ message: 'Chronic disease updated successfully' });
    } catch (error) {
        console.error('Error updating chronic disease:', error);
        res.status(500).json({ message: 'Error updating chronic disease', error: error.message });
    }
});

// Delete chronic disease
router.delete('/chronic-diseases/:diseaseId', async (req, res) => {
    try {
        const pool = await getPool();
        
        // Check if disease exists
        const [disease] = await pool.query(
            'SELECT disease_id FROM Chronic_Diseases WHERE disease_id = ?',
            [req.params.diseaseId]
        );
        
        if (disease.length === 0) {
            return res.status(404).json({ message: 'Chronic disease not found' });
        }

        await pool.query('DELETE FROM Chronic_Diseases WHERE disease_id = ?', [req.params.diseaseId]);
        res.json({ message: 'Chronic disease deleted successfully' });
    } catch (error) {
        console.error('Error deleting chronic disease:', error);
        res.status(500).json({ message: 'Error deleting chronic disease', error: error.message });
    }
});

module.exports = router; 