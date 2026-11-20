(function () {
  var tableBody = document.getElementById('studentTableBody');
  var refreshBtn = document.getElementById('refreshBtn');
  var dashboardMsg = document.getElementById('dashboardMsg');

  var msg = document.createElement('div');
  msg.id = 'deleteStudentMsg';
  msg.className = 'msg';
  msg.setAttribute('role', 'status');
  msg.setAttribute('aria-live', 'polite');
  dashboardMsg.insertAdjacentElement('afterend', msg);

  function showMessage(text, isError) {
    msg.textContent = text;
    msg.className = isError ? 'msg error' : 'msg success';
  }

  function addDeleteButtons() {
    Array.prototype.forEach.call(tableBody.querySelectorAll('tr'), function (tr) {
      if (tr.classList.contains('empty') || tr.classList.contains('editing')) return;
      if (!tr.dataset.studentId) return;

      var wrap = tr.querySelector('.row-actions');
      if (!wrap || wrap.querySelector('.btn-delete')) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn danger small btn-delete';
      btn.textContent = 'Delete';
      btn.dataset.id = tr.dataset.studentId;
      btn.setAttribute('aria-label', 'Delete ' + tr.children[1].textContent);
      wrap.appendChild(btn);
    });
  }

  document.addEventListener('students-rendered', addDeleteButtons);
  addDeleteButtons();

  tableBody.addEventListener('click', async function (e) {
    var btn = e.target.closest('.btn-delete');
    if (!btn) return;

    var id = btn.dataset.id;
    if (!id) {
      showMessage('Student ID is missing.', true);
      return;
    }

    var name = btn.closest('tr').children[1].textContent;
    if (!confirm('Delete ' + name + ' (ID ' + id + ')?')) return;

    btn.disabled = true;

    try {
      var res = await fetch('/delete-record/' + encodeURIComponent(id), {
        method: 'DELETE',
      });
      var data = await res.json();

      if (res.ok) {
        showMessage(data.message + ' (' + data.student.name + ')', false);
      } else {
        showMessage(data.message, true);
      }
      refreshBtn.click();
    } catch (err) {
      showMessage('Could not reach the server.', true);
      btn.disabled = false;
    }
  });
})();