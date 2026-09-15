(function () {
  'use strict';

  var storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('onceu_user'));
  } catch (err) {
    storedUser = null;
  }

  if (!storedUser) {
    window.location.href = 'index.html';
    return;
  }

  var EMAIL_PATTERN = /^[a-z]+\d{2,4}[a-z]{2,6}\d{2}@igdtuw\.ac\.in$/i;
  var PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  function persist() {
    window.OnceUCommon.saveCurrentUser(storedUser);
  }

  // Ensure preference objects always exist so first-time users don't break.
  storedUser.notifPrefs = storedUser.notifPrefs || { mentor: true, resource: true, community: true };
  storedUser.privacyPrefs = storedUser.privacyPrefs || { visibility: true, college: true, invitations: true };
  if (storedUser.googleConnected == null) storedUser.googleConnected = true;
  if (storedUser.coins == null) storedUser.coins = 500;
  storedUser.bio = storedUser.bio || '';
  storedUser.linkedin = storedUser.linkedin || '';
  storedUser.handle = storedUser.handle || '';
  storedUser.skills = storedUser.skills || [];
  storedUser.projects = storedUser.projects || '';
  storedUser.rating = storedUser.rating != null ? storedUser.rating : null;
  storedUser.ratingCount = storedUser.ratingCount || 0;
  storedUser.profileBonusAwarded = !!storedUser.profileBonusAwarded;
  storedUser.coinTransactions = storedUser.coinTransactions || [];

  window.OnceUCommon.initTopbar(storedUser);
  var fullDisplayName = window.OnceUCommon.getFullDisplayName(storedUser);

  // ---- Profile card ----
  window.OnceUCommon.applyAvatar(document.getElementById('settingsAvatar'), fullDisplayName, storedUser.photoDataUrl);
  document.getElementById('settingsName').value = fullDisplayName;
  document.getElementById('settingsYearDisplay').value = storedUser.yearOfStudy
    ? window.OnceUCommon.yearLabel(storedUser.yearOfStudy)
    : 'Not detected';
  document.getElementById('settingsBranch').value = storedUser.branch || 'ECE';
  document.getElementById('settingsEmail').textContent = storedUser.email || 'you@igdtuw.ac.in';

  document.getElementById('settingsBio').value = storedUser.bio;
  document.getElementById('settingsLinkedin').value = storedUser.linkedin;
  document.getElementById('settingsHandle').value = storedUser.handle;
  document.getElementById('settingsSkills').value = storedUser.skills.join(', ');
  document.getElementById('settingsProjects').value = storedUser.projects;

  function renderSkillChips() {
    var row = document.getElementById('skillChipRow');
    row.innerHTML = storedUser.skills
      .map(function (s) { return '<span class="mentor-card__tag">' + s + '</span>'; })
      .join('');
  }
  renderSkillChips();

  function renderCoinsAndRating() {
    document.getElementById('settingsCoins').textContent = storedUser.coins;
    var ratingEl = document.getElementById('settingsRating');
    var ratingLabelEl = document.getElementById('settingsRatingLabel');
    if (storedUser.rating != null && storedUser.ratingCount > 0) {
      ratingEl.textContent = storedUser.rating.toFixed(1) + ' \u2605';
      ratingLabelEl.textContent = storedUser.ratingCount + (storedUser.ratingCount === 1 ? ' review' : ' reviews');
    } else {
      ratingEl.textContent = '\u2014';
      ratingLabelEl.textContent = 'No ratings yet';
    }

    var txnList = document.getElementById('txnList');
    if (!storedUser.coinTransactions || storedUser.coinTransactions.length === 0) {
      txnList.innerHTML = '<p class="txn-empty">No activity yet.</p>';
      return;
    }
    txnList.innerHTML = storedUser.coinTransactions
      .slice()
      .reverse()
      .slice(0, 6)
      .map(function (t) {
        var sign = t.amount >= 0 ? '+' : '';
        var cls = t.amount >= 0 ? 'txn-item__amount' : 'txn-item__amount txn-item__amount--negative';
        return '<div class="txn-item"><span class="txn-item__note">' + t.note + '</span><span class="' + cls + '">' + sign + t.amount + '</span></div>';
      })
      .join('');
  }
  renderCoinsAndRating();

  var removePhotoBtn = document.getElementById('removePhotoBtn');
  removePhotoBtn.hidden = !storedUser.photoDataUrl;

  // ---- Photo upload (real) ----
  var photoInput = document.getElementById('photoInput');
  document.getElementById('changePhotoBtn').addEventListener('click', function () {
    photoInput.click();
  });

  photoInput.addEventListener('change', function () {
    var file = photoInput.files && photoInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Please choose an image under 3MB.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      storedUser.photoDataUrl = reader.result;
      persist();
      window.OnceUCommon.applyAvatar(document.getElementById('settingsAvatar'), fullDisplayName, storedUser.photoDataUrl);
      window.OnceUCommon.applyAvatar(document.getElementById('userAvatar'), fullDisplayName, storedUser.photoDataUrl);
      removePhotoBtn.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  removePhotoBtn.addEventListener('click', function () {
    storedUser.photoDataUrl = null;
    persist();
    window.OnceUCommon.applyAvatar(document.getElementById('settingsAvatar'), fullDisplayName, null);
    window.OnceUCommon.applyAvatar(document.getElementById('userAvatar'), fullDisplayName, null);
    removePhotoBtn.hidden = true;
    photoInput.value = '';
  });

  // ---- Notification / privacy toggles (persist immediately on change) ----
  var toggleMap = {
    notifMentor: ['notifPrefs', 'mentor'],
    notifResource: ['notifPrefs', 'resource'],
    notifCommunity: ['notifPrefs', 'community'],
    privacyVisibility: ['privacyPrefs', 'visibility'],
    privacyCollege: ['privacyPrefs', 'college'],
    privacyInvitations: ['privacyPrefs', 'invitations']
  };

  Object.keys(toggleMap).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var group = toggleMap[id][0];
    var key = toggleMap[id][1];

    el.checked = !!storedUser[group][key];

    el.addEventListener('change', function () {
      storedUser[group][key] = el.checked;
      persist();
    });
  });

  // ---- Modal helpers ----
  function openModal(overlay, focusEl) {
    overlay.hidden = false;
    if (focusEl) focusEl.focus();
  }
  function closeModal(overlay) {
    overlay.hidden = true;
  }

  // ---- Change email ----
  var emailModalOverlay = document.getElementById('emailModalOverlay');
  var newEmailInput = document.getElementById('newEmailInput');
  var emailModalError = document.getElementById('emailModalError');

  document.getElementById('changeEmailBtn').addEventListener('click', function () {
    newEmailInput.value = '';
    emailModalError.classList.remove('is-visible');
    openModal(emailModalOverlay, newEmailInput);
  });
  document.getElementById('emailModalCancel').addEventListener('click', function () { closeModal(emailModalOverlay); });
  emailModalOverlay.addEventListener('click', function (e) { if (e.target === emailModalOverlay) closeModal(emailModalOverlay); });

  document.getElementById('emailModalSave').addEventListener('click', function () {
    var value = newEmailInput.value.trim();
    if (!EMAIL_PATTERN.test(value)) {
      emailModalError.classList.add('is-visible');
      return;
    }
    storedUser.email = value;
    persist();
    document.getElementById('settingsEmail').textContent = value;
    closeModal(emailModalOverlay);
    showToast('Email updated successfully!');
  });

  // ---- Change password ----
  var passwordModalOverlay = document.getElementById('passwordModalOverlay');
  var newPasswordInput = document.getElementById('newPasswordInput');
  var passwordModalError = document.getElementById('passwordModalError');

  document.getElementById('changePasswordBtn').addEventListener('click', function () {
    newPasswordInput.value = '';
    passwordModalError.classList.remove('is-visible');
    openModal(passwordModalOverlay, newPasswordInput);
  });
  document.getElementById('passwordModalCancel').addEventListener('click', function () { closeModal(passwordModalOverlay); });
  passwordModalOverlay.addEventListener('click', function (e) { if (e.target === passwordModalOverlay) closeModal(passwordModalOverlay); });

  document.getElementById('passwordModalSave').addEventListener('click', function () {
    var value = newPasswordInput.value;
    if (!PASSWORD_PATTERN.test(value)) {
      passwordModalError.classList.add('is-visible');
      return;
    }
    // Note: this build never stores the password anywhere (login doesn't check
    // it against anything either) — this just confirms the strength requirement.
    closeModal(passwordModalOverlay);
    showToast('Password updated successfully!');
  });

  // ---- Google connect / disconnect (visual demo — no real OAuth yet) ----
  var disconnectBtn = document.getElementById('disconnectGoogleBtn');
  var googleStatus = document.getElementById('googleStatus');

  function renderGoogleStatus() {
    if (storedUser.googleConnected) {
      googleStatus.innerHTML = 'Google <em>(Connected)</em>';
      disconnectBtn.textContent = 'Disconnect';
      disconnectBtn.classList.add('pill-btn--danger');
    } else {
      googleStatus.innerHTML = 'Google <em style="color:var(--ink-soft)">(Not connected)</em>';
      disconnectBtn.textContent = 'Connect';
      disconnectBtn.classList.remove('pill-btn--danger');
    }
  }
  renderGoogleStatus();

  disconnectBtn.addEventListener('click', function () {
    storedUser.googleConnected = !storedUser.googleConnected;
    persist();
    renderGoogleStatus();
  });

  // ---- Save changes (name / year / branch) ----
  var saveBtn = document.getElementById('saveBtn');
  var saveToast = document.getElementById('saveToast');
  var toastTimer = null;

  function showToast(message) {
    saveToast.textContent = message;
    saveToast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { saveToast.hidden = true; }, 2500);
  }

  saveBtn.addEventListener('click', function () {
    var newName = document.getElementById('settingsName').value.trim() || 'Student';
    var newBranch = document.getElementById('settingsBranch').value;
    var newBio = document.getElementById('settingsBio').value.trim();
    var newLinkedin = document.getElementById('settingsLinkedin').value.trim();
    var newHandle = document.getElementById('settingsHandle').value.trim();
    var newSkills = document.getElementById('settingsSkills').value
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    var newProjects = document.getElementById('settingsProjects').value.trim();

    storedUser.fullName = newName;
    storedUser.branch = newBranch;
    storedUser.bio = newBio;
    storedUser.linkedin = newLinkedin;
    storedUser.handle = newHandle;
    storedUser.skills = newSkills;
    storedUser.projects = newProjects;

    // One-time bonus once the mentor profile is genuinely filled in.
    var isComplete = !!(newBio && newBranch && newSkills.length > 0 && storedUser.photoDataUrl);
    var bonusMessage = '';
    if (isComplete && !storedUser.profileBonusAwarded) {
      storedUser.coins += 50;
      storedUser.profileBonusAwarded = true;
      storedUser.coinTransactions.push({ type: 'profile', amount: 50, note: 'Completed mentor profile', at: Date.now() });
      bonusMessage = ' +50 coins for completing your profile!';
    }

    persist();

    fullDisplayName = window.OnceUCommon.getFullDisplayName(storedUser);
    window.OnceUCommon.updateTopbarInfo(storedUser);
    window.OnceUCommon.applyAvatar(document.getElementById('settingsAvatar'), fullDisplayName, storedUser.photoDataUrl);
    renderSkillChips();
    renderCoinsAndRating();

    showToast('Profile updated successfully!' + bonusMessage);
  });
})();