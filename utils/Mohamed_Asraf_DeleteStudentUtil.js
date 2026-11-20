const fs = require('fs').promises;
const path = require('path');

const RECORDS_FILE = path.join(__dirname, 'records.json');
const COURSES_FILE = path.join(__dirname, 'courses.json');
const ID_REGEX = /^[A-Za-z0-9-]{1,32}$/;

async function readJson(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function entryId(entry) {
  return String(entry && entry.id !== undefined ? entry.id : entry);
}

async function deleteStudent(req, res) {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }
    if (!ID_REGEX.test(id)) {
      return res.status(400).json({ message: 'Student ID format is invalid.' });
    }

    const students = await readJson(RECORDS_FILE);
    const index = students.findIndex((s) => String(s.id) === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const removed = students.splice(index, 1)[0];
    await fs.writeFile(RECORDS_FILE, JSON.stringify(students, null, 2));

    const courses = await readJson(COURSES_FILE);
    let coursesChanged = false;
    courses.forEach((c) => {
      if (Array.isArray(c.enrolledStudents)) {
        const before = c.enrolledStudents.length;
        c.enrolledStudents = c.enrolledStudents.filter((e) => entryId(e) !== id);
        if (c.enrolledStudents.length !== before) coursesChanged = true;
      }
    });
    if (coursesChanged) {
      await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));
    }

    return res.status(200).json({
      message: 'Student deleted successfully.',
      student: removed,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error while deleting student.' });
  }
}

module.exports = { deleteStudent };