import os
import io
import base64
import librosa
import numpy as np
import psycopg2
from flask import Flask, request, jsonify, send_from_directory
from tensorflow.keras.models import load_model
from datetime import datetime
from pydub import AudioSegment
from datetime import datetime, timedelta
from flask_cors import CORS 

app = Flask(__name__)
CORS(app) 

MODEL_PATH = r"C:\Users\Naruethep Sovajan\Desktop\VoiceRe\SaveModel\snoring_cnn_classifier_model.h5"
if not os.path.exists(MODEL_PATH):
    print(f"Warning: Model file not found at: {MODEL_PATH}")
DB_CONFIG = {
    "dbname": "myrec_db", 
    "user": "postgres",
    "password": "louis23zx",  
    "host": "localhost"
}

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

try:
    model = load_model(MODEL_PATH)
    print("Snoring detection model loaded successfully.")#ดักจับข้อผิดพลาดในการโหลดโมเดล
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")#ดักจับข้อผิดพลาดการเชื่อมต่อserver
        return None



def extract_features(y, sr, n_mels=128, n_fft=2048, hop_length=512, n_frames=128):
    
    mels = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_mels=n_mels,
        n_fft=n_fft,
        hop_length=hop_length,
    )
    
    mels = librosa.power_to_db(mels, ref=np.max)

    # ปรับขนาด ให้เป็น (128, 128)
    if mels.shape[1] > n_frames:
        mels = mels[:, :n_frames]
    elif mels.shape[1] < n_frames:
        pad_width = n_frames - mels.shape[1]
        mels = np.pad(mels, ((0, 0), (0, pad_width)), mode='constant')
        
    return mels

@app.route("/analyze-audio", methods=["POST"])
def analyze_audio():
    """Receives base64 audio data, analyzes it for snoring, and saves results."""
    # Assuming 'model' and 'extract_features' are defined elsewhere
    # Assuming 'UPLOAD_FOLDER', 'get_db_connection', AudioSegment, librosa, np, 
    # datetime, timedelta, os, io, and base64 are imported.
    if model is None: 
        return jsonify({"error": "Model not loaded", "message": "The AI model failed to load on the server."}), 500
        
    try:
        data = request.json
        audio_base64 = data.get("audio_data")
        name = data.get("name", "Unnamed Recording")
        user_uid = data.get("user_uid")
        duration_millis = data.get('duration_millis')

        if not audio_base64:
            return jsonify({"error": "Invalid input", "message": "Missing audio_data"}), 400

        audio_bytes = base64.b64decode(audio_base64)
        audio_io = io.BytesIO(audio_bytes)
        
        # Use a proper temporary file creation for safety
        temp_wav_path = os.path.join(UPLOAD_FOLDER, f"temp_{os.getpid()}.wav")
        audio_segment = AudioSegment.from_file(audio_io)
        audio_segment.export(temp_wav_path, format="wav")
        
        y, sr = librosa.load(temp_wav_path, sr=16000)
        os.remove(temp_wav_path)

        chunk_size = 4.0  
        chunk_samples = int(chunk_size * sr)
        all_features_list = []

        for i in range(0, len(y) - chunk_samples + 1, chunk_samples):
            chunk = y[i:i + chunk_samples]
            features = extract_features(chunk, sr)
            all_features_list.append(features)

        if not all_features_list:
            return jsonify({"error": "Analysis failed", "message": "Audio is too short for analysis."}), 400

        X_predict = np.stack([np.expand_dims(f, axis=-1) for f in all_features_list])
        predictions = model.predict(X_predict, verbose=0)

        snoring_count = 0
        loudest_snore_db = 0.0
        silence_duration = 0
        apnea_events_count = 0
        silence_threshold = 0.01      
        min_silence_duration = 5 
        snoring_times_seconds = []
            
        for i in range(0, len(y), sr):  
            chunk = y[i:i + sr]
            rms = np.sqrt(np.mean(chunk**2)) 

            if rms < silence_threshold:
                silence_duration += 1
            else:
                silence_duration = 0
                
            if silence_duration == min_silence_duration:
                apnea_events_count += 1
            
            db_level = 20 * np.log10(rms + 1e-6) 
            snore_db_scaled = 100 + db_level     
            # loudest_snore_db will retain the NumPy float type here
            loudest_snore_db = max(loudest_snore_db, snore_db_scaled) 

        for idx, prob in enumerate(predictions):
            if prob[0] > 0.5:
                snoring_count += 1
                relative_time = idx * 4.0 
                snoring_times_seconds.append(relative_time)

        # --- FIX: Convert NumPy float to standard Python float for DB insertion ---
        # This resolves the "can't adapt type 'numpy.float32'" error.
        if isinstance(loudest_snore_db, (np.float32, np.float64)):
            loudest_snore_db_safe = float(loudest_snore_db)
        else:
            loudest_snore_db_safe = loudest_snore_db

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database error", "message": "Failed to connect to the database."}), 500
        # The previous conn check should be sufficient, removing redundant check here.
        # conn = get_db_connection()
        # if not conn:
        #     return jsonify({"error": "Database error", "message": "Failed to connect to the database."}), 500
            
        cur = conn.cursor()
        file_name = f"{user_uid}_{name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.wav"
        file_path = os.path.join(UPLOAD_FOLDER, file_name)
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes))
        audio_segment.export(file_path, format="wav")
        file_url = f"/uploads/{file_name}"

        current_time = datetime.now()
        snoring_absolute_timestamps = []
        if snoring_times_seconds:
            for relative_sec in snoring_times_seconds:
                time_offset = timedelta(seconds=relative_sec)
                # เวลากรน = เวลาเริ่มต้น + เวลาชดเชย
                absolute_time = current_time + time_offset
                snoring_absolute_timestamps.append(absolute_time)

        cur.execute("""
            INSERT INTO recordings (
                user_uid, name, created_at, snoring_count, loudest_snore_db, file_url,duration_millis,apnea_events_count, snoring_absolute_timestamps
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (user_uid, name, current_time, snoring_count, loudest_snore_db_safe, file_url, duration_millis, apnea_events_count, snoring_absolute_timestamps))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Analysis complete and data saved to DB",
            "id": new_id,
            "snoring_count": snoring_count,
            "loudest_snore_db": loudest_snore_db_safe,
            "apnea_events_count": apnea_events_count,
            "file_url": file_url,
            "created_at": datetime.now().isoformat(),
            "snoring_absolute_timestamps": [t.isoformat() for t in snoring_absolute_timestamps]
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during audio analysis: {e}")
        return jsonify({"error": "Internal server error during analysis", "message": str(e)}), 500

@app.route("/save-user-profile", methods=["POST"])
def save_user_profiles():
    """Receives user profiles data and saves it to the user_profile table."""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error", "message": "Failed to connect to the database."}), 500

    try:
        data = request.json
        user_uid = data.get("uid")
        first_name = data.get("firstName")
        last_name = data.get("lastName")
        sex = data.get("gender")

        if not all([user_uid, first_name, last_name, sex]):
            return jsonify({"error": "Invalid input", "message": "Missing required profile fields (uid, firstName, lastName, gender)."}), 400

        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO user_profiles (user_uid, first_name, last_name, sex, created_at, is_deleted) 
            VALUES (%s, %s, %s, %s, %s, FALSE)
            ON CONFLICT (user_uid) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                sex = EXCLUDED.sex
            RETURNING user_uid;
            """,
            (user_uid, first_name, last_name, sex, datetime.now()) 
        )   
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({'message': 'User profile saved successfully', 'user_uid': user_uid}), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        if conn: conn.rollback()
        print(f"Error saving user profile: {e}")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """
    Serves the static audio files from the UPLOAD_FOLDER directory.
    This route allows the mobile app to download/play the audio files.
    """
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/get-user-profile/<user_uid>", methods=["GET"])
def get_user_profile(user_uid):
    """ดึงข้อมูลโปรไฟล์ผู้ใช้จากตาราง user_profiles ตาม user_uid"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error", "message": "Failed to connect to the database."}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT user_uid, first_name, last_name, sex, created_at
            FROM user_profiles
            WHERE user_uid = %s;
        """, (user_uid,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"error": "Not Found", "message": "User profile not found"}), 404
        
        return jsonify({
            "user_uid": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "sex": row[3],
            "created_at": row[4].isoformat() if row[4] else None
        }), 200

    except Exception as e:
        print(f"Error fetching user profile: {e}")
        if conn: conn.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route('/get-recording-stats/<uid>', methods=['GET'])
def get_recording_stats(uid):
    print("📩 Received UID:", repr(uid))
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error", "message": "Failed to connect to the database."}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                COUNT(DISTINCT DATE(created_at)) AS total_days,
                COALESCE(SUM(duration_millis) / 60000.0 / NULLIF(COUNT(DISTINCT DATE(created_at)), 0), 0) AS avg_duration,
                COALESCE(AVG(apnea_events_count), 0) AS avg_apnea_count, 
                COALESCE(MAX(loudest_snore_db), 0) AS max_snore_db
            FROM recordings
            WHERE user_uid = %s;
        """, (uid,))
        
        row = cur.fetchone()
        cur.close()
        conn.close()

        return jsonify({
            'total_days': row[0] or 0,
            'avg_duration': round(row[1] or 0, 2),
            'avg_apnea_count': round(row[2] or 0, 2),  
            'max_snore_db': round(row[3] or 0, 2)      
        })

    except Exception as e:
        print(f" Error in /get-recording-stats: {e}")
        if conn:
            conn.close()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route("/get-recordings/<user_uid>", methods=["GET"])
def get_recordings(user_uid):
    """Retrieve all recorded audio analysis results for a specific user."""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database error", "message": "Failed to connect to the database."}), 500
            
        cur = conn.cursor()
        cur.execute("""
            -- ดึงข้อมูล apnea_events_count และปรับตำแหน่งของ snoring_absolute_timestamps
            SELECT id, name, snoring_count, loudest_snore_db, file_url, created_at,duration_millis, apnea_events_count, snoring_absolute_timestamps 
            FROM recordings
            WHERE user_uid = %s
            ORDER BY created_at DESC;
        """, (user_uid,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        results = [
            {
                "id": r[0],
                "name": r[1],
                "snoring_count": r[2],
                "loudest_snore_db": r[3],
                "file_url": r[4],
                "created_at": r[5].isoformat(),
                "duration_millis": r[6],
                "apnea_events_count": r[7],
                "snoring_absolute_timestamps": [t.isoformat() for t in r[8]] if r[8] else [] 
            }
            for r in rows
        ]
        return jsonify(results)
    except Exception as e:
        print(f"Error fetching recordings: {e}")
        return jsonify({"error": "Internal server error", "message": "Failed to fetch recordings."}), 500
    
@app.route("/admin/get-all-user-stats", methods=["GET"])
def get_all_user_stats():
    """
    Retrieves all user profiles along with their aggregated recording statistics 
    and the is_deleted status for the Admin Dashboard.
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error", "message": "Failed to connect to the database."}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                up.user_uid,
                up.first_name,
                up.last_name,
                up.is_deleted,
                up.created_at,
                MAX(r.created_at) AS last_used,
                COUNT(DISTINCT DATE(r.created_at)) AS days_used,
                COALESCE(SUM(r.duration_millis), 0) AS total_duration_millis
                
                    
            FROM user_profiles up
            LEFT JOIN recordings r ON up.user_uid = r.user_uid
            GROUP BY up.user_uid, up.first_name, up.last_name, up.is_deleted, up.created_at
            ORDER BY last_used DESC NULLS LAST;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        results = [
            {
                "id": r[0],
                "user_uid": r[0],
                "firstName": r[1],
                "lastName": r[2],
                "fullName": f"{r[1]} {r[2]}",
                "isDeleted": r[3], 
                "createdAt": r[4].isoformat() if r[4] else 'N/A', # 🎯 NEW FIELD: Index 4
                "lastUsed": r[5].isoformat() if r[5] else 'N/A', # 🔑 Index ถูกเลื่อนเป็น 5
                "daysUsed": int(r[6] or 0), 
                "totalDurationMillis": int(r[7] or 0) 
            }
            for r in rows
        ]

        return jsonify(results), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        if conn: conn.rollback()
        print(f"Error fetching admin user stats: {e}")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route('/admin/user-profile/<uid>', methods=['PUT'])
def update_user_profile(uid):
    """
    ✅ อัปเดตสถานะการระงับบัญชี (is_deleted) ของผู้ใช้
    เรียกจากหน้า AdminDashboardScreen
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    try:
        data = request.get_json()
        if not data or 'is_deleted' not in data:
            return jsonify({"message": "Missing required field: is_deleted"}), 400

        is_deleted = data['is_deleted']

        cur = conn.cursor()
        cur.execute("""
            UPDATE user_profiles 
            SET is_deleted = %s
            WHERE user_uid = %s
            RETURNING user_uid;
        """, (is_deleted, uid))

        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not updated:
            return jsonify({"message": f"User {uid} not found"}), 404

        action = "ระงับ" if is_deleted else "กู้คืน"
        return jsonify({
            "message": f"บัญชี {uid} ถูก{action}เรียบร้อยแล้ว",
            "is_deleted": is_deleted
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        if conn: conn.rollback()
        return jsonify({"message": f"Error updating user status: {str(e)}"}), 500

@app.route("/user-status/<uid>", methods=["GET"])
def get_user_status(uid):
    """
    ใช้สำหรับให้ฝั่ง Mobile App ตรวจสอบสถานะบัญชี (ถูกระงับหรือไม่)
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT is_deleted
            FROM user_profiles
            WHERE user_uid = %s;
        """, (uid,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"message": "User not found", "isDeleted": False}), 404

        return jsonify({"isDeleted": row[0]}), 200

    except Exception as e:
        print("Error fetching user status:", e)
        if conn:
            conn.close()
        return jsonify({"message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)