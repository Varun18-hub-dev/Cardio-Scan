
document.addEventListener('DOMContentLoaded', () => {

    /* ── File Upload / Drag & Drop ── */
    const dropzone   = document.getElementById('dropzone');
    const fileInput  = document.getElementById('reportFile');
    const browseBtn  = document.getElementById('browseBtn');
    const filePreview= document.getElementById('filePreview');
    const fileName   = document.getElementById('fileName');
    const fileSize   = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');
    const submitBtn  = document.getElementById('submitBtn');
    const uploadForm = document.getElementById('uploadForm');

    if (!dropzone) return; // guard if not on home page

    /* Open file picker */
    browseBtn.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('click', (e) => {
        if (!filePreview.contains(e.target)) fileInput.click();
    });

    /* File selected via picker */
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
    });

    /* Drag events */
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    ['dragleave', 'dragend'].forEach(ev =>
        dropzone.addEventListener(ev, () => dropzone.classList.remove('dragover'))
    );
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    /* Remove file */
    removeFile.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFile();
    });

    function handleFile(file) {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowed.includes(file.type)) {
            showToast('Please upload a PDF, JPG, or PNG file.', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('File must be under 10 MB.', 'error');
            return;
        }

        // Update UI
        fileName.textContent = file.name;
        fileSize.textContent  = formatBytes(file.size);
        filePreview.hidden    = false;
        submitBtn.disabled    = false;

        // Hide default dropzone content
        dropzone.querySelector('.dropzone-icon').style.display = 'none';
        dropzone.querySelector('.dropzone-title').style.display = 'none';
        dropzone.querySelector('.dropzone-sub').style.display   = 'none';
        browseBtn.style.display = 'none';

        showToast('File ready — click "Analyze Report" to proceed.', 'success');
    }

    function clearFile() {
        fileInput.value = '';
        filePreview.hidden = true;
        submitBtn.disabled = true;

        dropzone.querySelector('.dropzone-icon').style.display = '';
        dropzone.querySelector('.dropzone-title').style.display = '';
        dropzone.querySelector('.dropzone-sub').style.display   = '';
        browseBtn.style.display = '';
    }

    /* ── Form submit ── */
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!fileInput.files.length) return;

        // Loading state
        const btnText    = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        btnText.hidden    = true;
        btnLoading.hidden = false;
        submitBtn.disabled = true;

        try {
            // Real Flask submit
            const formData = new FormData(uploadForm);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            renderResult(data);

        } catch (err) {
            showToast('Something went wrong. Please try again.', 'error');
            console.error(err);
        } finally {
            btnText.hidden    = false;
            btnLoading.hidden = true;
            submitBtn.disabled = false;
        }
    });

    /* ── Result Rendering ── */
    function renderResult(data) {
        const section       = document.getElementById('resultSection');
        const riskLevel     = document.getElementById('riskLevel');
        const riskPct       = document.getElementById('riskPct');
        const indicatorsGrid= document.getElementById('indicatorsGrid');
        const gaugeFill     = document.querySelector('.gauge-fill');

        if (!section) return;

        // Risk level text & color
        riskLevel.textContent = data.risk_label;
        riskPct.textContent   = data.probability + '%';

        const riskColor = data.probability >= 70 ? 'var(--red)'
                        : data.probability >= 40 ? 'var(--amber)'
                        : 'var(--green)';
        riskLevel.style.color = riskColor;
        riskPct.style.color   = riskColor;

        // Gauge: stroke-dasharray 251 total arc
        const offset = 251 - (data.probability / 100) * 251;
        gaugeFill.style.strokeDashoffset = offset;

        // Indicators
        indicatorsGrid.innerHTML = '';
        (data.indicators || []).forEach(ind => {
            const chip = document.createElement('div');
            chip.className = `indicator-chip ${ind.flag}`;
            chip.innerHTML = `
                <span class="chip-label">${ind.label}</span>
                <span class="chip-value">${ind.value}</span>
            `;
            indicatorsGrid.appendChild(chip);
        });

        // Show section
        section.hidden = false;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* ── Toast Notification ── */
    function showToast(message, type = 'info') {
        const existing = document.querySelector('.cs-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `cs-toast cs-toast--${type}`;
        toast.textContent = message;

        const styles = {
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            padding: '.75rem 1.25rem',
            borderRadius: '10px',
            fontSize: '.875rem',
            fontWeight: '600',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            boxShadow: '0 8px 24px rgba(0,0,0,.15)',
            maxWidth: '340px',
            lineHeight: '1.4',
            animation: 'toastIn .3s ease',
            color: 'white',
            background: type === 'error' ? '#dc2626'
                      : type === 'success' ? '#16a34a'
                      : '#1a1410',
        };
        Object.assign(toast.style, styles);

        // Inject keyframe if not exists
        if (!document.getElementById('toastStyle')) {
            const s = document.createElement('style');
            s.id = 'toastStyle';
            s.textContent = `@keyframes toastIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`;
            document.head.appendChild(s);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    /* ── Mock Data (remove when Flask endpoint ready) ── */
    function mockResult() {
        return {
            probability: 62,
            risk_label: 'Moderate Risk',
            indicators: [
                { label: 'Age',           value: '54 yrs',    flag: '' },
                { label: 'Resting BP',    value: '145 mmHg',  flag: 'flag-high' },
                { label: 'Cholesterol',   value: '230 mg/dL', flag: 'flag-high' },
                { label: 'Fasting Sugar', value: '110 mg/dL', flag: 'flag-high' },
                { label: 'Max Heart Rate',value: '142 bpm',   flag: 'flag-ok' },
                { label: 'Exercise Angina',value: 'Yes',      flag: 'flag-high' },
                { label: 'ST Depression', value: '1.4',       flag: 'flag-high' },
                { label: 'Major Vessels', value: '1',         flag: '' },
            ]
        };
    }

    /* ── Helpers ── */
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    /* ── Scroll-reveal for step cards ── */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeUp .5s ease both';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.step-card').forEach(card => {
        card.style.opacity = '0';
        observer.observe(card);
    });

});
