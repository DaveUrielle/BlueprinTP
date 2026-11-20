
document.getElementById('createStudentForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const year = Number(document.getElementById('year').value);
    const message = document.getElementById('message');

    // Frontend validation
    if (!name || !email || !Number.isInteger(year) || year < 1 || year > 3) {
        message.textContent = 'Please enter valid student information.';
        return;
    }

    const student = {
        name: name,
        email: email,
        year: year
    };

    try {
        const response = await fetch('/add-record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(student)
        });

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            document.getElementById('createStudentForm').reset();
        }

    } catch (error) {
        console.error(error);
        message.textContent = 'Error creating student record.';
    }
});
