const fs = require('fs').promises;
const path = require('path');

const RECORDS_FILE = path.join(__dirname, 'records.json'); 
const COURSES_FILE = path.join(__dirname, 'courses.json');

async function readJSON(filename) {
  try {
    const data = await fs.readFile(filename, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return []; 
    throw err;
  }
}

async function viewDashboard(req, res) {
  try {
    const students = await readJSON(RECORDS_FILE);
    const courses = await readJSON(COURSES_FILE);
    res.status(200).json({ students, courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { viewDashboard };