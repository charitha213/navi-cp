import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder

# Load model and components
model = joblib.load("models/drug_model.pkl")
tfidf = joblib.load("models/tfidf.pkl")
scaler = joblib.load("models/scaler.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")
encoders = joblib.load("models/encoders.pkl")  # Dict of LabelEncoders for categorical fields
feature_cols = joblib.load("models/feature_cols.pkl")  # List of all final feature columns

# Keep the full cleaned dataset for alternative recommendations
df_clean = pd.read_csv("models/df_clean.csv")  # Ensure this file exists

# Columns expected in synthetic data input
categorical_cols = ['route', 'dose_unit', 'dose_form', 'dose_freq', 'dechal', 'rechal']
numeric_cols = ['dose_amt', 'nda_num', 'num_symptoms', 'primary_dose']


def preprocess_input(data: dict) -> pd.DataFrame:
    # Prepare DataFrame from input dict
    df = pd.DataFrame([data])

    # Derived fields
    df['num_symptoms'] = df['pt'].apply(lambda x: len(x.split(',')) if x else 0)
    df['is_primary'] = (df['role_cod'] == 'PS').astype(int)
    df['primary_dose'] = df['is_primary'] * df['dose_amt']

    # Encode categorical columns using saved encoders
    for col in categorical_cols:
        if col in df and col in encoders:
            df[col] = encoders[col].transform(df[col].astype(str))

    # TF-IDF vector
    pt_tfidf = tfidf.transform(df['pt']).toarray()
    tfidf_df = pd.DataFrame(pt_tfidf, columns=[f'tfidf_{term}' for term in tfidf.get_feature_names_out()])
    df = pd.concat([df, tfidf_df], axis=1)

    # Final feature selection
    X = df[feature_cols]

    # Scale numeric columns
    X[numeric_cols] = scaler.transform(X[numeric_cols])

    return X


def predict_risk_level(input_data: dict) -> str:
    X_processed = preprocess_input(input_data)
    pred_encoded = model.predict(X_processed)[0]
    return label_encoder.inverse_transform([pred_encoded])[0]


def recommend_alternatives(drug_name: str, df_clean: pd.DataFrame):
    """
    Recommend low-risk alternatives for a given drug name based on precomputed risk level and symptoms.

    Args:
        drug_name (str): The name of the drug to evaluate.
        df_clean (pd.DataFrame): Cleaned dataset with precomputed risk levels.

    Returns:
        dict: Contains 'risk_level' and 'alternatives' list.
    """
    # Find all matching rows for the drug_name
    matching_rows = df_clean[df_clean['drugname'].str.contains(drug_name, case=False, na=False)]
    if matching_rows.empty:
        return {
            "risk_level": "unknown",
            "alternatives": [f"No data found for {drug_name}"]
        }

    # Use the most frequent row or first row if no frequency data
    matching_row = matching_rows.mode().iloc[0] if not matching_rows.empty else matching_rows.iloc[0]

    # Get precomputed risk level
    risk_level = matching_row['risk_level']
    print(f"Precomputed risk level for {drug_name}: {risk_level}")

    # Derive alternatives based on symptoms and route compatibility
    alternatives = []
    if risk_level == 'high':
        high_risk_symptoms = [s.strip() for s in matching_row['pt'].split(',')] if pd.notna(matching_row['pt']) else []
        high_risk_route = matching_row['route']
        if high_risk_symptoms:
            low_risk_options = df_clean[df_clean['risk_level'] == 'low']
            matching_drugs = set()  # Use set to avoid duplicates
            for idx, row in low_risk_options.iterrows():
                if pd.notna(row['pt']):
                    low_risk_symptoms = [s.strip() for s in row['pt'].split(',')]
                    # Check for significant symptom overlap (e.g., at least 50% match) and route compatibility
                    common_symptoms = set(high_risk_symptoms) & set(low_risk_symptoms)
                    if (len(common_symptoms) / len(high_risk_symptoms) >= 0.5 and
                            row['route'] == high_risk_route):
                        matching_drugs.add(row['drugname'])
            alternatives = list(matching_drugs)[:5] if matching_drugs else ["No suitable alternatives found"]
        else:
            alternatives = ["No symptoms data for this drug"]
    else:
        alternatives = ["No change recommended. You can proceed."]

    return {
        "risk_level": risk_level,
        "alternatives": alternatives
    }
