
const { Course } = require('../models/courserashid');
const fs = require('fs').promises;
const path = require('path');
const COURSE_CODE_REGEX = /^[A-Z0-9-]{2,10}$/;

const COURSES_FILE = path.join(__dirname, 'courses.json');
const TEMPLATE_FILE = path.join(__dirname, 'courses.template.json');

async function addCourse(req, res) {
    try {
        const { code, name, maxCapacity, description } = req.body || {};

        const courseCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
        const courseName = typeof name === 'string' ? name.trim() : '';
        const courseDescription = typeof description === 'string' ? description.trim() : '';
        const capacity = maxCapacity === '' || maxCapacity == null
            ? NaN : Number(maxCapacity);

        // Check required fields
        if (!courseCode || !courseName || !courseDescription) {
            return res.status(400).json({
                message: 'Please fill in all required fields.'
            });
        }

        if (!COURSE_CODE_REGEX.test(courseCode)) {
    return res.status(400).json({
        message: 'Course code must be 2-10 characters (uppercase letters, numbers or hyphens).'
    });
}

        // Check maximum capacity
        if (!Number.isInteger(capacity) || capacity <= 0) {
            return res.status(400).json({
                message: 'Maximum capacity must be a positive whole number.'
            });
        }

        let courses = [];

        try {
            const data = await fs.readFile(COURSES_FILE, 'utf8');
            courses = JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                const templateData = await fs.readFile(TEMPLATE_FILE, 'utf8');
                courses = JSON.parse(templateData);
            } else {
                throw err;
            }
        }

        if (!Array.isArray(courses)) {
            throw new Error('Course data must be a JSON array.');
        }

        // Check duplicate COURSE CODE, not course name
        const courseExists = courses.some(course =>
            typeof course.code === 'string' &&
            course.code.trim().toUpperCase() === courseCode
        );

        if (courseExists) {
            return res.status(409).json({
                message: 'Course code already exists.'
            });
        }

        // Create new course
        const newCourse = new Course(
            courseCode,
            courseName,
            capacity,
            courseDescription
        );

        // Save course into JSON
        courses.push(newCourse);

        await fs.writeFile(
            COURSES_FILE,
            JSON.stringify(courses, null, 2),
            'utf8'
        );

        return res.status(201).json({
            message: 'Course created successfully.',
            course: newCourse
        });

    } catch (error) {
        console.error('Error adding course:', error);

        return res.status(500).json({
            message: 'Unable to save course.'
        });
    }
}

module.exports = { addCourse };
