// medical-landing-page/dashboard/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    console.log('Initial User Data:', userData); // Debug log
    
    if (!userData || !userData.id) {
        console.log('No user data found, redirecting to home');
        window.location.href = '../home/home.html';
        return;
    }

    // Update welcome message
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) {
        welcomeName.textContent = userData.name;
    }

    // Initialize document management
    initializeDocumentManagement();

    // Bind documents card click handler
    const documentsCard = document.getElementById('documentsCard');
    if (documentsCard) {
        documentsCard.onclick = function(e) {
            e.preventDefault();
            console.log('Documents card clicked');
            const modal = document.getElementById('documentModal');
            if (modal) {
                modal.style.display = 'block';
                loadUserDocuments(); // Load documents when modal opens
            }
        };
    }

    // Update navigation based on user role
    const profileLink = document.getElementById('profile-link');
    const appointmentsLink = document.getElementById('appointments-link');
    const messagesLink = document.getElementById('messages-link');

    if (userData.role === 'doctor') {
        profileLink.textContent = 'Doctor Profile';
        appointmentsLink.textContent = 'Patient Appointments';
        messagesLink.textContent = 'Patient Messages';
    } else {
        profileLink.textContent = 'Patient Profile';
        appointmentsLink.textContent = 'My Appointments';
        messagesLink.textContent = 'Doctor Messages';
    }

    // Update settings user name
    const settingsUserName = document.getElementById('settings-user-name');
    if (settingsUserName) settingsUserName.textContent = userData.name;
});

// Mobile navigation function
function showSidenav() {
    // Add your mobile navigation logic here
    console.log('Mobile navigation clicked');
}

// Add to dashboard.js
function toggleSettings() {
    const settingsNav = document.getElementById('settingsNav');
    const overlay = document.querySelector('.settings-overlay');
    
    if (!overlay) {
        // Create overlay if it doesn't exist
        const newOverlay = document.createElement('div');
        newOverlay.className = 'settings-overlay';
        document.body.appendChild(newOverlay);
    }
    
    settingsNav.classList.toggle('active');
    document.querySelector('.settings-overlay').classList.toggle('active');
    
    // Close settings when clicking overlay
    document.querySelector('.settings-overlay').onclick = function() {
        settingsNav.classList.remove('active');
        this.classList.remove('active');
    };
}

// Document Management Functions
function initializeDocumentManagement() {
    const uploadButton = document.getElementById('uploadButton');
    if (!uploadButton) {
        console.error('Upload button not found');
        return;
    }

    uploadButton.onclick = async function() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData.id) {
            alert('Please log in to upload documents');
            return;
        }

        const fileInput = document.getElementById('documentFile');
        const documentType = document.getElementById('documentType').value;
        const description = document.getElementById('documentDescription').value;

        // Validation
        if (!fileInput.files[0]) {
            alert('Please select a file to upload');
            return;
        }
        if (!documentType) {
            alert('Please select a document type');
            return;
        }

        // Disable button and show loading state
        const button = this;
        const originalButtonText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        try {
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    // Get existing documents
                    const documentsKey = `documents_${userData.id}`;
                    const existingDocs = localStorage.getItem(documentsKey);
                    console.log('Existing Documents:', existingDocs); // Debug log
                    
                    const documents = JSON.parse(existingDocs || '[]');
                    console.log('Parsed Documents:', documents); // Debug log

                    // Check file size limits
                    const fileSize = file.size;
                    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0) + fileSize;
                    
                    if (fileSize > 5 * 1024 * 1024) {
                        throw new Error('File size exceeds 5MB limit');
                    }
                    if (totalSize > 50 * 1024 * 1024) {
                        throw new Error('Total storage limit (50MB) exceeded. Please delete some documents first.');
                    }

                    // Create document object
                    const newDocument = {
                        id: Date.now().toString(),
                        type: documentType,
                        description: description,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: fileSize,
                        fileData: e.target.result,
                        uploadDate: new Date().toISOString(),
                        userId: userData.id
                    };

                    console.log('New Document:', newDocument); // Debug log

                    // Save document
                    documents.push(newDocument);
                    const documentsString = JSON.stringify(documents);
                    console.log('Saving Documents:', documentsString); // Debug log
                    
                    localStorage.setItem(documentsKey, documentsString);
                    
                    // Verify storage
                    const verifyDocs = localStorage.getItem(documentsKey);
                    console.log('Verified Storage:', verifyDocs); // Debug log

                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'success-message';
                    successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Document uploaded successfully!';
                    successMessage.style.cssText = 'background-color: #4CAF50; color: white; padding: 10px; margin: 10px 0; border-radius: 4px; text-align: center;';
                    const uploadSection = document.querySelector('.upload-section');
                    uploadSection.insertAdjacentElement('beforebegin', successMessage);

                    // Remove success message after 3 seconds
                    setTimeout(() => successMessage.remove(), 3000);

                    // Reset inputs
                    fileInput.value = '';
                    document.getElementById('documentType').value = '';
                    document.getElementById('documentDescription').value = '';

                    // Refresh documents list
                    loadUserDocuments();

                } catch (error) {
                    console.error('Error saving document:', error);
                    alert(error.message || 'Failed to save document. Please try again.');
                } finally {
                    // Reset button state
                    button.disabled = false;
                    button.innerHTML = originalButtonText;
                }
            };

            reader.onerror = function() {
                console.error('FileReader error:', this.error);
                alert('Error reading file');
                button.disabled = false;
                button.innerHTML = originalButtonText;
            };

            // Start reading the file
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document. Please try again.');
            button.disabled = false;
            button.innerHTML = originalButtonText;
        }
    };

    // Add event listeners for close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.onclick = function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                if (modal.id === 'documentModal') {
                    // Reset inputs
                    document.getElementById('documentFile').value = '';
                    document.getElementById('documentType').value = '';
                    document.getElementById('documentDescription').value = '';
                }
            }
        };
    });

    // Add click outside handler for modals
    window.onclick = function(event) {
        const uploadModal = document.getElementById('documentModal');
        const viewerModal = document.getElementById('documentViewerModal');
        
        if (event.target === uploadModal) {
            uploadModal.style.display = 'none';
            // Reset inputs
            document.getElementById('documentFile').value = '';
            document.getElementById('documentType').value = '';
            document.getElementById('documentDescription').value = '';
        } else if (event.target === viewerModal) {
            viewerModal.style.display = 'none';
            const viewer = document.getElementById('documentViewer');
            if (viewer) viewer.innerHTML = '';
        }
    };
}

// Document Loading and Display
function loadUserDocuments() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    console.log('Loading Documents - User Data:', userData);
    
    if (!userData || !userData.id) {
        console.log('No user data found when loading documents');
        alert('Please log in to view documents');
        return;
    }

    try {
        const documentsKey = `documents_${userData.id}`;
        console.log('Loading Documents - Key:', documentsKey);
        
        const storedDocs = localStorage.getItem(documentsKey);
        console.log('Loading Documents - Stored Data:', storedDocs);
        
        const documents = JSON.parse(storedDocs || '[]');
        console.log('Loading Documents - Parsed Data:', documents);
        
        displayDocuments(documents);
    } catch (error) {
        console.error('Error loading documents:', error);
        const documentsList = document.getElementById('documentsList');
        if (documentsList) {
            documentsList.innerHTML = '<p>Error loading documents. Please try again later.</p>';
        }
    }
}

function displayDocuments(documents) {
    const documentsList = document.getElementById('documentsList');
    if (!documentsList) {
        console.error('Documents list element not found');
        return;
    }
    
    if (!documents || !documents.length) {
        documentsList.innerHTML = '<div class="no-documents"><i class="fas fa-file-medical"></i> No documents uploaded yet.</div>';
        return;
    }
    
    // Sort documents by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    // Clear existing content
    documentsList.innerHTML = '';
    
    // Add each document to the list
    documents.forEach(doc => {
        const docElement = document.createElement('div');
        docElement.className = 'document-item';
        docElement.innerHTML = `
            <div class="document-info">
                <strong>${doc.type}</strong>
                <p>${doc.description || 'No description'}</p>
                <small>
                    <i class="fas fa-file"></i> ${doc.fileName}<br>
                    <i class="fas fa-calendar"></i> Uploaded: ${new Date(doc.uploadDate).toLocaleDateString()}<br>
                    <i class="fas fa-weight"></i> Size: ${formatFileSize(doc.fileSize)}
                </small>
            </div>
            <div class="document-actions">
                <button class="view-btn" onclick="viewDocument('${doc.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="delete-btn" onclick="deleteDocument('${doc.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        documentsList.appendChild(docElement);
    });
}

// Document View and Delete Functions
function viewDocument(documentId) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.id) {
        alert('Please log in to view documents');
        return;
    }

    try {
        const documentsKey = `documents_${userData.id}`;
        const documents = JSON.parse(localStorage.getItem(documentsKey) || '[]');
        const doc = documents.find(d => d.id === documentId);

        if (!doc) {
            throw new Error('Document not found');
        }

        // Update viewer title
        const viewerTitle = document.getElementById('viewer-title');
        if (viewerTitle) viewerTitle.textContent = doc.fileName;

        const viewer = document.getElementById('documentViewer');
        if (!viewer) return;
        
        // Handle different file types
        if (doc.fileType.startsWith('image/')) {
            viewer.innerHTML = `<img src="${doc.fileData}" alt="${doc.fileName}">`;
        } else if (doc.fileType === 'application/pdf') {
            viewer.innerHTML = `<iframe src="${doc.fileData}" type="application/pdf"></iframe>`;
        } else {
            viewer.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p>This file type cannot be previewed directly.</p>
                    <button onclick="downloadDocument('${doc.id}')" class="upload-btn" style="max-width: 200px;">
                        <i class="fas fa-download"></i> Download File
                    </button>
                </div>
            `;
        }
        
        // Open the viewer modal
        const viewerModal = document.getElementById('documentViewerModal');
        if (viewerModal) viewerModal.style.display = 'block';
    } catch (error) {
        console.error('Error viewing document:', error);
        alert('Failed to view document: ' + error.message);
    }
}

function downloadDocument(documentId) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.id) {
        alert('Please log in to download documents');
        return;
    }

    try {
        const documentsKey = `documents_${userData.id}`;
        const documents = JSON.parse(localStorage.getItem(documentsKey) || '[]');
        const doc = documents.find(d => d.id === documentId);

        if (!doc) {
            throw new Error('Document not found');
        }

        // Create a blob from the base64 data
        const byteString = atob(doc.fileData.split(',')[1]);
        const mimeString = doc.fileType;
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        const url = window.URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = doc.fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading document:', error);
        alert('Failed to download document: ' + error.message);
    }
}

function deleteDocument(documentId) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.id) {
        alert('Please log in to delete documents');
        return;
    }

    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }

    try {
        const documentsKey = `documents_${userData.id}`;
        const documents = JSON.parse(localStorage.getItem(documentsKey) || '[]');
        
        // Filter out the document to delete
        const updatedDocuments = documents.filter(doc => doc.id !== documentId);
        
        // Save back to localStorage
        localStorage.setItem(documentsKey, JSON.stringify(updatedDocuments));
        
        alert('Document deleted successfully!');
        loadUserDocuments();
    } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document: ' + error.message);
    }
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add click handlers for settings menu items
document.getElementById('profile-settings').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '../profile/profile.html';
});

document.getElementById('account-settings').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Account settings clicked');
});