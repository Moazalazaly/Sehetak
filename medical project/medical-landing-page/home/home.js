// Sidenav show/hide
function showSidenav() {
    const sidenav = document.querySelector('.sidenav');
    sidenav.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}
function hideSidenav() {
    const sidenav = document.querySelector('.sidenav');
    sidenav.style.display = 'none';
    document.body.style.overflow = '';
}
// Close sidenav with Escape key
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideSidenav();
});

// File upload drag & drop and choose file
const fileDrop = document.querySelector('.file-drop');
const fileInput = document.getElementById('file-upload');
const chooseFile = document.querySelector('.choose-file');

if (fileDrop && fileInput) {
    // Highlight on drag over
    fileDrop.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileDrop.style.borderColor = '#1976d2';
        fileDrop.style.background = '#e3f2fd';
    });
    fileDrop.addEventListener('dragleave', function(e) {
        fileDrop.style.borderColor = '#b3c6d9';
        fileDrop.style.background = '';
    });
    fileDrop.addEventListener('drop', function(e) {
        e.preventDefault();
        fileDrop.style.borderColor = '#b3c6d9';
        fileDrop.style.background = '';
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            showFileName();
        }
    });
    // Click to choose file
    if (chooseFile) {
        chooseFile.addEventListener('click', function(e) {
            e.preventDefault();
            fileInput.click();
        });
    }
    // Show file name on file select
    fileInput.addEventListener('change', showFileName);
}
function showFileName() {
    const fileNameSpan = document.querySelector('.file-drop span');
    if (fileInput.files && fileInput.files.length > 0) {
        fileNameSpan.textContent = fileInput.files[0].name;
    } else {
        fileNameSpan.textContent = 'Drag and drop a file here';
    }
}

// Basic form submission handler
const form = document.querySelector('.medical-form');
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Your document has been submitted! (Demo)');
        form.reset();
        showFileName();
    });
}

// Expose sidenav functions globally for HTML onclick
window.showSidenav = showSidenav;
window.hideSidenav = hideSidenav;

// --- Persist form data with localStorage ---
const FORM_STORAGE_KEY = 'medicalFormData';

function saveFormData() {
    if (!form) return;
    const data = {
        doctype: form.querySelector('#doctype')?.value || '',
        message: form.querySelector('#message')?.value || '',
        fileName: form.querySelector('#file-upload')?.files[0]?.name || ''
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
}

function loadFormData() {
    if (!form) return;
    const data = JSON.parse(localStorage.getItem(FORM_STORAGE_KEY) || '{}');
    if (data.doctype !== undefined) form.querySelector('#doctype').value = data.doctype;
    if (data.message !== undefined) form.querySelector('#message').value = data.message;
    // Show file name if present
    if (data.fileName) {
        const fileNameSpan = document.querySelector('.file-drop span');
        if (fileNameSpan) fileNameSpan.textContent = data.fileName;
    }
}

if (form) {
    // Save on input/change
    form.querySelectorAll('#doctype, #message, #file-upload').forEach(el => {
        el.addEventListener('input', saveFormData);
        el.addEventListener('change', saveFormData);
    });
    // Load on page load
    loadFormData();
}

// Clear data on submit
if (form) {
    form.addEventListener('submit', function() {
        localStorage.removeItem(FORM_STORAGE_KEY);
    });
}
