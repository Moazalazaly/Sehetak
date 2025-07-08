const express = require('express');
const router = express.Router();
const { getPool } = require('../../config/db.config');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept common document and image types
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, images, and Office documents are allowed.'));
        }
    }
});

// Helper function to verify user exists
async function verifyUser(userId) {
    const pool = await getPool();
    const [users] = await pool.query(
        'SELECT user_id, username FROM Users WHERE user_id = ?',
        [userId]
    );
    if (users.length === 0) {
        throw new Error(`User with ID ${userId} not found`);
    }
    return users[0];
}

// Get all document categories
router.get('/categories', async (req, res) => {
    try {
        const pool = await getPool();
        const [categories] = await pool.query('SELECT * FROM Document_Categories ORDER BY category_name');
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// Get document versions (specific route)
router.get('/versions/:documentId', async (req, res) => {
    try {
        const pool = await getPool();
        const [versions] = await pool.query(
            `SELECT 
                dv.*,
                u.username as uploaded_by_username
            FROM Document_Versions dv
            JOIN Users u ON dv.uploaded_by_user_id = u.user_id
            WHERE dv.document_id = ?
            ORDER BY dv.version_number DESC`,
            [req.params.documentId]
        );
        res.json(versions);
    } catch (error) {
        console.error('Error fetching versions:', error);
        res.status(500).json({ message: 'Error fetching versions' });
    }
});

// Download a specific document (specific route)
router.get('/download/:documentId', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Verify user exists
        await verifyUser(userId);

        const pool = await getPool();
        const [documents] = await pool.query(
            `SELECT 
                d.*,
                ds.permission_level
            FROM Documents d
            LEFT JOIN Document_Sharing ds ON d.id = ds.document_id 
                AND ds.shared_with_user_id = ? AND ds.is_active = TRUE
            WHERE d.id = ? AND (d.user_id = ? OR ds.shared_with_user_id = ?)`,
            [userId, req.params.documentId, userId, userId]
        );

        if (documents.length === 0) {
            return res.status(404).json({ message: 'Document not found or access denied' });
        }

        const document = documents[0];
        
        // Check if user has permission to view
        if (document.user_id !== parseInt(userId) && 
            (!document.permission_level || document.permission_level === 'delete')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.setHeader('Content-Type', document.file_type);
        res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
        res.send(document.file_data);
    } catch (error) {
        console.error('Error downloading document:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error downloading document' });
    }
});

// Delete a specific document (specific route)
router.delete('/:documentId', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Verify user exists
        await verifyUser(userId);

        const pool = await getPool();
        
        // Check if user has permission to delete
        const [documents] = await pool.query(
            `SELECT 
                d.user_id,
                ds.permission_level
            FROM Documents d
            LEFT JOIN Document_Sharing ds ON d.id = ds.document_id 
                AND ds.shared_with_user_id = ? AND ds.is_active = TRUE
            WHERE d.id = ? AND (d.user_id = ? OR ds.permission_level = 'delete')`,
            [userId, req.params.documentId, userId]
        );

        if (documents.length === 0) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await pool.query('DELETE FROM Documents WHERE id = ?', [req.params.documentId]);
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error deleting document' });
    }
});

// Upload a new document
router.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Upload request received:', {
        body: req.body,
        file: req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : null
    });

    try {
        const { userId, type, description, categoryId } = req.body;
        const file = req.file;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        if (!type) {
            return res.status(400).json({ message: 'Document type is required' });
        }

        // Verify user exists
        await verifyUser(userId);

        // Validate file size
        if (file.size > 50 * 1024 * 1024) { // 50MB
            return res.status(400).json({ message: 'File size exceeds 50MB limit' });
        }

        const pool = await getPool();
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Insert the document
            const [result] = await connection.query(
                `INSERT INTO Documents (
                    user_id, category_id, type, description, 
                    file_name, file_type, file_data, file_size
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, 
                    categoryId || null, 
                    type, 
                    description || null, 
                    file.originalname, 
                    file.mimetype, 
                    file.buffer,
                    file.size
                ]
            );

            // Create initial version
            await connection.query(
                `INSERT INTO Document_Versions (
                    document_id, version_number, file_name, 
                    file_type, file_data, uploaded_by_user_id, 
                    change_description
                ) VALUES (?, 1, ?, ?, ?, ?, ?)`,
                [
                    result.insertId,
                    file.originalname,
                    file.mimetype,
                    file.buffer,
                    userId,
                    'Initial version'
                ]
            );

            await connection.commit();
            
            console.log('Document uploaded successfully:', {
                documentId: result.insertId,
                fileName: file.originalname,
                fileSize: file.size
            });

            res.json({ 
                message: 'Document uploaded successfully',
                documentId: result.insertId 
            });
        } catch (error) {
            await connection.rollback();
            console.error('Transaction error:', error);
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ 
            message: 'Error uploading document',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all documents for a user (generic route - must be last)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verify user exists
        await verifyUser(userId);

        const pool = await getPool();
        const [documents] = await pool.query(`
            SELECT 
                d.*,
                dc.category_name,
                u.username as owner_name,
                CASE 
                    WHEN d.user_id = ? THEN 'owner'
                    WHEN ds.permission_level IS NOT NULL THEN ds.permission_level
                    ELSE NULL
                END as access_level
            FROM Documents d
            LEFT JOIN Document_Categories dc ON d.category_id = dc.category_id
            LEFT JOIN Users u ON d.user_id = u.user_id
            LEFT JOIN Document_Sharing ds ON d.id = ds.document_id AND ds.shared_with_user_id = ?
            WHERE d.user_id = ? OR ds.shared_with_user_id = ?
            ORDER BY d.upload_date DESC
        `, [userId, userId, userId, userId]);
        
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error fetching documents' });
    }
});

module.exports = router; 