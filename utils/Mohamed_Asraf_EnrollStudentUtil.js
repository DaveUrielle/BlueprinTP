const fs = require('fs').promises;
const path = require('path');

const STUDENTS_FILE = path.join(__dirname, 'records.json');
const COURSES_FILE = path.join(__dirname, 'courses.json');

const STUDENT_ID_REGEX = /^[A-Za-z0-9-]{1,32}$/;
const COURSE_CODE_REGEX = /^[A-Z0-9-]{2,10}$/;

async function readJson(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
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
      return res.status(400).json({ message: 'Student ID format is invalid.' });
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

    if (!Array.isArray(course.enrolledStudents)) {
      course.enrolledStudents = [];
    }

    const alreadyInThisCourse =
      course.enrolledStudents.some((id) => String(id) === String(student.id)) ||
      student.course === course.name;
    if (alreadyInThisCourse) {
      return res.status(409).json({ message: 'Student is already enrolled in this course.' });
    }

    if (student.course) {
      return res.status(409).json({
        message: 'Student is already enrolled in ' + student.course + '.',
      });
    }

    const maxCapacity = Number(course.maxCapacity);
    if (Number.isFinite(maxCapacity) && course.enrolledStudents.length >= maxCapacity) {
      return res.status(409).json({ message: 'Course is full.' });
    }

    student.course = course.name;
    course.enrolledStudents.push(student.id);

    await fs.writeFile(STUDENTS_FILE, JSON.stringify(students, null, 2));
    await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));

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