const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// CSV file paths
const WEIGHT_CSV = path.join(DATA_DIR, 'weight.csv');
const CALORIES_CSV = path.join(DATA_DIR, 'calories.csv');
const WORKOUTS_CSV = path.join(DATA_DIR, 'workouts.csv');

// Initialize CSV files with headers if they don't exist
function initializeCsvFile(filePath, headers) {
  if (!fs.existsSync(filePath)) {
    const headerLine = headers.join(',') + '\n';
    fs.writeFileSync(filePath, headerLine);
  }
}

initializeCsvFile(WEIGHT_CSV, ['date', 'weight']);
initializeCsvFile(CALORIES_CSV, ['date', 'caloriesEaten', 'caloriesBurnt']);
initializeCsvFile(WORKOUTS_CSV, ['date', 'cardio', 'strength', 'restDay', 'cardioMinutes', 'strengthMinutes', 'notes']);

// Helper function to read CSV
function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      resolve([]);
      return;
    }
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Helper function to write CSV
async function writeCsv(filePath, headers, data) {
  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers.map(h => ({ id: h, title: h }))
  });
  await csvWriter.writeRecords(data);
}

// ============ WEIGHT ENDPOINTS ============

// Get all weight entries
app.get('/api/weight', async (req, res) => {
  try {
    const data = await readCsv(WEIGHT_CSV);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add weight entry
app.post('/api/weight', async (req, res) => {
  try {
    const { date, weight } = req.body;
    const data = await readCsv(WEIGHT_CSV);
    
    // Check if entry for date exists, update if so
    const existingIndex = data.findIndex(d => d.date === date);
    if (existingIndex >= 0) {
      data[existingIndex] = { date, weight };
    } else {
      data.push({ date, weight });
    }
    
    // Sort by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    await writeCsv(WEIGHT_CSV, ['date', 'weight'], data);
    res.json({ success: true, data: { date, weight } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete weight entry
app.delete('/api/weight/:date', async (req, res) => {
  try {
    const { date } = req.params;
    let data = await readCsv(WEIGHT_CSV);
    data = data.filter(d => d.date !== date);
    await writeCsv(WEIGHT_CSV, ['date', 'weight'], data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CALORIES ENDPOINTS ============

// Get all calorie entries
app.get('/api/calories', async (req, res) => {
  try {
    const data = await readCsv(CALORIES_CSV);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add/Update calorie entry (supports partial updates)
app.post('/api/calories', async (req, res) => {
  try {
    const { date, caloriesEaten, caloriesBurnt } = req.body;
    const data = await readCsv(CALORIES_CSV);
    
    const existingIndex = data.findIndex(d => d.date === date);
    if (existingIndex >= 0) {
      // Merge with existing data - only update fields that are provided
      const existing = data[existingIndex];
      data[existingIndex] = { 
        date, 
        caloriesEaten: caloriesEaten !== undefined && caloriesEaten !== null && caloriesEaten !== '' 
          ? caloriesEaten 
          : existing.caloriesEaten || 0,
        caloriesBurnt: caloriesBurnt !== undefined && caloriesBurnt !== null && caloriesBurnt !== '' 
          ? caloriesBurnt 
          : existing.caloriesBurnt || 0
      };
    } else {
      data.push({ 
        date, 
        caloriesEaten: caloriesEaten || 0, 
        caloriesBurnt: caloriesBurnt || 0 
      });
    }
    
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    await writeCsv(CALORIES_CSV, ['date', 'caloriesEaten', 'caloriesBurnt'], data);
    res.json({ success: true, data: data.find(d => d.date === date) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete calorie entry
app.delete('/api/calories/:date', async (req, res) => {
  try {
    const { date } = req.params;
    let data = await readCsv(CALORIES_CSV);
    data = data.filter(d => d.date !== date);
    await writeCsv(CALORIES_CSV, ['date', 'caloriesEaten', 'caloriesBurnt'], data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ WORKOUTS ENDPOINTS ============

// Get all workout entries
app.get('/api/workouts', async (req, res) => {
  try {
    const data = await readCsv(WORKOUTS_CSV);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add/Update workout entry (supports partial updates)
app.post('/api/workouts', async (req, res) => {
  try {
    const { date, cardio, strength, restDay, cardioMinutes, strengthMinutes, notes } = req.body;
    const data = await readCsv(WORKOUTS_CSV);
    
    const existingIndex = data.findIndex(d => d.date === date);
    
    if (existingIndex >= 0) {
      // Merge with existing data
      const existing = data[existingIndex];
      data[existingIndex] = { 
        date, 
        cardio: cardio !== undefined ? (cardio ? 'true' : 'false') : existing.cardio,
        strength: strength !== undefined ? (strength ? 'true' : 'false') : existing.strength,
        restDay: restDay !== undefined ? (restDay ? 'true' : 'false') : existing.restDay || 'false',
        cardioMinutes: cardioMinutes !== undefined && cardioMinutes !== null ? cardioMinutes : existing.cardioMinutes || 0,
        strengthMinutes: strengthMinutes !== undefined && strengthMinutes !== null ? strengthMinutes : existing.strengthMinutes || 0,
        notes: notes !== undefined ? notes : existing.notes || ''
      };
    } else {
      data.push({ 
        date, 
        cardio: cardio ? 'true' : 'false', 
        strength: strength ? 'true' : 'false',
        restDay: restDay ? 'true' : 'false',
        cardioMinutes: cardioMinutes || 0,
        strengthMinutes: strengthMinutes || 0,
        notes: notes || ''
      });
    }
    
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    await writeCsv(WORKOUTS_CSV, ['date', 'cardio', 'strength', 'restDay', 'cardioMinutes', 'strengthMinutes', 'notes'], data);
    res.json({ success: true, data: data.find(d => d.date === date) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete workout entry
app.delete('/api/workouts/:date', async (req, res) => {
  try {
    const { date } = req.params;
    let data = await readCsv(WORKOUTS_CSV);
    data = data.filter(d => d.date !== date);
    await writeCsv(WORKOUTS_CSV, ['date', 'cardio', 'strength', 'restDay', 'cardioMinutes', 'strengthMinutes', 'notes'], data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STATS ENDPOINT ============

app.get('/api/stats', async (req, res) => {
  try {
    const weights = await readCsv(WEIGHT_CSV);
    const calories = await readCsv(CALORIES_CSV);
    const workouts = await readCsv(WORKOUTS_CSV);
    
    const stats = {
      totalEntries: weights.length,
      startWeight: weights.length > 0 ? parseFloat(weights[0].weight) : null,
      currentWeight: weights.length > 0 ? parseFloat(weights[weights.length - 1].weight) : null,
      weightLost: weights.length > 1 ? parseFloat(weights[0].weight) - parseFloat(weights[weights.length - 1].weight) : 0,
      avgCaloriesEaten: calories.length > 0 ? Math.round(calories.reduce((sum, c) => sum + parseFloat(c.caloriesEaten || 0), 0) / calories.length) : 0,
      avgCaloriesBurnt: calories.length > 0 ? Math.round(calories.reduce((sum, c) => sum + parseFloat(c.caloriesBurnt || 0), 0) / calories.length) : 0,
      totalWorkouts: workouts.filter(w => w.cardio === 'true' || w.strength === 'true').length,
      cardioSessions: workouts.filter(w => w.cardio === 'true').length,
      strengthSessions: workouts.filter(w => w.strength === 'true').length
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🏋️ Weight Tracker API running on http://localhost:${PORT}`);
});

