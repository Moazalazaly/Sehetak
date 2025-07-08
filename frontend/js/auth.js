// Common functions for both login and signup
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function clearError(elementId) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function showMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.style.display = 'block';
}

// Password strength checker
function checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-bar');
    if (!strengthBar) return;

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]+/)) strength += 1;
    if (password.match(/[A-Z]+/)) strength += 1;
    if (password.match(/[0-9]+/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]+/)) strength += 1;

    strengthBar.className = 'password-strength-bar';
    if (strength <= 2) {
        strengthBar.classList.add('strength-weak');
    } else if (strength <= 4) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }
}

// Multi-step form handling
function setupMultiStepForm() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    const steps = form.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    let currentStep = 1;

    function showStep(stepNumber) {
        steps.forEach(step => {
            step.style.display = 'none';
        });
        document.querySelector(`.form-step[data-step="${stepNumber}"]`).style.display = 'block';

        // Update progress indicator
        progressSteps.forEach((step, index) => {
            if (index + 1 < stepNumber) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    // Next step button handler
    form.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', () => {
            const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            const inputs = currentStepElement.querySelectorAll('input, select, textarea');
            let isValid = true;

            // Validate current step
            inputs.forEach(input => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    showError(`${input.id}_error`, 'This field is required');
                    isValid = false;
                }
            });

            if (isValid) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    // Previous step button handler
    form.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
    });

    // Password strength indicator
    const passwordInput = form.querySelector('#password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
    }

    // Clear errors on input
    form.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('input', () => {
            clearError(`${element.id}_error`);
        });
    });
}

// Login form handling
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Basic validation
        if (!email || !password) {
            showMessage('Please fill in all fields', true);
            return;
        }

        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/patients/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                showMessage('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            } else {
                showMessage(data.message || 'Login failed', true);
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', true);
            console.error('Error:', error);
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    });
}

// Signup form handling
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    // Setup multi-step form
    setupMultiStepForm();

    // Fetch insurance providers when page loads
    async function fetchInsuranceProviders() {
        try {
            const response = await fetch('/api/insurance-providers');
            const data = await response.json();
            const select = document.getElementById('insurance_id');
            
            data.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider.insurance_id;
                option.textContent = provider.provider_name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching insurance providers:', error);
            showMessage('Error loading insurance providers', true);
        }
    }

    // Form validation
    function validateForm() {
        let isValid = true;
        const errors = {};

        // Name validation
        const name = document.getElementById('patient_name').value.trim();
        if (name.length < 2) {
            errors.patient_name = 'Name must be at least 2 characters long';
            isValid = false;
        }

        // Phone validation
        const phone = document.getElementById('patient_phone').value.trim();
        if (!/^[0-9]{10,}$/.test(phone)) {
            errors.patient_phone = 'Phone number must be at least 10 digits';
            isValid = false;
        }

        // Email validation
        const email = document.getElementById('patient_email').value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.patient_email = 'Please enter a valid email address';
            isValid = false;
        }

        // Birth date validation
        const birthDate = document.getElementById('P_birth_date').value;
        if (!birthDate) {
            errors.P_birth_date = 'Birth date is required';
            isValid = false;
        } else {
            const date = new Date(birthDate);
            const today = new Date();
            if (date >= today) {
                errors.P_birth_date = 'Birth date must be in the past';
                isValid = false;
            }
        }

        // Address validation
        const address = document.getElementById('patient_address').value.trim();
        if (!address) {
            errors.patient_address = 'Address is required';
            isValid = false;
        }

        // Blood type validation
        const bloodtype = document.getElementById('bloodtype').value;
        const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validBloodTypes.includes(bloodtype)) {
            errors.bloodtype = 'Please select a valid blood type';
            isValid = false;
        }

        // Gender validation
        const gender = document.getElementById('gender').value;
        const validGenders = ['M', 'F', 'O', 'Male', 'Female', 'Other'];
        if (!validGenders.includes(gender)) {
            errors.gender = 'Please select a valid gender';
            isValid = false;
        }

        // Emergency contact validation
        const emergencyContact = document.getElementById('p_emergency_contact').value.trim();
        if (!emergencyContact) {
            errors.p_emergency_contact = 'Emergency contact name is required';
            isValid = false;
        }

        const emergencyPhone = document.getElementById('emergency_contact_phone').value.trim();
        if (!/^[0-9]{10,}$/.test(emergencyPhone)) {
            errors.emergency_contact_phone = 'Emergency contact phone must be at least 10 digits';
            isValid = false;
        }

        // Password validation
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters long';
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            errors.confirm_password = 'Passwords do not match';
            isValid = false;
        }

        // Display errors
        Object.keys(errors).forEach(key => {
            showError(`${key}_error`, errors[key]);
        });

        return isValid;
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const submitButton = signupForm.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        // Clear any existing messages
        showMessage('', false);

        const formData = {
            insurance_id: document.getElementById('insurance_id').value || null,
            patient_name: document.getElementById('patient_name').value.trim(),
            patient_phone: document.getElementById('patient_phone').value.trim(),
            patient_email: document.getElementById('patient_email').value.trim(),
            P_birth_date: document.getElementById('P_birth_date').value,
            patient_address: document.getElementById('patient_address').value.trim(),
            bloodtype: document.getElementById('bloodtype').value,
            gender: document.getElementById('gender').value,
            p_emergency_contact: document.getElementById('p_emergency_contact').value.trim(),
            emergency_contact_phone: document.getElementById('emergency_contact_phone').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            console.log('Sending registration request:', { ...formData, password: '[REDACTED]' });
            
            const response = await fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('Registration response:', data);
            
            if (response.ok) {
                showMessage('Registration successful! Redirecting to login...');
                signupForm.reset();
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                // Handle specific error cases
                if (data.missingFields) {
                    showMessage(`Missing required fields: ${data.missingFields.join(', ')}`, true);
                } else if (data.error === 'Email already registered') {
                    showMessage('This email address is already registered. Please use a different email or try logging in.', true);
                } else if (data.error === 'Database schema error') {
                    showMessage('There was a problem with the database. Please contact support.', true);
                } else {
                    showMessage(data.message || 'Registration failed. Please try again.', true);
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('An error occurred while connecting to the server. Please check your internet connection and try again.', true);
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    });

    // Fetch insurance providers when page loads
    fetchInsuranceProviders();
} 