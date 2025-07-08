const express = require('express');
const cors = require('cors');
const path = require('path');
const { getPool } = require('./config/db.config');

// Import routes
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const documentRoutes = require('./backend/routes/documents');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Increase payload limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Define the base path for static files
const staticPath = path.join(__dirname, 'medical project', 'medical-landing-page');

// Serve static files from the medical landing page directory
app.use(express.static(staticPath));

// API Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/documents', documentRoutes);

// Test database connection
app.get('/api/test', async (req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT 1');
        res.json({ message: 'Database connection successful!' });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
            message: 'Database connection failed', 
            error: error.message
        });
    }
});

// Serve specific pages with exact paths
app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'home', 'home.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(staticPath, 'home', 'home.html'));
});

app.get('/home.html', (req, res) => {
    res.sendFile(path.join(staticPath, 'home', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(staticPath, 'sign up', 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(staticPath, 'sign up', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(staticPath, 'sign up', 'role-select.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(staticPath, 'sign up', 'signup.html'));
});

app.get('/role-select', (req, res) => {
    res.sendFile(path.join(staticPath, 'sign up', 'role-select.html'));
});

app.get('/role-select.html', (req, res) => {
    res.sendFile(path.join(staticPath, 'sign up', 'role-select.html'));
});

// Dashboard routes
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(staticPath, 'dashboard', 'dashboard.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(staticPath, 'dashboard', 'dashboard.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(staticPath, 'profile', 'profile.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(staticPath, 'profile', 'profile.html'));
});

// Handle 404s gracefully
app.use((req, res) => {
    console.log('404 Not Found:', req.url); // Add logging to help debug
    res.status(404).send('Page not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
}); 