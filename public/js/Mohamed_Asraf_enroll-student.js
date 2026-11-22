(function () {
  var STUDENT_ID_REGEX = /^\d{7}[A-Z]$/;
  var COURSE_CODE_REGEX = /^[A-Z0-9-]{2,10}$/;

  var form = document.getElementById('enrollStudentForm');
  var studentIdInput = document.getElementById('enrollStudentId');
  var courseCodeInput = document.getElementById('enrollCourseCode');
  var msg = document.getElementById('enrollStudentMsg');

  function showMessage(text, isError) {
    msg.textContent = text;
    msg.className = isError ? 'msg error' : 'msg success';
  }
(function () {
  var STUDENT_ID_REGEX = /^[A-Za-z0-9-]{1,32}$/;
  var COURSE_CODE_REGEX = /^[A-Z0-9-]{2,10}$/;

  var form = document.getElementById('enrollStudentForm');
  var studentIdInput = document.getElementById('enrollStudentId');
  var courseCodeInput = document.getElementById('enrollCourseCode');
  var msg = document.getElementById('enrollStudentMsg');

  function showMessage(text, isError) {
    msg.textContent = text;
    msg.className = isError ? 'msg error' : 'msg success';
  }

  function clearMessage() {
    msg.textContent = '';
    msg.className = 'msg';
  }

  function setInvalid(input, invalid) {
    input.classList.toggle('invalid', invalid);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearMessage();
    setInvalid(studentIdInput, false);
    setInvalid(courseCodeInput, false);

    var studentId = studentIdInput.value.trim().toUpperCase();
    var courseCode = courseCodeInput.value.trim().toUpperCase();

    if (!studentId || !courseCode) {
      setInvalid(studentIdInput, !studentId);
      setInvalid(courseCodeInput, !courseCode);
      showMessage('Please enter both the student ID and the course code.', true);
      return;
    }
    if (!STUDENT_ID_REGEX.test(studentId)) {
      setInvalid(studentIdInput, true);
      showMessage('Student ID may only contain letters, numbers and hyphens.', true);
      return;
    }
    if (!COURSE_CODE_REGEX.test(courseCode)) {
      setInvalid(courseCodeInput, true);
      showMessage('Course code must be 2 to 10 letters, numbers or hyphens.', true);
      return;
    }

    try {
      var res = await fetch('/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId, courseCode: courseCode }),
      });
      var data = await res.json();

      if (res.ok) {
        showMessage(data.message + ' (' + data.student.name + ' into ' + data.course.name + ')', false);
        form.reset();
      } else {
        showMessage(data.message, true);
      }
    } catch (err) {
      showMessage('Could not reach the server.', true);
    
  });
})();
  function clearMessage() {
    msg.textContent = '';
    msg.className = 'msg';
  }

  function setInvalid(input, invalid) {
    input.classList.toggle('invalid', invalid);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearMessage();
    setInvalid(studentIdInput, false);
    setInvalid(courseCodeInput, false);

    var studentId = studentIdInput.value.trim().toUpperCase();
    var courseCode = courseCodeInput.value.trim().toUpperCase();

    if (!studentId || !courseCode) {
      setInvalid(studentIdInput, !studentId);
      setInvalid(courseCodeInput, !courseCode);
      showMessage('Please enter both the student ID and the course code.', true);
      return;
    }
    if (!STUDENT_ID_REGEX.test(studentId)) {
      setInvalid(studentIdInput, true);
      showMessage('Student ID must be 7 digits followed by a capital letter (e.g. 1234567A).', true);
      return;
    }
    if (!COURSE_CODE_REGEX.test(courseCode)) {
      setInvalid(courseCodeInput, true);
      showMessage('Course code must be 2 to 10 letters, numbers or hyphens.', true);
      return;
    }

    try {
      var res = await fetch('/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId, courseCode: courseCode }),
      });
      var data = await res.json();

      if (res.ok) {
        showMessage(data.message + ' (' + data.student.name + ' into ' + courseCode + ')', false);
        form.reset();
      } else {
        showMessage(data.message, true);
      }
    } catch (err) {
      showMessage('Could not reach the server.', true);
    }
  });
})();