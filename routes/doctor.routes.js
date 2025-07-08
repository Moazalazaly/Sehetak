const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get all doctors with their specialization and hospital
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const [doctors] = await pool.query(`
            SELECT 
                d.*,
                s.specialization_name,
                h.hospital_name
            FROM Doctors d
            JOIN Specializations s ON d.specialization_id = s.specialization_id
            JOIN Hospital_Clinic h ON d.hospital_id = h.hospital_id
        `);
        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Error fetching doctors', error: error.message });
    }
});

// Get doctor by ID with their specialization and hospital
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const [doctors] = await pool.query(`
            SELECT 
                d.*,
                s.specialization_name,
                h.hospital_name
            FROM Doctors d
            JOIN Specializations s ON d.specialization_id = s.specialization_id
            JOIN Hospital_Clinic h ON d.hospital_id = h.hospital_id
            WHERE d.doctor_id = ?
        `, [req.params.id]);

        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctors[0]);
    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({ message: 'Error fetching doctor', error: error.message });
    }
});

// Register new doctor
router.post('/', async (req, res) => {
    const {
        hospital_id,
        specialization_id,
        doctor_name,
        doctor_phone,
        doctor_email,
        docLicenseNumber,
        password
    } = req.body;

    // Validate required fields
    if (!hospital_id || !specialization_id || !doctor_name || !doctor_phone || 
        !doctor_email || !docLicenseNumber || !password) {
        return res.status(400).json({ 
            message: 'Missing required fields',
            required: [
                'hospital_id', 'specialization_id', 'doctor_name', 
                'doctor_phone', 'doctor_email', 'docLicenseNumber', 'password'
            ]
        });
    }

    // Validate password length
    if (password.length < 8) {
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long'
        });
    }

    try {
        const pool = await getPool();
        
        // Check if email already exists
        const [existingEmail] = await pool.query(
            'SELECT doctor_id FROM Doctors WHERE doctor_email = ?',
            [doctor_email]
        );
        
        if (existingEmail.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check if license number already exists
        const [existingLicense] = await pool.query(
            'SELECT doctor_id FROM Doctors WHERE docLicenseNumber = ?',
            [docLicenseNumber]
        );
        
        if (existingLicense.length > 0) {
            return res.status(400).json({ message: 'License number already registered' });
        }

        // Verify hospital exists
        const [hospital] = await pool.query(
            'SELECT hospital_id FROM Hospital_Clinic WHERE hospital_id = ?',
            [hospital_id]
        );
        if (hospital.length === 0) {
            return res.status(400).json({ message: 'Invalid hospital ID' });
        }

        // Verify specialization exists
        const [specialization] = await pool.query(
            'SELECT specialization_id FROM Specializations WHERE specialization_id = ?',
            [specialization_id]
        );
        if (specialization.length === 0) {
            return res.status(400).json({ message: 'Invalid specialization ID' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            `INSERT INTO Doctors (
                hospital_id, specialization_id, doctor_name,
                doctor_phone, doctor_email, docLicenseNumber, password
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [hospital_id, specialization_id, doctor_name, doctor_phone, doctor_email, docLicenseNumber, hashedPassword]
        );

        // Create JWT token
        const token = jwt.sign(
            { 
                doctor_id: result.insertId,
                email: doctor_email,
                role: 'doctor'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'Doctor registered successfully',
            doctor_id: result.insertId,
            token
        });
    } catch (error) {
        console.error('Error registering doctor:', error);
        res.status(500).json({ message: 'Error registering doctor', error: error.message });
    }
});

// Update doctor
router.put('/:id', async (req, res) => {
    const doctorId = req.params.id;
    const {
        hospital_id,
        specialization_id,
        doctor_name,
        doctor_phone,
        doctor_email,
        docLicenseNumber
    } = req.body;

    try {
        const pool = await getPool();

        // Check if doctor exists
        const [existing] = await pool.query(
            'SELECT doctor_id FROM Doctors WHERE doctor_id = ?',
            [doctorId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // If email is being updated, check if new email is already in use
        if (doctor_email) {
            const [emailCheck] = await pool.query(
                'SELECT doctor_id FROM Doctors WHERE doctor_email = ? AND doctor_id != ?',
                [doctor_email, doctorId]
            );
            if (emailCheck.length > 0) {
                return res.status(400).json({ message: 'Email already in use by another doctor' });
            }
        }

        // If license number is being updated, check if it's already in use
        if (docLicenseNumber) {
            const [licenseCheck] = await pool.query(
                'SELECT doctor_id FROM Doctors WHERE docLicenseNumber = ? AND doctor_id != ?',
                [docLicenseNumber, doctorId]
            );
            if (licenseCheck.length > 0) {
                return res.status(400).json({ message: 'License number already in use by another doctor' });
            }
        }

        // Verify hospital if provided
        if (hospital_id) {
            const [hospital] = await pool.query(
                'SELECT hospital_id FROM Hospital_Clinic WHERE hospital_id = ?',
                [hospital_id]
            );
            if (hospital.length === 0) {
                return res.status(400).json({ message: 'Invalid hospital ID' });
            }
        }

        // Verify specialization if provided
        if (specialization_id) {
            const [specialization] = await pool.query(
                'SELECT specialization_id FROM Specializations WHERE specialization_id = ?',
                [specialization_id]
            );
            if (specialization.length === 0) {
                return res.status(400).json({ message: 'Invalid specialization ID' });
            }
        }

        const [result] = await pool.query(
            `UPDATE Doctors SET 
                hospital_id = COALESCE(?, hospital_id),
                specialization_id = COALESCE(?, specialization_id),
                doctor_name = COALESCE(?, doctor_name),
                doctor_phone = COALESCE(?, doctor_phone),
                doctor_email = COALESCE(?, doctor_email),
                docLicenseNumber = COALESCE(?, docLicenseNumber)
            WHERE doctor_id = ?`,
            [
                hospital_id, specialization_id, doctor_name,
                doctor_phone, doctor_email, docLicenseNumber,
                doctorId
            ]
        );

        res.json({ message: 'Doctor updated successfully' });
    } catch (error) {
        console.error('Error updating doctor:', error);
        res.status(500).json({ message: 'Error updating doctor', error: error.message });
    }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        
        // Check if doctor exists
        const [existing] = await pool.query(
            'SELECT doctor_id FROM Doctors WHERE doctor_id = ?',
            [req.params.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const [result] = await pool.query('DELETE FROM Doctors WHERE doctor_id = ?', [req.params.id]);
        res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        console.error('Error deleting doctor:', error);
        res.status(500).json({ message: 'Error deleting doctor', error: error.message });
    }
});

// Get doctor's appointments
router.get('/:id/appointments', async (req, res) => {
    try {
        const pool = await getPool();
        const [appointments] = await pool.query(`
            SELECT 
                a.*,
                p.patient_name,
                p.patient_phone,
                p.patient_email
            FROM Medical_Data a
            JOIN Patient p ON a.patient_id = p.patient_id
            WHERE a.doctor_id = ?
            ORDER BY a.visit_date DESC
        `, [req.params.id]);
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching doctor appointments:', error);
        res.status(500).json({ message: 'Error fetching doctor appointments', error: error.message });
    }
});

// Doctor login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const pool = await getPool();
        
        // Find doctor by email
        const [doctors] = await pool.query(
            'SELECT * FROM Doctors WHERE doctor_email = ?',
            [email]
        );

        if (doctors.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const doctor = doctors[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, doctor.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                doctor_id: doctor.doctor_id,
                email: doctor.doctor_email,
                role: 'doctor'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Return doctor data and token
        res.json({
            token,
            doctor: {
                doctor_id: doctor.doctor_id,
                doctor_name: doctor.doctor_name,
                doctor_email: doctor.doctor_email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
});

module.exports = router; 