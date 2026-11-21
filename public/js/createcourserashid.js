
document.getElementById('createCourseForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const code = document.getElementById('courseCode').value.trim().toUpperCase();
    const name = document.getElementById('courseName').value.trim();
    const capacityInput = document.getElementById('maxCapacity').value;
    const maxCapacity = Number(capacityInput);
    const description = document.getElementById('courseDescription').value.trim();
    const message = document.getElementById('courseMessage');
    const COURSE_CODE_REGEX = /^[A-Z0-9-]{2,10}$/;

    // Frontend validation
    if (!code || !name || !description) {
        message.textContent = 'Please fill in all required fields.';
        return;
    }

    if (!COURSE_CODE_REGEX.test(code)) {
    message.textContent = 'Course code must be 2-10 characters (uppercase letters, numbers or hyphens).';
    return;
}

    if (capacityInput === '' || !Number.isInteger(maxCapacity) || maxCapacity <= 0) {
        message.textContent = 'Maximum capacity must be a positive whole number.';
        return;
    }

    const course = {
        code: code,
        name: name,
        maxCapacity: maxCapacity,
        description: description
    };

    try {
        const response = await fetch('/add-course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(course)
        });

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            document.getElementById('createCourseForm').reset();
        }

    } catch (error) {
        console.error(error);
        message.textContent = 'Error creating course.';
    }
});
