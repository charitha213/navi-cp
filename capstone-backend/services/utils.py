import pandas as pd
import joblib
import os

MODEL_PATH = "models/drug_model.pkl"
TFIDF_PATH = "models/tfidf.pkl"
SCALER_PATH = "models/scaler.pkl"
ENCODERS_PATH = "models/encoders.pkl"
LABEL_ENCODER_PATH = "models/label_encoder.pkl"
FEATURE_COLS_PATH = "models/feature_cols.pkl"
DF_CLEAN_PATH = "models/df_clean.csv"

def load_model_artifacts():
    model = joblib.load(MODEL_PATH)
    tfidf = joblib.load(TFIDF_PATH)
    scaler = joblib.load(SCALER_PATH)
    encoders = joblib.load(ENCODERS_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
    feature_cols = joblib.load(FEATURE_COLS_PATH)
    df_clean = pd.read_csv(DF_CLEAN_PATH)
    return model, tfidf, scaler, encoders, label_encoder, feature_cols, df_clean
