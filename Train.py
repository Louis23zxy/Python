import tensorflow as tf
import librosa
import numpy as np
import os
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
from tqdm import tqdm

# 1. ฟังก์ชันสกัดคุณลักษณะ MFCC
def extract_mfcc(y, sr, n_mfcc=20, max_len=128):  # ← เปลี่ยนจาก 130 → 128
    """
    สกัดคุณลักษณะ MFCC จากสัญญาณเสียง
    พารามิเตอร์:
        y: สัญญาณเสียง
        sr: อัตราการสุ่มตัวอย่าง
        n_mfcc: จำนวนสัมประสิทธิ์ MFCC
        max_len: ความยาวสูงสุดของเฟรม (ปรับให้เท่ากันทุกไฟล์)
    คืนค่า:
        เมทริกซ์คุณลักษณะ MFCC ที่ผ่านการปรับขนาดแล้ว
    """
    try:
        # สกัด MFCC และ derivatives
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        delta = librosa.feature.delta(mfcc)
        delta2 = librosa.feature.delta(mfcc, order=2)
        
        features = np.vstack([mfcc, delta, delta2])
        
        # ปรับความยาวให้เท่ากัน
        if features.shape[1] < max_len:
            pad_width = max_len - features.shape[1]
            features = np.pad(features, pad_width=((0,0), (0,pad_width)), mode='constant')
        else:
            features = features[:, :max_len]
            
        return features.T  # (time_steps, features)
    except Exception as e:
        print(f"Error extracting MFCC: {e}")
        return None

# 2. ฟังก์ชันโหลดข้อมูลเสียงกรน
def load_snoring_data(data_dir, max_files=None):
    """
    โหลดข้อมูลเสียงกรนจากโฟลเดอร์
    พารามิเตอร์:
        data_dir: เส้นทางไปยังโฟลเดอร์ข้อมูล
        max_files: จำนวนไฟล์สูงสุดที่จะโหลด (None สำหรับโหลดทั้งหมด)
    คืนค่า:
        อาร์เรย์ของคุณลักษณะ MFCC
    """
    features = []
    file_list = [f for f in os.listdir(data_dir) if f.endswith('.wav')]
    
    if max_files is not None:
        file_list = file_list[:max_files]
    
    print(f"\nพบไฟล์เสียงทั้งหมด {len(file_list)} ไฟล์")
    print("กำลังโหลดและประมวลผลไฟล์...")
    
    for file in tqdm(file_list):
        file_path = os.path.join(data_dir, file)
        try:
            y, sr = librosa.load(file_path, sr=None)
            mfcc = extract_mfcc(y, sr)
            if mfcc is not None:
                features.append(mfcc)
        except Exception as e:
            print(f"\nError loading {file}: {e}")
    
    if len(features) == 0:
        print("\nไม่พบไฟล์เสียงที่ประมวลผลได้!")
        return None
    
    print(f"\nโหลดข้อมูลสำเร็จ: {len(features)} ไฟล์")
    return np.array(features)

# 3. สร้างโครงสร้าง Autoencoder
def build_autoencoder(input_shape):
    """
    สร้างโมเดล Autoencoder สำหรับการเรียนรู้คุณลักษณะเสียงกรน
    พารามิเตอร์:
        input_shape: รูปร่างของข้อมูลนำเข้า (time_steps, features)
    คืนค่า:
        โมเดล Autoencoder
    """
    input_layer = tf.keras.layers.Input(shape=input_shape)
    
    # Encoder
    x = tf.keras.layers.Conv1D(64, 5, activation='relu', padding='same')(input_layer)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPooling1D(2)(x)
    
    x = tf.keras.layers.Conv1D(128, 3, activation='relu', padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPooling1D(2)(x)
    
    # Decoder
    x = tf.keras.layers.Conv1D(128, 3, activation='relu', padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.UpSampling1D(2)(x)
    
    x = tf.keras.layers.Conv1D(64, 5, activation='relu', padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.UpSampling1D(2)(x)
    
    output_layer = tf.keras.layers.Conv1D(input_shape[1], 3, activation='linear', padding='same')(x)
    
    autoencoder = tf.keras.models.Model(input_layer, output_layer)
    autoencoder.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), 
                      loss='mse')
    
    return autoencoder

# 4. ฟังก์ชันแสดงผลการฝึก
def plot_training_history(history):
    plt.figure(figsize=(10, 5))
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Training History')
    plt.ylabel('Mean Squared Error (MSE)')
    plt.xlabel('Epoch')
    plt.legend()
    plt.grid(True)
    plt.show()

# 5. ฟังก์ชันหลัก
def main():
    # ตั้งค่าเส้นทาง
    data_dir = r'C:\Users\Naruethep Sovajan\Desktop\sound\class1'
    model_save_path = r'C:\Users\Naruethep Sovajan\Desktop\VoiceRe\SaveModel\snoring_autoencoder.keras'
    
    # โปรแกรมแสดงข้อมูลเริ่มต้น
    print("="*50)
    print("ระบบฝึกโมเดลตรวจจับเสียงกรนแบบ Autoencoder")
    print("="*50)
    
    # โหลดข้อมูล
    print("\n[ขั้นตอนที่ 1] กำลังโหลดข้อมูลเสียงกรน...")
    X = load_snoring_data(data_dir)
    
    if X is None:
        return
    
    # แบ่งข้อมูล
    print("\n[ขั้นตอนที่ 2] แบ่งข้อมูลเป็นชุดฝึกและชุดตรวจสอบ")
    X_train, X_val = train_test_split(X, test_size=0.2, random_state=42)
    print(f"จำนวนข้อมูลฝึก: {len(X_train)} ตัวอย่าง")
    print(f"จำนวนข้อมูลตรวจสอบ: {len(X_val)} ตัวอย่าง")
    
    # สร้างโมเดล
    print("\n[ขั้นตอนที่ 3] สร้างโครงสร้าง Autoencoder")
    autoencoder = build_autoencoder(input_shape=(X_train.shape[1], X_train.shape[2]))
    autoencoder.summary()
    
    # ฝึกโมเดล
    print("\n[ขั้นตอนที่ 4] เริ่มฝึกโมเดล")
    history = autoencoder.fit(
        X_train, X_train,
        epochs=100,
        batch_size=32,
        validation_data=(X_val, X_val),
        callbacks=[
            tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
        ],
        verbose=1
    )
    
    # แสดงผลการฝึก
    plot_training_history(history)
    
    # บันทึกโมเดล
    print("\n[ขั้นตอนที่ 5] บันทึกโมเดล")
    autoencoder.save(model_save_path)
    print(f"บันทึกโมเดลเรียบร้อยที่: {model_save_path}")
    
    # ตัวอย่างการคำนวณ Reconstruction Error
    sample = X_val[0]
    reconstructed = autoencoder.predict(np.expand_dims(sample, axis=0))
    mse = np.mean(np.square(sample - reconstructed[0]))
    print(f"\nตัวอย่าง Reconstruction Error: {mse:.4f}")
def main():
    import pickle  # เพิ่ม import สำหรับบันทึก label encoder

    # ตั้งค่าเส้นทาง
    data_dir = r'C:\Users\Naruethep Sovajan\Desktop\sound\class1'
    model_save_path = r'C:\Users\Naruethep Sovajan\Desktop\VoiceRe\SaveModel\snoring_autoencoder.keras'
    label_encoder_path = r'C:\Users\Naruethep Sovajan\Desktop\VoiceRe\Tranferdata\label_encoder.pkl'
    
    print("="*50)
    print("ระบบฝึกโมเดลตรวจจับเสียงกรนแบบ Autoencoder")
    print("="*50)

    # [ขั้นตอนที่ 1] โหลดข้อมูลเสียงกรน
    print("\n[ขั้นตอนที่ 1] กำลังโหลดข้อมูลเสียงกรน...")
    X = load_snoring_data(data_dir)

    if X is None:
        return

    # [ขั้นตอนที่ 2] แบ่งข้อมูลเป็นชุดฝึกและชุดตรวจสอบ
    print("\n[ขั้นตอนที่ 2] แบ่งข้อมูลเป็นชุดฝึกและชุดตรวจสอบ")
    from sklearn.model_selection import train_test_split
    X_train, X_val = train_test_split(X, test_size=0.2, random_state=42)
    print(f"จำนวนข้อมูลฝึก: {len(X_train)} ตัวอย่าง")
    print(f"จำนวนข้อมูลตรวจสอบ: {len(X_val)} ตัวอย่าง")

    # [ขั้นตอนที่ 3] สร้างโครงสร้าง Autoencoder
    print("\n[ขั้นตอนที่ 3] สร้างโครงสร้าง Autoencoder")
    autoencoder = build_autoencoder(input_shape=(X_train.shape[1], X_train.shape[2]))
    autoencoder.summary()

    # [ขั้นตอนที่ 4] เริ่มฝึกโมเดล
    print("\n[ขั้นตอนที่ 4] เริ่มฝึกโมเดล")
    history = autoencoder.fit(
        X_train, X_train,
        epochs=100,
        batch_size=16,
        validation_data=(X_val, X_val),
        callbacks=[
            tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
        ],
        verbose=1
    )

    # แสดงกราฟ loss
    plot_training_history(history)

    # [ขั้นตอนที่ 5] บันทึกโมเดล
    print("\n[ขั้นตอนที่ 5] บันทึกโมเดล")
    autoencoder.save(model_save_path)
    print(f"✅ บันทึกโมเดลเรียบร้อยที่: {model_save_path}")

    # [ขั้นตอนที่ 6] บันทึก label encoder (ในที่นี้ยังไม่มี encoder จริง จึงเซฟ None ไว้ก่อน)
    try:
        with open(label_encoder_path, 'wb') as f:
            pickle.dump(None, f)  # ถ้ามี label encoder จริง เปลี่ยน None เป็นตัวแปร encoder
        print(f"✅ บันทึก label encoder เรียบร้อยที่: {label_encoder_path}")
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการบันทึก label encoder: {e}")

    # [ขั้นตอนที่ 7] แสดง reconstruction error ตัวอย่าง
    sample = X_val[0]
    reconstructed = autoencoder.predict(np.expand_dims(sample, axis=0))
    mse = np.mean(np.square(sample - reconstructed[0]))
    print(f"\nตัวอย่าง Reconstruction Error: {mse:.4f}")


if __name__ == "__main__":
    main()
