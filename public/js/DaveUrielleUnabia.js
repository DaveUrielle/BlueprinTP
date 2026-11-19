(function () {
  function get(obj, key) {
    return obj[key] ?? obj[key.charAt(0).toUpperCase() + key.slice(1)];
  }

  function cell(text) {
    const td = document.createElement('td');
    td.textContent = text ?? '';
    return td;
  }

  function emptyRow(colspan, text) {
    const tr = document.createElement('tr');
    tr.className = 'empty';
    const td = cell(text);
    td.colSpan = colspan;
    tr.appendChild(td);
    return tr;
  }

  function renderStudents(students) {
    const body = document.getElementById('studentTableBody');
    body.replaceChildren();
    if (students.length === 0) {
      body.appendChild(emptyRow(5, 'No students yet.'));
      return;
    }
    students.forEach((s) => {
      const tr = document.createElement('tr');
      ['id', 'name', 'email', 'course', 'year'].forEach((k) => tr.appendChild(cell(get(s, k))));
      body.appendChild(tr);
    });
  }

  function renderCourses(courses) {
    const body = document.getElementById('courseTableBody');
    body.replaceChildren();
    if (courses.length === 0) {
      body.appendChild(emptyRow(4, 'No courses yet.'));
      return;
    }
    courses.forEach((c) => {
      const enrolled = (c.enrolledStudents || []).length;
      const tr = document.createElement('tr');
      [c.code, c.name, `${enrolled} / ${c.maxCapacity}`, c.description].forEach((v) =>
        tr.appendChild(cell(v))
      );
      body.appendChild(tr);
    });
  }

  function renderStats(students, courses) {
    const enrolments = courses.reduce((sum, c) => sum + (c.enrolledStudents || []).length, 0);
    document.getElementById('statStudents').textContent = students.length;
    document.getElementById('statCourses').textContent = courses.length;
    document.getElementById('statEnrolments').textContent = enrolments;
  }

  async function loadDashboard() {
    const msg = document.getElementById('dashboardMsg');
    try {
      const res = await fetch('/view-dashboard');
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const { students, courses } = await res.json();

      renderStudents(students);
      renderCourses(courses);
      renderStats(students, courses);

      msg.textContent = '';
      msg.className = 'msg';
    } catch (err) {
      msg.textContent = `Could not load the dashboard. ${err.message}`;
      msg.className = 'msg error';
    }
  }

  document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
  loadDashboard();
})();