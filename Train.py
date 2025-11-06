import tensorflow as tf
import librosa
import numpy as np
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelBinarizer 
import matplotlib.pyplot as plt
from tqdm import tqdm

DATA_PATH = "C:/Users/Naruethep Sovajan/Desktop/Sound" 
SAMPLE_RATE = 16000 
MAX_LEN = 128       
N_MELS = 128        
MODEL_OUTPUT_DIR = "C:/Users/Naruethep Sovajan/Desktop/VoiceRe/SaveModel"
model_save_path = "snoring_cnn_classifier_model.h5"
label_encoder_path = "label_encoder.pkl"


def extract_features(file_path, sr=SAMPLE_RATE, n_mels=N_MELS, max_len=MAX_LEN):
    try:
        y, sr = librosa.load(file_path, sr=sr)
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels)
        features = librosa.power_to_db(mel_spec, ref=np.max)
        if features.shape[1] < max_len:
            pad_width = max_len - features.shape[1]
            features = np.pad(features, pad_width=((0, 0), (0, pad_width)), mode='constant')
        else:
            features = features[:, :max_len]
        features = np.expand_dims(features, axis=-1)
        return features
        
    except Exception as e:
        return None 

def create_cnn_model(input_shape, num_classes=1):
    model = tf.keras.models.Sequential([

        tf.keras.layers.Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=input_shape, padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
        tf.keras.layers.Dropout(0.25),

  
        tf.keras.layers.Conv2D(64, kernel_size=(3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
        tf.keras.layers.Dropout(0.25),
        
  
        tf.keras.layers.Conv2D(128, kernel_size=(3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
        tf.keras.layers.Dropout(0.25),

        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.5),

        tf.keras.layers.Dense(num_classes, activation='sigmoid')
    ])
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy', 
        metrics=['accuracy']
    )
    return model

def plot_training_history(history):
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.ylabel('Loss')
    plt.xlabel('Epoch')
    plt.legend(loc='upper right')

    plt.subplot(1, 2, 2)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Model Accuracy')
    plt.ylabel('Accuracy')
    plt.xlabel('Epoch')
    plt.legend(loc='lower right')
    
    plt.show()

def main():   
    print("="*50)
    print("ระบบฝึกโมเดลตรวจจับเสียงกรนแบบ 2D-CNN Classification")
    print("="*50)
    print("\nโหลดและสกัดคุณลักษณะข้อมูล")
    
    features = []
    labels = []
    
    for dirname, _, filenames in os.walk(DATA_PATH):
        label = os.path.basename(dirname) 
        if label in ['class1', 'class2']: 
            for filename in tqdm(filenames, desc=f"Processing {label} files"):
                if filename.endswith(('.wav', '.mp3')):
                    file_path = os.path.join(dirname, filename)
                    feature = extract_features(file_path)
                    
                    if feature is not None and feature.shape == (N_MELS, MAX_LEN, 1):
                        features.append(feature)
                        labels.append(label)

    X = np.array(features)
    y_str = np.array(labels) 

    print(f"\nพบข้อมูลทั้งหมดที่ประมวลผลได้: {len(X)} ตัวอย่าง")
    
    encoder = LabelBinarizer()
    Y = encoder.fit_transform(y_str)
    
    if Y.ndim == 1:
        Y = Y.reshape(-1, 1) 
    
    X_train, X_val, Y_train, Y_val = train_test_split(
        X, Y, test_size=0.2, random_state=42, stratify=Y 
    )
    
    print(f"X_train.shape: {X_train.shape}")
    print(f"Y_train.shape: {Y_train.shape}")

    print("\nสร้างโมเดล 2D-CNN")
    input_shape = X_train.shape[1:] 
    
    cnn_model = create_cnn_model(input_shape=input_shape, num_classes=1) 
    cnn_model.summary()

    print("\nเริ่มฝึกโมเดล")
    history = cnn_model.fit(
        X_train, Y_train,  
        epochs=100,
        batch_size=32, 
        validation_data=(X_val, Y_val), 
        callbacks=[
            tf.keras.callbacks.EarlyStopping(patience=15, restore_best_weights=True), 
            tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=7) 
        ],
        verbose=1
    )

    plot_training_history(history)

    print("\n บันทึกโมเดล")
    os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True) 
    cnn_model.save(model_save_path)
    print(f" บันทึกโมเดลเรียบร้อยที่: {model_save_path}")

    try:
        with open(label_encoder_path, 'wb') as f:
            pickle.dump(encoder, f)
        print(f" บันทึก label encoder เรียบร้อยที่: {label_encoder_path}")
    except Exception as e:
        print(f" เกิดข้อผิดพลาดในการบันทึก Label Encoder: {e}")

if __name__ == "__main__":
    main()