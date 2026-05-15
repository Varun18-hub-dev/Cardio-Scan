# Heart Disease Prediction System: Project Report

---

## 1. Abstract

Cardiovascular diseases (CVDs) remain the undisputed leading cause of mortality globally, accounting for millions of premature deaths each year. The insidious nature of heart disease often means that symptoms go unnoticed until a severe, sometimes fatal, medical event occurs. Early detection and proactive, continuous risk assessment are therefore critical in mitigating these outcomes and shifting the healthcare paradigm from reactive treatment to preventative care. However, traditional methods of assessing cardiac risk often rely on fragmented medical data, manual interpretation of complex clinical reports, and significant time investments from healthcare professionals, creating bottlenecks that can delay critical early interventions.

This project presents a comprehensive, full-stack, intelligent web application designed specifically to democratize and accelerate the predictive risk assessment of heart disease. At the core of the system lies a robust Machine Learning algorithm—a Random Forest Classifier—trained on a diverse clinical dataset. This model analyzes multifaceted physiological inputs, ranging from resting blood pressure and serum cholesterol levels to electrocardiogram results and maximum heart rate, to calculate a precise probability score and classify the user's immediate cardiovascular risk into accessible tiers (Low, Moderate, or High Risk).

To address the significant friction associated with manual clinical data entry—which is highly prone to human error and user fatigue—this system pioneers an automated Optical Character Recognition (OCR) ingestion pipeline. By integrating state-of-the-art document parsing tools like `PyMuPDF` and `Tesseract OCR`, the application empowers users to simply upload raw medical reports in PDF or image formats. The intelligent backend automatically scans these unstructured documents, identifies relevant cardiological metrics using advanced text-parsing logic, and seamlessly maps them to the predictive model's required features. Furthermore, the architecture incorporates advanced mathematical imputation pipelines to gracefully handle missing or unrecorded data, ensuring the model continues to provide scientifically accurate predictions based on safe clinical baselines without crashing.

Beyond its analytical capabilities, the application is engineered as a secure, user-centric platform. Integrated with a hardened authentication system utilizing `Flask-Login` and cryptographic password hashing, it ensures strict privacy for sensitive user health data. A persistent relational database acts as the backbone for the system, allowing the platform to automatically log every prediction and its associated clinical indicators. This enables users to access a personalized, intuitive dashboard where they can track their cardiovascular health trajectory over time, observe fluctuations in their vital metrics, and make informed lifestyle or medical decisions. Ultimately, this project stands at the intersection of modern web development, artificial intelligence, and digital health, providing a reliable, seamless, and mathematically rigorous tool that transforms static medical documents into actionable, life-saving insights.

---

## 2. Introduction & System Features

The primary objective of this system is to bridge the vast gap between complex machine learning paradigms and end-user accessibility. Historically, predictive medical algorithms have been confined to research environments or required highly technical knowledge to operate. By wrapping a highly accurate Random Forest model in an intuitive, consumer-facing web interface, this application brings advanced cardiological risk assessment directly to the general public and clinical practitioners alike.

### System Workflow and Architecture
The application operates on a streamlined, multi-tier architectural workflow:
1. **Data Ingestion:** The user securely authenticates into the platform and uploads a scanned copy or digital PDF of their latest medical report.
2. **Text Extraction:** The backend intercepts the file, determining whether it requires vector-based text extraction or pixel-based optical character recognition.
3. **Data Parsing & Imputation:** Using customized Regular Expressions, the system strips out the necessary physiological data points. Any missing data is intelligently imputed using pre-calculated dataset medians to prevent calculation failures.
4. **Predictive Modeling:** The normalized data is passed through the serialized Scikit-Learn pipeline, where the Random Forest classifier executes its decision trees to generate a probability matrix.
5. **Data Persistence:** The results are mapped to a secure SQLite database associated with the user's encrypted session identifier.

### The 13 Clinical Indicators (Features)
The algorithm has been trained to evaluate 13 distinct features, chosen for their high correlation with cardiovascular events. These features include a mix of continuous, ordinal, and categorical variables:
1. **Age** (Years) - A primary demographic risk factor.
2. **Sex** (1 = Male, 0 = Female) - Accounts for gender-based physiological differences.
3. **Chest Pain Type** (`cp`: 0-3) - Categorizes angina types, recognizing that asymptomatic presentations can still carry risk.
4. **Resting Blood Pressure** (`trestbps`: mm Hg) - A key indicator of hypertension.
5. **Serum Cholesterol** (`chol`: mg/dl) - High levels correlate directly to arterial plaque buildup.
6. **Fasting Blood Sugar** (`fbs`: > 120 mg/dl) - Links diabetic indicators to cardiovascular strain.
7. **Resting ECG Results** (`restecg`: 0-2) - Detects structural or electrical heart abnormalities.
8. **Maximum Heart Rate** (`thalach`) - Measures cardiovascular efficiency during stress.
9. **Exercise Induced Angina** (`exang`: 1 = Yes) - Indicates poor blood flow during exertion.
10. **ST Depression** (`oldpeak`) - Shows ischemia detected by electrocardiogram.
11. **Slope of Peak Exercise** (`slope`) - Further details the severity of ST segment shifts.
12. **Major Vessels** (`ca`: 0-3) - Highlights the number of vessels colored by fluoroscopy, indicating blockages.
13. **Thalassemia** (`thal`: 0-3) - A blood disorder heavily linked to cardiovascular complications.

---

## 3. Front End Design

The user interface (UI) and user experience (UX) were engineered entirely using **HTML5, Vanilla CSS3, and Vanilla JavaScript**. By avoiding heavy JavaScript frameworks like React or Angular, the application achieves blisteringly fast load times while maintaining a highly interactive, dynamic, and stateful experience.

### Aesthetic Principles and Glassmorphism
The visual design of the application was constructed around a modern, premium aesthetic that inspires trust—a crucial requirement for any medical application. The application utilizes a curated HSL (Hue, Saturation, Lightness) color palette that provides deep, sophisticated contrasts. Rather than relying on stark white backgrounds, the platform employs a "Glassmorphism" design system. This involves utilizing CSS `backdrop-filter: blur()` properties paired with semi-transparent, bright container backgrounds to create a frosted glass effect. This effect creates depth and visual hierarchy, drawing the user's attention directly to the interactive elements and the prediction results without overwhelming them with clinical sterility.

### Layout Architecture and CSS Modularity
The layout relies heavily on modern CSS modules, specifically **CSS Flexbox** and **CSS Grid**. These technologies ensure that the application is fully responsive, adapting flawlessly from massive desktop monitors down to mobile phone screens. To maintain clean code, a robust CSS Variable (Custom Properties) system was implemented at the `:root` level. This allows global control over spacing, typography, border radii, and color tokens, ensuring absolute visual consistency across the Landing Page, the Login/Registration portals, and the History Dashboard. Subtle micro-animations, applied via CSS `transition` properties, provide immediate tactile feedback when users hover over buttons or interact with the file drag-and-drop zone.

### Asynchronous JavaScript and The Fetch API
The frontend achieves a Single Page Application (SPA) feel by heavily relying on asynchronous JavaScript. When a user uploads a medical report, the application prevents the default form submission (which would force a jarring page reload). Instead, it utilizes the native `Fetch API` to asynchronously transmit a `FormData` object containing the file to the Flask backend. 

During this transmission phase, the JavaScript dynamically manipulates the Document Object Model (DOM). It hides the standard upload text, reveals a custom CSS animated loading spinner, and disables the submit button to prevent duplicate requests. Once the server responds with a JSON payload containing the prediction data, the JavaScript dynamically injects these results into hidden HTML containers, smoothly scrolls the user down to the results pane using `scrollIntoView({ behavior: 'smooth' })`, and elegantly fades the data into view.

### Sample Frontend Code (AJAX Upload Logic)
```javascript
// script.js - Handling the File Upload and Fetching Prediction Asynchronously
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent standard page reload
    
    // UI State: Show loading spinner and disable interactions
    btnText.hidden = true;
    btnLoading.hidden = false;
    submitBtn.disabled = true;

    try {
        // Send file to Flask Backend Asynchronously via multipart/form-data
        const formData = new FormData(uploadForm);
        const res = await fetch('/api/upload', { 
            method: 'POST', 
            body: formData 
        });
        
        const data = await res.json();
        
        // Dynamically render the results using the JSON response
        renderResult(data);

        // Transition UI state smoothly to the newly populated results section
        resultSection.hidden = false;
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        showToast('Something went wrong. Please check your connection and try again.');
    } finally {
        // Restore default UI State regardless of success or failure
        btnText.hidden = false;
        btnLoading.hidden = true;
        submitBtn.disabled = false;
    }
});
```

---

## 4. Back End Design

The backbone of this application is a powerful, highly scalable REST API constructed using **Python 3 and the Flask framework**. Flask was selected for its lightweight WSGI (Web Server Gateway Interface) capabilities, allowing the integration of highly complex machine learning libraries without the unnecessary boilerplate of larger frameworks like Django.

### Security, Authentication, and Session Management
Because the application handles highly sensitive personal medical data, security was a paramount concern during backend development. The system utilizes `Flask-Login` for robust session management, issuing secure, HTTP-only cookies that maintain user authentication state across requests. Passwords are never stored in plain text; instead, they are passed through the `werkzeug.security` module which generates cryptographic hashes using the rigorous `scrypt` algorithm. The `models.py` file leverages the `Flask-SQLAlchemy` Object-Relational Mapper (ORM), protecting the system entirely against SQL injection attacks by strictly parameterizing all database queries. The database chosen for this iteration is SQLite, which allows for zero-configuration local deployment while maintaining ACID compliance for reliable data persistence.

### Advanced OCR Service Pipeline
The data ingestion pipeline (`ocr_service.py`) is uniquely designed to handle multiple types of medical documents. When a file is received, the backend inspects the MIME type. If the file is a PDF, the backend utilizes `PyMuPDF` (`fitz`), an ultra-fast C-based library that can extract embedded text vectors directly from the digital document with zero loss in fidelity. However, recognizing that many medical reports are physical documents that have been scanned or photographed, the system contains a sophisticated fallback mechanism. If `PyMuPDF` detects no vector text, the backend converts the PDF pages into high-resolution pixel maps (Pixmaps) and passes them to `Tesseract OCR`, an open-source optical character recognition engine powered by LSTM neural networks. Once text is extracted, complex Regular Expression (`Regex`) patterns sweep the raw strings to locate exact numerical values associated with heart rate, blood pressure, and cholesterol.

### Machine Learning Serialization and Preprocessing
The predictive core of the backend is powered by a pre-trained `RandomForestClassifier` encapsulated within a Scikit-Learn `Pipeline`. The entire pipeline is serialized using the `joblib` library, allowing it to be instantly loaded into memory when the Flask server starts. The genius of this pipeline lies in its `ColumnTransformer`. Real-world medical data is extremely messy, and the OCR process might fail to extract every single feature. The Flask backend intercepts the incoming data and populates missing fields with explicit `NaN` (Not a Number) values. The Scikit-Learn pipeline then uses a `SimpleImputer` to mathematically replace these `NaN` values with the exact median statistics calculated during the original training phase. Furthermore, a `StandardScaler` normalizes all numerical data so that large figures (like cholesterol) do not overpower smaller figures (like ST depression) during the Random Forest voting process.

### Sample Backend Code (Database Models)
```python
# models.py - Secure Database Schema Definition using SQLAlchemy ORM
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    
    # Passwords are cryptographically hashed using scrypt
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Establishing a One-to-Many Relationship to the user's historical predictions
    predictions = db.relationship('PredictionRecord', backref='user', lazy=True)

class PredictionRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # ML Prediction Results
    probability = db.Column(db.Float, nullable=False)
    risk_label = db.Column(db.String(50), nullable=False)
    
    # Store the 13 dynamic clinical indicators safely as a JSON string
    indicators_json = db.Column(db.Text, nullable=False)

    def get_indicators(self):
        # Helper method to deserialize the JSON for the frontend dashboard
        return json.loads(self.indicators_json)
```

---

## 5. Output Screenshots & Testing

The system handles the entire flow intuitively. When a user uploads a report, the UI dynamically changes to reflect the analysis state, followed by a detailed breakdown of the ML model's prediction.

*(Note: Please insert your actual application screenshots below as instructed)*

**[ INSERT SCREENSHOT OF UPLOAD/PREDICTION PAGE HERE ]**

**1. The Prediction Result Interface**
> **RISK LEVEL:** High Risk
> **PROBABILITY:** 85.0%
> 
> *Clinical Indicators Extracted:*
> - Age: 54
> - Resting BP: 145 (Flagged High)
> - Cholesterol: 230
> - Max Heart Rate: 150

**[ INSERT SCREENSHOT OF DASHBOARD (/history) HERE ]**

**2. The User Dashboard (`/history`)**
The dashboard queries the SQLite database to display all historical uploads associated with the logged-in user session, formatted with color-coded risk badges.

---

## 6. Conclusion and Future Scope

This project successfully proves the immense viability and critical importance of integrating modern, high-performance web development with Artificial Intelligence and Optical Character Recognition to solve real-world healthcare challenges. By prioritizing a frictionless user experience, the system demystifies complex predictive modeling and transforms dense, unreadable medical reports into immediate, actionable health insights. 

The implementation of a highly secure Flask architecture, backed by cryptographic session management and a persistent relational database, demonstrates that it is entirely possible to create lightweight, scalable clinical tools that respect user privacy while delivering robust analytical power. The intelligent integration of Scikit-Learn's imputation pipelines specifically showcases a resilient engineering approach, ensuring that the application remains highly functional and mathematically rigorous even when faced with incomplete or messy real-world data derived from scanned documents.

Looking forward, the architectural foundation of this project provides immense room for expansion. Future iterations of this system could theoretically integrate directly into electronic health record (EHR) APIs like FHIR (Fast Healthcare Interoperability Resources), bypassing the need for PDF uploads entirely for patients affiliated with major hospital networks. Additionally, the SQLite database can be easily migrated to enterprise-grade PostgreSQL environments to support thousands of concurrent users across a cloud infrastructure like AWS or Render. Furthermore, the Random Forest model could be retrained or swapped with Deep Learning architectures (such as densely connected Neural Networks) as more vast, diverse clinical datasets become publicly available, driving the precision of the cardiac risk probability score even higher. Ultimately, this application serves as a powerful prototype for the future of decentralized, preventative digital health platforms.

---

## 7. References
1.  **Flask Documentation:** Pallets Projects. (n.d.). *Flask web development*. https://flask.palletsprojects.com/
2.  **Scikit-Learn:** Pedregosa et al. (2011). *Scikit-learn: Machine Learning in Python*. JMLR 12, pp. 2825-2830.
3.  **PyMuPDF (fitz):** Artifex Software. (n.d.). *High performance PDF rendering and text extraction*. https://pymupdf.readthedocs.io/
4.  **Tesseract OCR:** Google. (n.d.). *Tesseract Open Source OCR Engine*. https://github.com/tesseract-ocr/tesseract
5.  **Heart Disease Dataset:** UCI Machine Learning Repository. (1988). *Heart Disease Data Set*.
