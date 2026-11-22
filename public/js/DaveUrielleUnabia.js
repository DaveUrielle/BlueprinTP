(function () {
  const COLS = 6; // ID, Name, Email, Course, Year, Actions
  const YEAR_OPTIONS = [1, 2, 3]; // keep in sync with YEAR_MIN / YEAR_MAX in DaveUrielleUnabiaUtil.js
  const TEXT_MAX = 100;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let currentStudents = []; // last data loaded from the server
  let editingId = null;     // id of the row currently being edited (one at a time)

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

  function showMessage(text, isError) {
    const msg = document.getElementById('dashboardMsg');
    msg.textContent = text;
    msg.className = isError ? 'msg error' : 'msg success';
  }

  function clearMessage() {
    const msg = document.getElementById('dashboardMsg');
    msg.textContent = '';
    msg.className = 'msg';
  }

  // ---------- Edit feature: styles + table header ----------
  // Injected from here so this feature doesn't need changes to the shared styles.css / index.html.
  function injectEditStyles() {
    const style = document.createElement('style');
    style.textContent = [
      '.btn.small { padding: 4px 10px; font-size: 0.85rem; }',
      '.row-actions { display: flex; gap: 6px; white-space: nowrap; }',
      'tr.editing td { background: #f6f8fc; vertical-align: middle; }',
      'tr.editing input, tr.editing select { padding: 6px 8px; min-width: 90px; }',
      'tr.editing input[type="email"] { min-width: 200px; }',
      'tr.editing select { font: inherit; border: 1px solid #b9c3ce; border-radius: 6px; background: #fff; color: inherit; }',
      'tr.editing select.invalid { border-color: #c0352b; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureActionsHeader() {
    const headRow = document.getElementById('studentTableBody').closest('table').querySelector('thead tr');
    const hasActions = Array.from(headRow.children).some((th) => th.textContent.trim() === 'Actions');
    if (!hasActions) {
      const th = document.createElement('th');
      th.textContent = 'Actions';
      headRow.appendChild(th);
    }
  }

  // ---------- Rendering ----------
  function buildViewRow(s) {
    const id = get(s, 'id');
    const tr = document.createElement('tr');
    ['id', 'name', 'email', 'course', 'year'].forEach((k) => tr.appendChild(cell(get(s, k))));

    tr.dataset.studentId = id; // lets other features (e.g. Delete) find which student a row belongs to

    const actions = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.className = 'row-actions'; // other features can append their own buttons in here
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn secondary small';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${get(s, 'name') || id}`);
    editBtn.addEventListener('click', () => startEdit(id));
    wrap.appendChild(editBtn);
    actions.appendChild(wrap);
    tr.appendChild(actions);
    return tr;
  }

  function inputCell(input) {
    const td = document.createElement('td');
    td.appendChild(input);
    return td;
  }

  function buildEditRow(s) {
    const id = get(s, 'id');
    const tr = document.createElement('tr');
    tr.className = 'editing';
    tr.dataset.studentId = id;

    const name = document.createElement('input');
    name.type = 'text';
    name.maxLength = TEXT_MAX;
    name.value = get(s, 'name') ?? '';
    name.setAttribute('aria-label', 'Name');

    const email = document.createElement('input');
    email.type = 'email';
    email.value = get(s, 'email') ?? '';
    email.setAttribute('aria-label', 'Email');

    const year = document.createElement('select');
    year.setAttribute('aria-label', 'Year');
    YEAR_OPTIONS.forEach((y) => {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = `Year ${y}`;
      year.appendChild(opt);
    });
    year.value = String(get(s, 'year'));

    const fields = { name, email, year };
    name.dataset.editField = 'name';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn small';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn secondary small';
    cancelBtn.textContent = 'Cancel';

    saveBtn.addEventListener('click', () => saveEdit(id, fields, [saveBtn, cancelBtn]));
    cancelBtn.addEventListener('click', cancelEdit);

    // Enter saves, Escape cancels
    tr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit(id, fields, [saveBtn, cancelBtn]);
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    });

    tr.appendChild(cell(id)); // ID is the record's key, so it is shown but not editable
    tr.appendChild(inputCell(name));
    tr.appendChild(inputCell(email));
    tr.appendChild(cell(get(s, 'course'))); // course is read-only here: it only changes through enrolment
    tr.appendChild(inputCell(year));

    const actions = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.className = 'row-actions';
    wrap.appendChild(saveBtn);
    wrap.appendChild(cancelBtn);
    actions.appendChild(wrap);
    tr.appendChild(actions);
    return tr;
  }

  function renderStudents(students) {
    const body = document.getElementById('studentTableBody');
    body.replaceChildren();
    if (students.length === 0) {
      body.appendChild(emptyRow(COLS, 'No students yet.'));
    } else {
      students.forEach((s) => {
        body.appendChild(editingId !== null && get(s, 'id') === editingId ? buildEditRow(s) : buildViewRow(s));
      });
    }
    // Hook for other features: fires every time the student table is (re)drawn.
    document.dispatchEvent(new CustomEvent('students-rendered', { detail: { students } }));
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

  // ---------- Edit flow ----------
  function startEdit(id) {
    editingId = id;
    clearMessage();
    renderStudents(currentStudents); // re-render so any previously edited row goes back to normal
    const first = document.querySelector('#studentTableBody [data-edit-field="name"]');
    if (first) first.focus();
  }

  function cancelEdit() {
    editingId = null;
    clearMessage();
    renderStudents(currentStudents);
  }

  // Mirrors the server rules so obvious mistakes are caught before a request is made.
  function validateFields(values) {
    const problems = {};
    if (!values.name) problems.name = 'Name is required.';
    else if (values.name.length > TEXT_MAX) problems.name = `Name must be ${TEXT_MAX} characters or fewer.`;

    if (!values.email) problems.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(values.email)) problems.email = 'Email format is invalid.';

    if (!YEAR_OPTIONS.includes(values.year)) problems.year = 'Please choose a valid year.';
    return problems;
  }

  async function saveEdit(id, fields, buttons) {
    Object.values(fields).forEach((el) => el.classList.remove('invalid'));
    clearMessage();

    const values = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      year: Number(fields.year.value),
    };

    const problems = validateFields(values);
    const badKeys = Object.keys(problems);
    if (badKeys.length > 0) {
      badKeys.forEach((k) => fields[k].classList.add('invalid'));
      fields[badKeys[0]].focus();
      showMessage(badKeys.map((k) => problems[k]).join(' '), true);
      return;
    }

    buttons.forEach((b) => (b.disabled = true));
    try {
      const res = await fetch(`/edit-record/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.ok) {
        const idx = currentStudents.findIndex((s) => get(s, 'id') === id);
        if (idx !== -1) currentStudents[idx] = data.student;
        editingId = null;
        renderStudents(currentStudents);
        showMessage(data.message, false);
      } else {
        buttons.forEach((b) => (b.disabled = false));
        showMessage(data.message || 'Could not update the record.', true);
      }
    } catch (err) {
      buttons.forEach((b) => (b.disabled = false));
      showMessage('Could not reach the server.', true);
    }
  }

  // ---------- Dashboard load ----------
  async function loadDashboard() {
    const msg = document.getElementById('dashboardMsg');
    try {
      const res = await fetch('/view-dashboard');
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const { students, courses } = await res.json();

      currentStudents = students;
      editingId = null; // a refresh discards any edit in progress

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

  injectEditStyles();
  ensureActionsHeader();
  document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
  loadDashboard();
})();