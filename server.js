// server.js

// 1. โหลด Environment Variables จาก .env file
require('dotenv').config();

// 2. Import Libraries ที่จำเป็น
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

// 3. สร้าง Instance ของ Express App
const app = express();
const port = process.env.PORT || 3000;
const uploadsDir = './uploads';

// 4. Middleware ทั่วไปของ Express
app.use(cors());
// *** แก้ไขตรงนี้: เพิ่ม limit เพื่อรองรับไฟล์ขนาดใหญ่ ***
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log('--- Incoming Request ---');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Headers:', req.headers);
    next();
});

// 5. เชื่อมต่อกับ PostgreSQL Database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Connection to PostgreSQL failed', err));


// 6. API Endpoints

// --- API 1: POST /upload-recording (บันทึกไฟล์เสียงลง Local Disk และข้อมูลลง PostgreSQL) ---
app.post('/upload-recording', async (req, res) => {
    try {
        console.log('Request body keys:', Object.keys(req.body));
        const { name, durationMillis, fileBase64 } = req.body;

        if (!fileBase64) {
            return res.status(400).json({ message: 'No audio file data received.' });
        }
        
        // --- 1. แปลง Base64 เป็น Binary Data และบันทึกไฟล์ ---
        await fs.mkdir(uploadsDir, { recursive: true });
        const fileName = `audio-${Date.now()}-${Math.round(Math.random() * 1E9)}.m4a`;
        const localFilePath = path.join(uploadsDir, fileName);
        
        const buffer = Buffer.from(fileBase64, 'base64');
        await fs.writeFile(localFilePath, buffer);
        console.log('File saved successfully:', localFilePath);
        
        // --- 2. บันทึกข้อมูลลงฐานข้อมูล PostgreSQL ---
        const audioAccessUrl = `/uploads/${fileName}`;

        const query = `
            INSERT INTO recordings (name, duration_millis, cloud_storage_url, created_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const values = [name, parseInt(durationMillis), audioAccessUrl];
        const result = await pool.query(query, values);
        const newRecording = result.rows[0];

        res.status(201).json({
            message: 'Recording uploaded and saved successfully',
            data: newRecording
        });

    } catch (error) {
        console.error('Error uploading or saving recording:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// --- API 2: GET /recordings (ดึงรายการบันทึกเสียงทั้งหมดจาก PostgreSQL) ---
app.get('/recordings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recordings ORDER BY created_at DESC;');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching recordings:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// --- API 3: DELETE /recordings/:id (ลบการบันทึกเสียงจาก Local Disk และ PostgreSQL) ---
app.delete('/recordings/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const getPathQuery = 'SELECT cloud_storage_url FROM recordings WHERE id = $1;';
        const pathResult = await pool.query(getPathQuery, [id]);

        if (pathResult.rows.length === 0) {
            return res.status(404).json({ message: 'Recording not found.' });
        }

        const localRelativePath = pathResult.rows[0].cloud_storage_url;
        const localFullPath = path.join(__dirname, localRelativePath);

        try {
            await fs.unlink(localFullPath);
            console.log(`Successfully deleted local file: ${localFullPath}`);
        } catch (fileError) {
            if (fileError.code === 'ENOENT') {
                console.warn(`File not found at ${localFullPath}, skipping local deletion.`);
            } else {
                console.error(`Error deleting local file ${localFullPath}:`, fileError);
            }
        }

        const deleteQuery = 'DELETE FROM recordings WHERE id = $1 RETURNING id;';
        const deleteResult = await pool.query(deleteQuery, [id]);

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Recording metadata not found in DB.' });
        }

        res.status(200).json({ message: 'Recording deleted successfully', deletedId: id });

    } catch (error) {
        console.error('Error deleting recording:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// 7. Start the server
app.use('/uploads', express.static('uploads'));

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port}`);
});