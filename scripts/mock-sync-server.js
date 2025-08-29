#!/usr/bin/env node

/**
 * Mock Sync Server for Local Testing
 * Simulates the PHP API endpoints locally
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

// Enable CORS for all origins
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Storage directory
const STORAGE_DIR = path.join(__dirname, '../.mock-sync-storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Helper to get file path for sync ID
const getFilePath = (syncId) => path.join(STORAGE_DIR, `${syncId}.json`);

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Create sync endpoint
app.post('/api/sync/create_timestamp.php', (req, res) => {
  const { sync_id, device_id, encrypted_blob, timestamp } = req.body;
  
  if (!sync_id || !encrypted_blob) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }
  
  const data = {
    sync_id,
    device_id,
    encrypted_blob,
    timestamp: timestamp || Date.now(),
    records: [{
      device_id,
      encrypted_blob,
      timestamp: timestamp || Date.now()
    }]
  };
  
  fs.writeFileSync(getFilePath(sync_id), JSON.stringify(data, null, 2));
  
  console.log(`✅ Created sync: ${sync_id}`);
  res.json({ 
    success: true, 
    sync_id,
    message: 'Sync created successfully' 
  });
});

// Join sync endpoint
app.post('/api/sync/join_timestamp.php', (req, res) => {
  const { sync_id, device_id } = req.body;
  
  if (!sync_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing sync_id' 
    });
  }
  
  const filePath = getFilePath(sync_id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      error: 'Sync not found' 
    });
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const latestRecord = data.records[data.records.length - 1];
  
  console.log(`✅ Device ${device_id} joined sync: ${sync_id}`);
  res.json({ 
    success: true,
    latest_record: latestRecord
  });
});

// Push data endpoint
app.post('/api/sync/push_timestamp.php', (req, res) => {
  const { sync_id, device_id, encrypted_blob, timestamp } = req.body;
  
  if (!sync_id || !encrypted_blob) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }
  
  const filePath = getFilePath(sync_id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      error: 'Sync not found' 
    });
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  data.records.push({
    device_id,
    encrypted_blob,
    timestamp: timestamp || Date.now()
  });
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`✅ Pushed data to sync: ${sync_id}`);
  res.json({ 
    success: true,
    message: 'Data pushed successfully'
  });
});

// Pull data endpoint
app.get('/api/sync/pull_timestamp.php', (req, res) => {
  const { sync_id, device_id, since } = req.query;
  
  if (!sync_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing sync_id' 
    });
  }
  
  const filePath = getFilePath(sync_id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      error: 'Sync not found' 
    });
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const sinceTimestamp = parseInt(since || '0', 10);
  
  // Filter records newer than the requested timestamp
  const newRecords = data.records.filter(r => r.timestamp > sinceTimestamp);
  
  console.log(`✅ Pulled ${newRecords.length} records for sync: ${sync_id} (since: ${sinceTimestamp})`);
  res.json({ 
    success: true,
    records: newRecords
  });
});

// Health check
app.get('/api/sync/health.php', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Mock sync server is running',
    timestamp: Date.now()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Mock Sync Server running on http://localhost:${PORT}
📁 Storage directory: ${STORAGE_DIR}

Available endpoints:
- POST /api/sync/create_timestamp.php
- POST /api/sync/join_timestamp.php  
- POST /api/sync/push_timestamp.php
- GET  /api/sync/pull_timestamp.php
- GET  /api/sync/health.php

Press Ctrl+C to stop
  `);
});