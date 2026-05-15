from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Relationship to predictions
    predictions = db.relationship('PredictionRecord', backref='user', lazy=True)

class PredictionRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # The calculated probability and risk
    probability = db.Column(db.Float, nullable=False)
    risk_label = db.Column(db.String(50), nullable=False)
    
    # Store the 13 clinical indicators as a JSON string
    indicators_json = db.Column(db.Text, nullable=False)

    def get_indicators(self):
        return json.loads(self.indicators_json)
