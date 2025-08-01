
# Drug Risk Classification & Healthcare Management System



An ML-powered platform for proactive drug risk assessment and healthcare workflow optimization, bridging clinical and pharmaceutical operations.

## ✨ Key Features

- **Drug Risk Prediction**: Machine learning model classifies medications as high/low risk
- **Alternative Drug Recommendations**: Suggests safer alternatives for high-risk prescriptions
- **Role-Based Access Control**: Tailored interfaces for doctors, nurses, admins, and production staff
- **End-to-End Workflows**: From patient appointments to prescription safety checks
- **Production Flagging System**: Quality control for pharmaceutical manufacturing

## 🛠️ Prerequisites

- **Node.js** (v16.x or later) - [Download](https://nodejs.org/)
- **Python** (v3.9 or later) - [Download](https://www.python.org/downloads/)
- **Git** - [Download](https://git-scm.com/downloads)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/drug-risk-system.git](https://github.com/charitha213/navi-cp.git)
cd drug-risk-system
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure database
# can just run the reset_db script and proceed with using the application

# Start FastAPI server
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd drug-risk-ui  # Navigate to frontend directory
npm i
npm start
```

### 4. Access the Application
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs


## 🤖 Machine Learning Model

### Key Features:
- Random Forest classifier (93% F1-score)

### Processes:
- Symptom text analysis (TF-IDF)
- Dose-route interactions
- Outcome severity patterns

### Training Data:
- FDA FAERS dataset (200,000+ adverse event reports)
- Quarterly retraining pipeline

## 👥 User Roles

| Role       | Access                         |
|------------|--------------------------------|
| Patient    | Book appointments              |
| Nurse      | Manage appointments            |
| Doctor     | Prescribe with risk alerts     |
| Admin      | Manage users & drug data       |
| Production | Flag high-risk drugs           |
| Manager    | Review flagged drugs           |

## 🌟 Why This Project?
- Proactive risk prevention (vs reactive systems)
- Unified clinical + pharmaceutical workflows
