const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
let currentImage = null;
let history = [];
let historyIndex = -1;
let isDragging = false;
let cropStartX, cropStartY, cropEndX, cropEndY;

// Elements
const uploadBtn = document.getElementById('uploadBtn');
const dropZone = document.getElementById('dropZone');
const textModal = document.getElementById('textModal');
const textInput = document.getElementById('textInput');
const textColor = document.getElementById('textColor');

// Sliders
const sliders = {
    brightness: document.getElementById('brightness'),
    contrast: document.getElementById('contrast'),
    saturate: document.getElementById('saturate'),
    blur: document.getElementById('blur')
};

const valDisplays = {
    brightness: document.getElementById('brightVal'),
    contrast: document.getElementById('contrastVal'),
    saturate: document.getElementById('saturateVal'),
    blur: document.getElementById('blurVal')
};

// Save current state
function saveHistory() {
    if (history.length > 20) history.shift();
    history = history.slice(0, historyIndex + 1);
    history.push(canvas.toDataURL('image/png'));
    historyIndex++;
}

// Load image
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            // Resize canvas to image aspect ratio (max 900px)
            const maxWidth = 900;
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            saveHistory();
            dropZone.style.display = 'none';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Apply filters
function applyFilters() {
    if (!currentImage) return;
    ctx.filter = `
        brightness(${sliders.brightness.value}%) 
        contrast(${sliders.contrast.value}%) 
        saturate(${sliders.saturate.value}%) 
        blur(${sliders.blur.value}px)
    `;
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
}

// Event Listeners for sliders
Object.keys(sliders).forEach(key => {
    sliders[key].addEventListener('input', () => {
        valDisplays[key].textContent = sliders[key].value;
        applyFilters();
    });
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        if (filter === 'none') {
            ctx.filter = 'none';
        } else if (filter === 'grayscale') {
            ctx.filter = 'grayscale(100%)';
        } else if (filter === 'sepia') {
            ctx.filter = 'sepia(100%)';
        } else if (filter === 'invert') {
            ctx.filter = 'invert(100%)';
        }
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        saveHistory();
    });
});

// Upload
uploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => loadImage(e.target.files[0]);
    input.click();
});

dropZone.addEventListener('click', () => uploadBtn.click());

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.style.borderColor = '#00aaff';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#555';
});

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.borderColor = '#555';
    if (e.dataTransfer.files.length > 0) {
        loadImage(e.dataTransfer.files[0]);
    }
});

// Download
document.getElementById('downloadPNG').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

document.getElementById('downloadJPG').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-image.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
});

// Reset
document.getElementById('resetBtn').addEventListener('click', () => {
    if (currentImage) {
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        history = [];
        historyIndex = -1;
        saveHistory();
        // Reset sliders
        Object.keys(sliders).forEach(k => {
            sliders[k].value = k === 'blur' ? 0 : 100;
            valDisplays[k].textContent = sliders[k].value;
        });
    }
});

// Undo / Redo
document.getElementById('undoBtn').addEventListener('click', () => {
    if (historyIndex > 0) {
        historyIndex--;
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = history[historyIndex];
    }
});

document.getElementById('redoBtn').addEventListener('click', () => {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = history[historyIndex];
    }
});

// Add Text
let addingText = false;
document.querySelector('[data-tool="text"]').addEventListener('click', () => {
    textModal.style.display = 'flex';
    textInput.focus();
});

document.getElementById('addTextBtn').addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text || !currentImage) {
        textModal.style.display = 'none';
        return;
    }
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = textColor.value;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, canvas.width/2 - 100, canvas.height/2);
    ctx.shadowBlur = 0;
    saveHistory();
    textModal.style.display = 'none';
    textInput.value = '';
});

document.getElementById('cancelText').addEventListener('click', () => {
    textModal.style.display = 'none';
});

// Simple Rotate
document.querySelector('[data-tool="rotate"]').addEventListener('click', () => {
    if (!currentImage) return;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.height;
    tempCanvas.height = canvas.width;
    tempCtx.translate(tempCanvas.width/2, tempCanvas.height/2);
    tempCtx.rotate(Math.PI / 2);
    tempCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
    saveHistory();
});

// Flip Horizontal
document.querySelector('[data-tool="flipH"]').addEventListener('click', () => {
    if (!currentImage) return;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, -canvas.width, 0);
    ctx.restore();
    saveHistory();
});

// Flip Vertical
document.querySelector('[data-tool="flipV"]').addEventListener('click', () => {
    if (!currentImage) return;
    ctx.save();
    ctx.scale(1, -1);
    ctx.drawImage(canvas, 0, -canvas.height);
    ctx.restore();
    saveHistory();
});

// Crop (basic - click and drag on canvas)
let cropMode = false;
document.querySelector('[data-tool="crop"]').addEventListener('click', () => {
    cropMode = !cropMode;
    alert(cropMode ? "Crop mode ON. Drag on canvas to select area, then click again to crop." : "Crop mode OFF");
});

canvas.addEventListener('mousedown', e => {
    if (!cropMode) return;
    const rect = canvas.getBoundingClientRect();
    cropStartX = e.clientX - rect.left;
    cropStartY = e.clientY - rect.top;
    isDragging = true;
});

canvas.addEventListener('mousemove', e => {
    if (!isDragging || !cropMode) return;
    // Visual feedback can be added with another overlay canvas if needed
});

canvas.addEventListener('mouseup', e => {
    if (!isDragging || !cropMode) return;
    isDragging = false;
    const rect = canvas.getBoundingClientRect();
    cropEndX = e.clientX - rect.left;
    cropEndY = e.clientY - rect.top;

    const w = Math.abs(cropEndX - cropStartX);
    const h = Math.abs(cropEndY - cropStartY);
    const x = Math.min(cropStartX, cropEndX);
    const y = Math.min(cropStartY, cropEndY);

    if (w < 10 || h < 10) return;

    const cropped = ctx.getImageData(x, y, w, h);
    canvas.width = w;
    canvas.height = h;
    ctx.putImageData(cropped, 0, 0);
    saveHistory();
    cropMode = false;
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.key === 'z' && e.ctrlKey) {
        document.getElementById('undoBtn').click();
    }
});

// Initialize
dropZone.style.display = 'flex';
