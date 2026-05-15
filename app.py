from flask import Flask, request, jsonify, render_template, send_from_directory, redirect, url_for, flash
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, login_required, logout_user, current_user

from ocr_service import parse_report_image
from models import db, User, PredictionRecord

app = Flask(__name__, template_folder='templates')
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-123')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create tables before first request
with app.app_context():
    db.create_all()

# Load the trained pipeline
try:
    model_pipeline = joblib.load('model_pipeline.joblib')
except Exception as e:
    print(f"Error loading model: {e}")
    model_pipeline = None

# All 13 expected features in the model
ALL_FEATURES = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
]

@app.route('/')
def home():
    return render_template('index.html')

# --- AUTH ROUTES ---

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('history'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('history'))
        else:
            flash('Invalid email or password.', 'error')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('history'))

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(email=email).first():
            flash('Email address already exists', 'error')
        elif User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
        else:
            new_user = User(
                username=username,
                email=email,
                password_hash=generate_password_hash(password, method='scrypt')
            )
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            return redirect(url_for('history'))

    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/history')
@login_required
def history():
    records = PredictionRecord.query.filter_by(user_id=current_user.id).order_by(PredictionRecord.timestamp.desc()).all()
    return render_template('history.html', records=records)

# --- PREDICTION ROUTES ---

@app.route('/api/predict', methods=['POST'])
def predict_api():
    """
    RESTful endpoint for predicting from JSON payload.
    Expected to be tested via Postman.
    """
    if not model_pipeline:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    input_data = {}
    for key in ALL_FEATURES:
        input_data[key] = data.get(key, np.nan)

    df = pd.DataFrame([input_data])
    
    try:
        prediction = model_pipeline.predict(df)[0]
        probability = model_pipeline.predict_proba(df)[0][1] * 100
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    risk_label = "High Risk" if probability >= 70 else "Moderate Risk" if probability >= 40 else "Low Risk"

    return jsonify({
        "prediction": int(prediction),
        "probability": round(probability, 2),
        "risk_label": risk_label
    })

@app.route('/api/upload', methods=['POST'])
def upload_predict():
    """
    Handles file upload from frontend, runs OCR, and predicts.
    Saves to DB if user is logged in.
    """
    if 'report' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['report']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.png', '.jpg', '.jpeg']:
        ext = '.png' 
    
    temp_path = f"temp_upload{ext}"
    file.save(temp_path)

    extracted_features = parse_report_image(temp_path)
    
    if os.path.exists(temp_path):
        try:
            os.remove(temp_path)
        except Exception as e:
            pass

    input_data = {}
    for key in ALL_FEATURES:
        input_data[key] = extracted_features.get(key, np.nan)

    df = pd.DataFrame([input_data])
    if model_pipeline:
        probability = model_pipeline.predict_proba(df)[0][1] * 100
    else:
        probability = 50.0 

    risk_label = "High Risk" if probability >= 70 else "Moderate Risk" if probability >= 40 else "Low Risk"

    indicators = []
    labels = {
        'age': 'Age', 'sex': 'Sex', 'cp': 'Chest Pain', 
        'trestbps': 'Resting BP', 'chol': 'Cholesterol',
        'fbs': 'Fasting Sugar', 'restecg': 'Resting ECG',
        'thalach': 'Max Heart Rate', 'exang': 'Exercise Angina',
        'oldpeak': 'ST Depression', 'slope': 'Slope',
        'ca': 'Major Vessels', 'thal': 'Thalassemia'
    }

    for key, val in input_data.items():
        if pd.isna(val):
            display_val = "Not Detected (Imputed)"
            flag = ''
        else:
            display_val = str(val)
            flag = ''
            if key == 'trestbps' and val > 130: flag = 'flag-high'
            if key == 'chol' and val > 240: flag = 'flag-high'
            if key == 'thalach' and val < 60: flag = 'flag-high'
        
        indicators.append({
            "label": labels.get(key, key),
            "value": display_val,
            "flag": flag
        })

    # SAVE TO DATABASE IF LOGGED IN
    if current_user.is_authenticated:
        record = PredictionRecord(
            user_id=current_user.id,
            probability=probability,
            risk_label=risk_label,
            indicators_json=json.dumps(indicators)
        )
        db.session.add(record)
        db.session.commit()

    return jsonify({
        "probability": round(probability, 1),
        "risk_label": risk_label,
        "indicators": indicators
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
