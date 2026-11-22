const fs = require('fs').promises;
const path = require('path');

const RECORDS_FILE = path.join(__dirname, 'records.json'); 
const COURSES_FILE = path.join(__dirname, 'courses.json');

// ---- Edit-record validation rules ----
const STUDENT_ID_REGEX = /^\d{7}[A-Z]$/;          
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YEAR_MIN = 1;                                
const YEAR_MAX = 3;
const TEXT_MAX = 100;
const EDITABLE_FIELDS = ['name', 'email', 'year']; // course is NOT editable: it only changes via enrolment

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

function validateEdits(body) {
  const clean = {};
  const errors = [];

  if (body.name !== undefined) {
    const v = typeof body.name === 'string' ? body.name.trim() : '';
    if (!v) errors.push('Name is required.');
    else if (v.length > TEXT_MAX) errors.push(`Name must be ${TEXT_MAX} characters or fewer.`);
    else clean.name = v;
  }

  if (body.email !== undefined) {
    const v = typeof body.email === 'string' ? body.email.trim() : '';
    if (!v) errors.push('Email is required.');
    else if (v.length > 254 || !EMAIL_REGEX.test(v)) errors.push('Email format is invalid.');
    else clean.email = v;
  }

  if (body.year !== undefined) {
    const raw = body.year;
    const n = typeof raw === 'string' ? (raw.trim() === '' ? NaN : Number(raw)) : raw;
    if (!Number.isInteger(n) || n < YEAR_MIN || n > YEAR_MAX) {
      errors.push(`Year must be a whole number from ${YEAR_MIN} to ${YEAR_MAX}.`);
    } else {
      clean.year = n;
    }
  }

  return { clean, errors };
}

async function editRecord(req, res) {
  try {
    const id = String(req.params.id || '').trim().toUpperCase();
    const body = req.body || {};

    if (!STUDENT_ID_REGEX.test(id)) {
      return res.status(400).json({
        message: 'Student ID must be 7 digits followed by a capital letter (e.g. 1234567A).',
      });
    }

    if (body.id !== undefined && String(body.id).trim().toUpperCase() !== id) {
      return res.status(400).json({ message: 'Student ID cannot be changed.' });
    }

    if (body.course !== undefined) {
      return res.status(400).json({
        message: 'Course cannot be edited. A student\'s course only changes when they are enrolled in a course.',
      });
    }

    const students = await readJSON(RECORDS_FILE);
    const student = students.find((s) => String(s.id).toUpperCase() === id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (!EDITABLE_FIELDS.some((f) => body[f] !== undefined)) {
      return res.status(400).json({
        message: `Provide at least one field to update (${EDITABLE_FIELDS.join(', ')}).`,
      });
    }

    const { clean, errors } = validateEdits(body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(' '), errors });
    }

    Object.assign(student, clean); // leaves id and course untouched (course is set only by enrolment)
    await fs.writeFile(RECORDS_FILE, JSON.stringify(students, null, 2));

    return res.status(200).json({ message: 'Student record updated successfully.', student });
  } catch (err) {
    return res.status(500).json({ message: 'Server error while updating the record.' });
  }
}

module.exports = { viewDashboard, editRecord };