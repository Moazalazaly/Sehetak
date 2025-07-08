// Add this to your signup.js file

function showForm(role) {
    // Hide the role selection section
    document.getElementById('choose').style.display = 'none';
    
    // Show the appropriate form
    if (role === 'doctor') {
        document.getElementById('doctor-form').style.display = 'block';
    } else {
        document.getElementById('patient-form').style.display = 'block';
    }
}

// Add form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    const doctorForm = document.querySelector('#doctor-form form');
    const patientForm = document.querySelector('#patient-form form');

    doctorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Handle doctor form submission
        const formData = {
            name: document.getElementById('doctor-name').value,
            email: document.getElementById('doctor-email').value,
            specialty: document.getElementById('doctor-specialty').value,
            license: document.getElementById('doctor-license').value,
            password: document.getElementById('doctor-password').value
        };
        console.log('Doctor registration:', formData);
        // Add your API call or form processing logic here
    });

    patientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Handle patient form submission
        const formData = {
            name: document.getElementById('patient-name').value,
            email: document.getElementById('patient-email').value,
            dob: document.getElementById('patient-dob').value,
            phone: document.getElementById('patient-phone').value,
            password: document.getElementById('patient-password').value
        };
        console.log('Patient registration:', formData);
        // Add your API call or form processing logic here
    });
});

// Update your signup.js

// Function to show form and save state
function showForm(role) {
    // Hide the role selection section
    document.getElementById('choose').style.display = 'none';
    
    // Show the appropriate form
    if (role === 'doctor') {
        document.getElementById('doctor-form').style.display = 'block';
    } else {
        document.getElementById('patient-form').style.display = 'block';
    }
    
    // Save the current state
    localStorage.setItem('currentForm', role);
}

// Function to go back to role selection
function goBack() {
    // Hide all forms
    document.querySelectorAll('.form-section').forEach(form => {
        form.style.display = 'none';
    });
    
    // Show role selection
    document.getElementById('choose').style.display = 'block';
    
    // Clear the saved state
    localStorage.removeItem('currentForm');
}

// Check for saved state on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedForm = localStorage.getItem('currentForm');
    if (savedForm) {
        showForm(savedForm);
    }

    // Existing form submission handlers
    const doctorForm = document.querySelector('#doctor-form form');
    const patientForm = document.querySelector('#patient-form form');

    doctorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('doctor-name').value,
            email: document.getElementById('doctor-email').value,
            specialty: document.getElementById('doctor-specialty').value,
            license: document.getElementById('doctor-license').value,
            password: document.getElementById('doctor-password').value
        };
        console.log('Doctor registration:', formData);
        // Add your API call or form processing logic here
    });

    patientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('patient-name').value,
            email: document.getElementById('patient-email').value,
            dob: document.getElementById('patient-dob').value,
            phone: document.getElementById('patient-phone').value,
            password: document.getElementById('patient-password').value
        };
        console.log('Patient registration:', formData);
        // Add your API call or form processing logic here
    });
});

// Add to your signup.js

function showProfileForm(role) {
    // Hide the registration form
    document.getElementById(`${role}-form`).style.display = 'none';
    
    // Show the profile completion form
    document.getElementById(`${role}-profile`).style.display = 'block';
    
    // Save the current state
    localStorage.setItem('currentForm', `${role}-profile`);
}

function goBackToRegistration(role) {
    // Hide profile form
    document.getElementById(`${role}-profile`).style.display = 'none';
    
    // Show registration form
    document.getElementById(`${role}-form`).style.display = 'block';
    
    // Update saved state
    localStorage.setItem('currentForm', role);
}

// Update the form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    const doctorForm = document.querySelector('#doctor-form form');
    const patientForm = document.querySelector('#patient-form form');
    const doctorProfileForm = document.querySelector('#doctor-profile form');
    const patientProfileForm = document.querySelector('#patient-profile form');

    // Handle initial registration forms
    doctorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('doctor-name').value,
            email: document.getElementById('doctor-email').value,
            specialty: document.getElementById('doctor-specialty').value,
            license: document.getElementById('doctor-license').value,
            password: document.getElementById('doctor-password').value
        };
        // Save initial data to localStorage
        localStorage.setItem('doctorData', JSON.stringify(formData));
        showProfileForm('doctor');
    });

    patientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('patient-name').value,
            email: document.getElementById('patient-email').value,
            dob: document.getElementById('patient-dob').value,
            phone: document.getElementById('patient-phone').value,
            address: document.getElementById('patient-address').value,
            password: document.getElementById('patient-password').value
        };
        // Save initial data to localStorage
        localStorage.setItem('patientData', JSON.stringify(formData));
        showProfileForm('patient');
    });

    // Handle profile completion forms
    doctorProfileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Log the initial data
        const initialData = JSON.parse(localStorage.getItem('doctorData'));
        console.log('Initial Data:', initialData);
        
        try {
            // First, register the doctor with the server
            const registerResponse = await fetch('http://localhost:5000/api/doctors/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: initialData.name,
                    email: initialData.email,
                    password: initialData.password,
                    specialty: initialData.specialty,
                    license: initialData.license
                })
            });

            if (!registerResponse.ok) {
                throw new Error('Failed to register doctor');
            }

            const serverData = await registerResponse.json();
            
            // Create profile data with explicit field assignments
            const profileData = {
                id: serverData.user_id, // Add the user ID from server
                // Initial registration data
                name: initialData.name,
                email: initialData.email,
                specialty: initialData.specialty,
                license: initialData.license,
                password: initialData.password,
                
                // Profile completion data
                experience: document.getElementById('doctor-experience').value,
                affiliation: document.getElementById('doctor-affiliation').value,
                workingHours: document.getElementById('doctor-hours').value,
                languages: document.getElementById('doctor-languages').value,
                education: document.getElementById('doctor-education').value,
                certifications: document.getElementById('doctor-certifications').value,
                role: 'doctor'
            };
            
            // Log the final profile data
            console.log('Profile Data:', profileData);
            
            // Save complete user data
            localStorage.setItem('userData', JSON.stringify(profileData));
            
            // Clear temporary data
            localStorage.removeItem('doctorData');
            localStorage.removeItem('currentForm');
            
            window.location.href = '../dashboard/dashboard.html';
        } catch (error) {
            console.error('Registration error:', error);
            alert('Failed to register. Please try again.');
        }
    });

    patientProfileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Log the initial data
        const initialData = JSON.parse(localStorage.getItem('patientData'));
        console.log('Initial Data:', initialData);
        
        try {
            // First, register the patient with the server
            const registerResponse = await fetch('http://localhost:5000/api/patients/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: initialData.name,
                    email: initialData.email,
                    password: initialData.password,
                    dob: initialData.dob,
                    phone: initialData.phone,
                    address: initialData.address
                })
            });

            if (!registerResponse.ok) {
                throw new Error('Failed to register patient');
            }

            const serverData = await registerResponse.json();
            
            // Create profile data with explicit field assignments
            const profileData = {
                id: serverData.user_id, // Add the user ID from server
                // Initial registration data
                name: initialData.name,
                email: initialData.email,
                dob: initialData.dob,
                phone: initialData.phone,
                address: initialData.address,
                password: initialData.password,
                
                // Profile completion data
                bloodType: document.getElementById('patient-blood-type').value,
                allergies: document.getElementById('patient-allergies').value,
                conditions: document.getElementById('patient-conditions').value,
                emergencyContact: document.getElementById('patient-emergency').value,
                insurance: document.getElementById('patient-insurance').value,
                preferredLanguage: document.getElementById('patient-language').value,
                role: 'patient'
            };
            
            // Log the final profile data
            console.log('Profile Data:', profileData);
            
            // Save complete user data
            localStorage.setItem('userData', JSON.stringify(profileData));
            
            // Clear temporary data
            localStorage.removeItem('patientData');
            localStorage.removeItem('currentForm');
            
            window.location.href = '../dashboard/dashboard.html';
        } catch (error) {
            console.error('Registration error:', error);
            alert('Failed to register. Please try again.');
        }
    });
});

// signup.js

// Form display and navigation functions
function showForm(role) {
    document.getElementById('choose').style.display = 'none';
    document.getElementById(`${role}-form`).style.display = 'block';
    localStorage.setItem('currentForm', role);
}

function goBack() {
    document.querySelectorAll('.form-section').forEach(form => {
        form.style.display = 'none';
    });
    document.getElementById('choose').style.display = 'block';
    localStorage.removeItem('currentForm');
}

function showProfileForm(role) {
    document.getElementById(`${role}-form`).style.display = 'none';
    document.getElementById(`${role}-profile`).style.display = 'block';
    localStorage.setItem('currentForm', `${role}-profile`);
}

function goBackToRegistration(role) {
    document.getElementById(`${role}-profile`).style.display = 'none';
    document.getElementById(`${role}-form`).style.display = 'block';
    localStorage.setItem('currentForm', role);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Restore previous form state if exists
    const savedForm = localStorage.getItem('currentForm');
    if (savedForm) {
        if (savedForm.includes('profile')) {
            showProfileForm(savedForm.split('-')[0]);
        } else {
            showForm(savedForm);
        }
    }

    // Get all forms
    const doctorForm = document.querySelector('#doctor-form form');
    const patientForm = document.querySelector('#patient-form form');
    const doctorProfileForm = document.querySelector('#doctor-profile form');
    const patientProfileForm = document.querySelector('#patient-profile form');

    // Handle initial registration forms
    doctorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('doctor-name').value,
            email: document.getElementById('doctor-email').value,
            specialty: document.getElementById('doctor-specialty').value,
            license: document.getElementById('doctor-license').value,
            password: document.getElementById('doctor-password').value
        };
        // Save initial data to localStorage
        localStorage.setItem('doctorData', JSON.stringify(formData));
        showProfileForm('doctor');
    });

    patientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('patient-name').value,
            email: document.getElementById('patient-email').value,
            dob: document.getElementById('patient-dob').value,
            phone: document.getElementById('patient-phone').value,
            address: document.getElementById('patient-address').value,
            password: document.getElementById('patient-password').value
        };
        // Save initial data to localStorage
        localStorage.setItem('patientData', JSON.stringify(formData));
        showProfileForm('patient');
    });

    // Handle profile completion forms
    doctorProfileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Log the initial data
        const initialData = JSON.parse(localStorage.getItem('doctorData'));
        console.log('Initial Data:', initialData);
        
        try {
            // First, register the doctor with the server
            const registerResponse = await fetch('http://localhost:5000/api/doctors/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: initialData.name,
                    email: initialData.email,
                    password: initialData.password,
                    specialty: initialData.specialty,
                    license: initialData.license
                })
            });

            if (!registerResponse.ok) {
                throw new Error('Failed to register doctor');
            }

            const serverData = await registerResponse.json();
            
            // Create profile data with explicit field assignments
            const profileData = {
                id: serverData.user_id, // Add the user ID from server
                // Initial registration data
                name: initialData.name,
                email: initialData.email,
                specialty: initialData.specialty,
                license: initialData.license,
                password: initialData.password,
                
                // Profile completion data
                experience: document.getElementById('doctor-experience').value,
                affiliation: document.getElementById('doctor-affiliation').value,
                workingHours: document.getElementById('doctor-hours').value,
                languages: document.getElementById('doctor-languages').value,
                education: document.getElementById('doctor-education').value,
                certifications: document.getElementById('doctor-certifications').value,
                role: 'doctor'
            };
            
            // Log the final profile data
            console.log('Profile Data:', profileData);
            
            // Save complete user data
            localStorage.setItem('userData', JSON.stringify(profileData));
            
            // Clear temporary data
            localStorage.removeItem('doctorData');
            localStorage.removeItem('currentForm');
            
            window.location.href = '../dashboard/dashboard.html';
        } catch (error) {
            console.error('Registration error:', error);
            alert('Failed to register. Please try again.');
        }
    });

    patientProfileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Log the initial data
        const initialData = JSON.parse(localStorage.getItem('patientData'));
        console.log('Initial Data:', initialData);
        
        try {
            // First, register the patient with the server
            const registerResponse = await fetch('http://localhost:5000/api/patients/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: initialData.name,
                    email: initialData.email,
                    password: initialData.password,
                    dob: initialData.dob,
                    phone: initialData.phone,
                    address: initialData.address
                })
            });

            if (!registerResponse.ok) {
                throw new Error('Failed to register patient');
            }

            const serverData = await registerResponse.json();
            
            // Create profile data with explicit field assignments
            const profileData = {
                id: serverData.user_id, // Add the user ID from server
                // Initial registration data
                name: initialData.name,
                email: initialData.email,
                dob: initialData.dob,
                phone: initialData.phone,
                address: initialData.address,
                password: initialData.password,
                
                // Profile completion data
                bloodType: document.getElementById('patient-blood-type').value,
                allergies: document.getElementById('patient-allergies').value,
                conditions: document.getElementById('patient-conditions').value,
                emergencyContact: document.getElementById('patient-emergency').value,
                insurance: document.getElementById('patient-insurance').value,
                preferredLanguage: document.getElementById('patient-language').value,
                role: 'patient'
            };
            
            // Log the final profile data
            console.log('Profile Data:', profileData);
            
            // Save complete user data
            localStorage.setItem('userData', JSON.stringify(profileData));
            
            // Clear temporary data
            localStorage.removeItem('patientData');
            localStorage.removeItem('currentForm');
            
            window.location.href = '../dashboard/dashboard.html';
        } catch (error) {
            console.error('Registration error:', error);
            alert('Failed to register. Please try again.');
        }
    });
});