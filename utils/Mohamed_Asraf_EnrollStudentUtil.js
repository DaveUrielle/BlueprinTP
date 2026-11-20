const fs = require('fs').promises;
const path = require('path');

const STUDENTS_FILE = path.join(__dirname, 'records.json');
const COURSES_FILE = path.join(__dirname, 'courses.json');

const STUDENT_ID_REGEX = /^\d{7}[A-Z]$/;
const COURSE_CODE_REGEX = /^[A-Z0-9-]{2,10}$/;

async function readJson(file) {
  const raw = await fs.readFile(file, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
}

async function enrollStudent(req, res) {
  try {
    const body = req.body || {};
    const studentId = String(body.studentId || '').trim().toUpperCase();
    const courseCode = String(body.courseCode || '').trim().toUpperCase();

    if (!studentId || !courseCode) {
      return res.status(400).json({ message: 'Student ID and course code are required.' });
    }
    if (!STUDENT_ID_REGEX.test(studentId)) {
      return res.status(400).json({
        message: 'Student ID must be 7 digits followed by a capital letter (e.g. 1234567A).',
      });
    }
    if (!COURSE_CODE_REGEX.test(courseCode)) {
      return res.status(400).json({ message: 'Course code format is invalid.' });
    }

    const students = await readJson(STUDENTS_FILE);
    const courses = await readJson(COURSES_FILE);

    const student = students.find((s) => String(s.id).toUpperCase() === studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const course = courses.find((c) => String(c.code).toUpperCase() === courseCode);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    student.courses = student.courses || [];

    if (student.courses.includes(courseCode)) {
      return res.status(409).json({ message: 'Student is already enrolled in this course.' });
    }

    if (course.capacity !== undefined && course.capacity !== null) {
      const enrolledCount = students.filter(
        (s) => (s.courses || []).includes(courseCode)
      ).length;
      if (enrolledCount >= Number(course.capacity)) {
        return res.status(409).json({ message: 'Course is full.' });
      }
    }

    student.courses.push(courseCode);
    await fs.writeFile(STUDENTS_FILE, JSON.stringify(students, null, 2));

    return res.status(200).json({
      message: 'Student enrolled successfully.',
      student: student,
      course: course,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error while enrolling student.' });
  }
}

module.exports = { enrollStudent };