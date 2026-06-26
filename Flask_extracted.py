import os
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app) # Permet au frontend Angular de communiquer avec l'API

# ==============================================================================
# 1. CHARGEMENT DES MODÈLES ET ARTEFACTS
# ==============================================================================
MODEL_DIR = r"C:\Users\Malek\Downloads\models"
DATA_PATH = r"C:\Users\Malek\Desktop\PFE-Integration\dados_tunisie.csv"

print("Chargement des modèles depuis:", MODEL_DIR)

# --- Chargement de l'Historique ---
try:
    df_history = pd.read_csv(DATA_PATH, sep=';')
    # Clean the dataset to avoid datetime parsing errors and match training data
    df_history = df_history[df_history['Month of absence'] > 0].copy()
    df_history = df_history.drop_duplicates()
    mask_fake_profile = (df_history['ID'] == 29) & (df_history['Age'] == 28) & (df_history['Education'] == 1)
    df_history = df_history[~mask_fake_profile].copy()
    mask_incoherent_1 = (df_history['Reason for absence'] == 1) & (df_history['Justification Delay'] == 1)
    mask_incoherent_2 = (df_history['Reason for absence'] == 8) & (df_history['Justification Delay'] == 1)
    df_history = df_history[~(mask_incoherent_1 | mask_incoherent_2)].copy()
    print(f"✅ Base historique chargée et nettoyée : {len(df_history)} absences.")
except Exception as e:
    print("⚠️ Erreur lors du chargement de l'historique :", e)
    df_history = pd.DataFrame()

# --- Modèle 1 : Proximité ---
try:
    prox_model = joblib.load(os.path.join(MODEL_DIR, "best_proximity_model.pkl"))
    prox_scaler = joblib.load(os.path.join(MODEL_DIR, "scaler_proximity.pkl"))
    prox_encoder = joblib.load(os.path.join(MODEL_DIR, "encoder_proximity.pkl"))
    prox_threshold_info = joblib.load(os.path.join(MODEL_DIR, "proximity_threshold.pkl"))
    
    if hasattr(prox_scaler, 'feature_names_in_'):
        prox_features = list(prox_scaler.feature_names_in_)
    else:
        prox_features = joblib.load(os.path.join(MODEL_DIR, "proximity_features.pkl"))
        
    prox_threshold = prox_threshold_info['threshold']
    lointain_idx = prox_threshold_info['lointain_idx']
    print("✅ Modèle Proximité chargé.")
except Exception as e:
    print("⚠️ Erreur lors du chargement du modèle Proximité :", e)

# --- Modèle 2 : Anomalie / Suspect ---
try:
    susp_model = joblib.load(os.path.join(MODEL_DIR, "best_suspicious_model.pkl"))
    susp_scaler = joblib.load(os.path.join(MODEL_DIR, "scaler_suspicious.pkl"))
    susp_features = joblib.load(os.path.join(MODEL_DIR, "suspicious_features.pkl"))
    print("✅ Modèle Suspect chargé.")
except Exception as e:
    print("⚠️ Erreur lors du chargement du modèle Suspect :", e)


# ==============================================================================
# 2. FONCTIONS DE FEATURE ENGINEERING DYNAMIQUE
# ==============================================================================

def get_season(m):
    if m in [12, 1, 2]: return 1
    elif m in [3, 4, 5]: return 2
    elif m in [6, 7, 8]: return 3
    else: return 4

def get_rolling_counts(df_group):
    dates = df_group['Date'].values
    counts_30 = np.zeros(len(dates))
    for i, d in enumerate(dates):
        counts_30[i] = np.sum((dates < d) & (dates >= d - np.timedelta64(30, 'D')))
    df_group['Absence_Last_30_Days'] = counts_30
    return df_group

def engineer_features(new_data_dict, model_type):
    """
    Combine la nouvelle absence avec l'historique pour calculer les features.
    Gère aussi les données déjà encodées si on les envoie directement (ex: via Postman pour test).
    """
    df_new = pd.DataFrame([new_data_dict])
    
    if model_type == "proximity":
        features_list = prox_features
        # Si la donnée envoyée contient déjà les features encodées (test direct)
        if "Seasons_4" in df_new.columns or "Reason for absence_13" in df_new.columns:
            for col in features_list:
                if col not in df_new.columns:
                    df_new[col] = 0.0
            # Supprimer les doublons de colonnes s'il y en a
            df_new = df_new.loc[:, ~df_new.columns.duplicated()]
            return df_new[features_list].astype(float)
            
        # Sinon, traitement normal avec l'historique
        df_combined = pd.concat([df_history, df_new], ignore_index=True)
        
        # Gérer la possibilité que 'Month of absence' soit manquant ou NaN
        if 'Month of absence' in df_combined.columns:
            df_combined['Seasons'] = df_combined['Month of absence'].fillna(1).apply(get_season)
        else:
            df_combined['Seasons'] = 4
            
        if 'Year' in df_combined.columns and 'Month of absence' in df_combined.columns and 'Day_of_month' in df_combined.columns:
            # Remplir les NaN par des valeurs par défaut pour éviter l'erreur to_datetime
            year = df_combined['Year'].fillna(2023).astype(int)
            month = df_combined['Month of absence'].fillna(1).astype(int)
            day = df_combined['Day_of_month'].fillna(1).astype(int)
            df_combined['Date'] = pd.to_datetime(dict(year=year, month=month, day=day))
        else:
            df_combined['Date'] = pd.Timestamp.now()
            
        df_combined = df_combined.sort_values(by=['ID', 'Date']).reset_index(drop=True)
        
        df_combined['Absence_Count'] = df_combined.groupby('ID').cumcount()
        df_combined['Prev_Date'] = df_combined.groupby('ID')['Date'].shift(1)
        df_combined['Prev_Absence_Gap'] = (df_combined['Date'] - df_combined['Prev_Date']).dt.days.fillna(0)
        df_combined['First_Absence_Date'] = df_combined.groupby('ID')['Date'].transform('min')
        df_combined['Days_Since_First_Absence'] = (df_combined['Date'] - df_combined['First_Absence_Date']).dt.days
        
        df_combined = df_combined.groupby('ID', group_keys=False).apply(get_rolling_counts)
        
        # Encodage One-Hot manuel pour s'aligner sur les features d'entraînement
        cat_cols = ['Reason for absence', 'Month of absence', 'Day of the week', 'Seasons', 'Education']
        for col in cat_cols:
            if col in df_combined.columns:
                df_combined[col] = df_combined[col].astype(str)
        
        df_encoded = pd.get_dummies(df_combined, drop_first=False)
        
        # Supprimer les colonnes dupliquées (au cas où get_dummies les recrée ou concat les a dupliquées)
        df_encoded = df_encoded.loc[:, ~df_encoded.columns.duplicated()]
        
        # Aligner avec prox_features
        for col in features_list:
            if col not in df_encoded.columns:
                df_encoded[col] = 0.0
                
        # Retourner la dernière ligne (la nouvelle absence)
        return df_encoded.iloc[-1:][features_list].astype(float)

    elif model_type == "suspicious":
        features_list = susp_features
        # Si la donnée envoyée contient déjà les features encodées
        if "Is_Unjustified" in df_new.columns or "Duration_Short" in df_new.columns:
            for col in features_list:
                if col not in df_new.columns:
                    df_new[col] = 0.0
            df_new = df_new.loc[:, ~df_new.columns.duplicated()]
            return df_new[features_list].astype(float)
            
        df_combined = pd.concat([df_history, df_new], ignore_index=True)
        
        # Gérer la possibilité que 'Month of absence' etc. soient manquants
        if 'Month of absence' not in df_combined.columns:
            df_combined['Month of absence'] = 1
        if 'Day of the week' not in df_combined.columns:
            df_combined['Day of the week'] = 2
            
        df_combined = df_combined.sort_values(by=['ID', 'Month of absence', 'Day of the week']).reset_index(drop=True)
        
        WEEKEND_DAYS = [2, 6]
        df_combined['Temp_WeekendBridge'] = df_combined['Day of the week'].isin(WEEKEND_DAYS).astype(int)
        
        df_combined['Emp_Total_Absences'] = df_combined.groupby('ID').cumcount()
        df_combined['Emp_Avg_Duration'] = df_combined.groupby('ID')['Absenteeism time in hours'].transform(lambda s: s.shift(1).expanding().mean())
        df_combined['Emp_WeekendBridge_Pct'] = df_combined.groupby('ID')['Temp_WeekendBridge'].transform(lambda s: s.shift(1).expanding().mean())
        
        df_combined['Emp_Avg_Duration'] = df_combined['Emp_Avg_Duration'].fillna(df_combined['Absenteeism time in hours'].median())
        df_combined['Emp_WeekendBridge_Pct'] = df_combined['Emp_WeekendBridge_Pct'].fillna(0)
        
        if 'Reason for absence' in df_combined.columns:
            df_combined['Is_Unjustified'] = (df_combined['Reason for absence'] == 8).astype(int)
        else:
            df_combined['Is_Unjustified'] = 0
            
        if 'Absenteeism time in hours' in df_combined.columns:
            df_combined['Duration_Short'] = (df_combined['Absenteeism time in hours'] <= 8).astype(int)
        else:
            df_combined['Duration_Short'] = 0
            
        # Aligner avec susp_features
        for col in features_list:
            if col not in df_combined.columns:
                df_combined[col] = 0.0
                
        return df_combined.iloc[-1:][features_list].astype(float)

# ==============================================================================
# 3. ROUTES DE L'API (BACKEND)
# ==============================================================================

@app.route('/')
def home():
    return jsonify({"status": "success", "message": "API RH Analytics (Feature Engineering Dynamique)"})

@app.route('/api/predict_proximity', methods=['POST'])
def predict_proximity():
    try:
        raw_data = request.json
        if not raw_data:
            return jsonify({"error": "Aucune donnée envoyée"}), 400
        
        # 1. Feature Engineering à la volée
        X = engineer_features(raw_data, "proximity")
        
        # 2. Scaler
        if hasattr(prox_scaler, 'feature_names_in_'):
            X = X[prox_scaler.feature_names_in_]
            
        try:
            X_scaled_array = prox_scaler.transform(X.values)
        except Exception as e:
            return jsonify({
                "error": str(e),
                "debug_X_length": len(X.columns),
                "debug_X_columns": list(X.columns),
                "debug_scaler_expected": getattr(prox_scaler, 'n_features_in_', 'unknown')
            }), 500
        
        # 3. Prédiction
        try:
            y_proba = prox_model.predict_proba(X_scaled_array)[0]
        except Exception as e:
            return jsonify({
                "error": str(e),
                "debug_X_length": len(X.columns),
                "debug_X_columns": list(X.columns)
            }), 500
                
        prob_lointain = y_proba[lointain_idx]
        
        if prob_lointain >= prox_threshold:
            pred_class_idx = lointain_idx
        else:
            pred_class_idx = 1 - lointain_idx
            
        pred_label = prox_encoder.inverse_transform([pred_class_idx])[0]
        
        return jsonify({
            "status": "success",
            "prediction": pred_label,
            "probability_lointain": float(prob_lointain),
            "probability_proche": float(1 - prob_lointain),
            "alert_manager": pred_label == "Proche (<= 30 jours)",
            "message": "Attention: L'employé risque de s'absenter dans les 30 prochains jours." if pred_label == "Proche (<= 30 jours)" else "Absence prévue à plus long terme."
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/detect_suspicious', methods=['POST'])
def detect_suspicious():
    try:
        raw_data = request.json
        if not raw_data:
            return jsonify({"error": "Aucune donnée envoyée"}), 400
            
        # 1. Feature Engineering à la volée
        X = engineer_features(raw_data, "suspicious")
        
        # 2. Scaler (on passe .values pour éviter l'erreur stricte)
        X_scaled_array = susp_scaler.transform(X.values)
        
        # 3. Prédiction
        anomaly_score = susp_model.decision_function(X_scaled_array)[0]
        is_suspect = bool(susp_model.predict(X_scaled_array)[0] == -1)
        
        explanations = "Anomalie détectée par Isolation Forest." if is_suspect else "Score normal."
            
        return jsonify({
            "status": "success",
            "is_suspect": is_suspect,
            "anomaly_score": float(anomaly_score),
            "message": "🔴 ALERTE : Cette absence présente des caractéristiques suspectes." if is_suspect else "🟢 Absense considérée comme légitime.",
            "explanations": explanations
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("\n🚀 Démarrage de l'API Flask HR Analytics...")
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5000)

# ---
