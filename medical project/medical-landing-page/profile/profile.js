// Update profile.js
document.addEventListener('DOMContentLoaded', async function() {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    console.log('User Data in Profile:', userData);
    
    if (userData) {
        try {
            // Fetch complete user data from server
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/${userData.role}s/${userData.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const serverData = await response.json();
            console.log('Server Data:', serverData);

            // Merge server data with local data
            const completeUserData = {
                ...userData,
                ...serverData,
                // Map server fields to local fields
                phone: serverData.patient_phone || serverData.doctor_phone,
                address: serverData.patient_address || serverData.clinic_address,
                bloodType: serverData.bloodtype,
                emergencyContact: serverData.p_emergency_contact,
                insurance: serverData.insurance_provider_name,
                dob: serverData.P_birth_date,
                // For doctors
                specialty: serverData.specialization_name,
                license: serverData.docLicenseNumber,
                affiliation: serverData.hospital_name
            };

            // Update localStorage with complete data
            localStorage.setItem('userData', JSON.stringify(completeUserData));

            // Update profile display
            updateProfileDisplay(completeUserData);
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Fallback to local data if server fetch fails
            updateProfileDisplay(userData);
        }
    } else {
        console.log('No user data found in localStorage');
        window.location.href = '../home/home.html';
    }
});

// Update profile display with user data
function updateProfileDisplay(userData) {
    // Update profile header
    document.getElementById('profile-name').textContent = userData.name || '-';
    document.getElementById('profile-role').textContent = userData.role === 'doctor' ? 'Doctor' : 'Patient';
    
    // Update settings user name
    document.getElementById('settings-user-name').textContent = userData.name || '-';
    
    // Update basic information
    document.getElementById('info-name').textContent = userData.name || '-';
    document.getElementById('info-email').textContent = userData.email || '-';
    document.getElementById('info-phone').textContent = userData.phone || '-';
    document.getElementById('info-address').textContent = userData.address || '-';
    
    // Show/hide sections based on role
    if (userData.role === 'doctor') {
        document.getElementById('professional-info').style.display = 'block';
        document.getElementById('medical-info').style.display = 'none';
        
        // Update professional information
        document.getElementById('info-specialty').textContent = userData.specialty || '-';
        document.getElementById('info-license').textContent = userData.license || '-';
        document.getElementById('info-experience').textContent = userData.experience || '-';
        document.getElementById('info-affiliation').textContent = userData.affiliation || '-';
    } else {
        document.getElementById('professional-info').style.display = 'none';
        document.getElementById('medical-info').style.display = 'block';
        
        // Update medical information
        document.getElementById('info-blood-type').textContent = userData.bloodType || '-';
        document.getElementById('info-allergies').textContent = userData.allergies || '-';
        document.getElementById('info-conditions').textContent = userData.conditions || '-';
        document.getElementById('info-emergency').textContent = userData.emergencyContact || '-';
        document.getElementById('info-insurance').textContent = userData.insurance || '-';
        document.getElementById('info-language').textContent = userData.preferredLanguage || '-';
        document.getElementById('info-dob').textContent = userData.dob || '-';
    }
}

// Settings navigation toggle
function toggleSettings() {
    const settingsNav = document.getElementById('settingsNav');
    settingsNav.classList.toggle('active');
}

// Edit profile function
function editProfile() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;

    // Show the modal
    const modal = document.getElementById('editProfileModal');
    modal.classList.add('active');

    // Populate form fields with current data
    document.getElementById('edit-name').value = userData.name || '';
    document.getElementById('edit-email').value = userData.email || '';
    document.getElementById('edit-phone').value = userData.phone || '';
    document.getElementById('edit-address').value = userData.address || '';

    // Show/hide and populate role-specific fields
    if (userData.role === 'doctor') {
        document.getElementById('edit-professional-info').style.display = 'block';
        document.getElementById('edit-medical-info').style.display = 'none';
        
        document.getElementById('edit-specialty').value = userData.specialty || '';
        document.getElementById('edit-license').value = userData.license || '';
        document.getElementById('edit-experience').value = userData.experience || '';
        document.getElementById('edit-affiliation').value = userData.affiliation || '';
    } else {
        document.getElementById('edit-professional-info').style.display = 'none';
        document.getElementById('edit-medical-info').style.display = 'block';
        
        document.getElementById('edit-blood-type').value = userData.bloodType || '';
        document.getElementById('edit-allergies').value = userData.allergies || '';
        document.getElementById('edit-conditions').value = userData.conditions || '';
        document.getElementById('edit-emergency').value = userData.emergencyContact || '';
        document.getElementById('edit-insurance').value = userData.insurance || '';
        document.getElementById('edit-language').value = userData.preferredLanguage || '';
        document.getElementById('edit-dob').value = userData.dob || '';
    }
}

// Close edit profile modal
function closeEditProfile() {
    const modal = document.getElementById('editProfileModal');
    modal.classList.remove('active');
}

// Save profile changes
function saveProfileChanges(event) {
    event.preventDefault();
    
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;

    // Get form data
    const formData = new FormData(event.target);
    const updatedData = { ...userData };

    // Update basic information
    updatedData.name = formData.get('name');
    updatedData.email = formData.get('email');
    updatedData.phone = formData.get('phone');
    updatedData.address = formData.get('address');

    // Update role-specific information
    if (userData.role === 'doctor') {
        updatedData.specialty = formData.get('specialty');
        updatedData.license = formData.get('license');
        updatedData.experience = formData.get('experience');
        updatedData.affiliation = formData.get('affiliation');
    } else {
        updatedData.bloodType = formData.get('bloodType');
        updatedData.allergies = formData.get('allergies');
        updatedData.conditions = formData.get('conditions');
        updatedData.emergencyContact = formData.get('emergencyContact');
        updatedData.insurance = formData.get('insurance');
        updatedData.preferredLanguage = formData.get('preferredLanguage');
        updatedData.dob = formData.get('dob');
    }

    // Save updated data
    localStorage.setItem('userData', JSON.stringify(updatedData));

    // Update display
    updateProfileDisplay(updatedData);

    // Close modal
    closeEditProfile();

    // Show success message
    alert('Profile updated successfully!');
}