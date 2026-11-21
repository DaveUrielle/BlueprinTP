
const { Record } = require('../models/recordrashid');
const fs = require('fs').promises;
const path = require('path');

const RECORDS_FILE = path.join(__dirname, 'records.json');
const TEMPLATE_FILE = path.join(__dirname, 'records.template.json');

async function addRecord(req, res) {
    try {
        const { name, email, year } = req.body || {};

        const studentName = typeof name === 'string' ? name.trim() : '';
        const studentEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const studentYear = year === '' || year == null ? NaN : Number(year);

        // Check for empty or invalid fields
        if (!studentName || !studentEmail ||
            !Number.isInteger(studentYear) ||
            studentYear < 1 || studentYear > 3) {
            return res.status(400).json({
                message: 'Please enter a valid name, email and year (1-3).'
            });
        }

        // Check email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
            return res.status(400).json({
                message: 'Please enter a valid email address.'
            });
        }

        let records = [];

        try {
            // Read existing student records
            const data = await fs.readFile(RECORDS_FILE, 'utf8');
            records = JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                // Load template if records.json does not exist
                const templateData = await fs.readFile(TEMPLATE_FILE, 'utf8');
                records = JSON.parse(templateData);
            } else {
                throw err;
            }
        }

        if (!Array.isArray(records)) {
            throw new Error('Student data must be a JSON array.');
        }

        // Check whether email already exists
        const emailExists = records.some(record =>
            typeof record.email === 'string' &&
            record.email.trim().toLowerCase() === studentEmail
        );

        if (emailExists) {
            return res.status(409).json({
                message: 'A student with this email already exists.'
            });
        }


        
let newRecord;

// Generate a new ID if it already exists
do {
    newRecord = new Record(
        studentName,
        studentEmail,
        studentYear,
        null
    );
} while (records.some(student => student.id === newRecord.id));


        // Add new student and save to JSON
        records.push(newRecord);

        await fs.writeFile(
            RECORDS_FILE,
            JSON.stringify(records, null, 2),
            'utf8'
        );

        return res.status(201).json({
            message: 'Student created successfully.',
            student: newRecord
        });

    } catch (error) {
        console.error('Error adding student:', error);

        return res.status(500).json({
            message: 'Unable to save student record.'
        });
    }
}

module.exports = { addRecord };
