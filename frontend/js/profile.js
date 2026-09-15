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

  // Same defaults settings.js applies, so a fresh account (or one that
  // skipped Settings) doesn't blow up on missing fields here.
  storedUser.bio = storedUser.bio || '';
  storedUser.linkedin = storedUser.linkedin || '';
  storedUser.handle = storedUser.handle || '';
  storedUser.skills = storedUser.skills || [];
  storedUser.projects = storedUser.projects || '';
  storedUser.coins = storedUser.coins != null ? storedUser.coins : 500;
  storedUser.rating = storedUser.rating != null ? storedUser.rating : null;
  storedUser.ratingCount = storedUser.ratingCount || 0;
  storedUser.coinTransactions = storedUser.coinTransactions || [];
  storedUser.privacyPrefs = storedUser.privacyPrefs || { visibility: true, college: true, invitations: true };

  var yearLabel = window.OnceUCommon.yearLabel;
  var applyAvatar = window.OnceUCommon.applyAvatar;
  var fullDisplayName = window.OnceUCommon.getFullDisplayName(storedUser);
  var canMentor = storedUser.yearOfStudy && storedUser.yearOfStudy >= 2;

  window.OnceUCommon.initTopbar(storedUser);

  // ---- Hero ----
  applyAvatar(document.getElementById('profileAvatar'), fullDisplayName, storedUser.photoDataUrl);
  document.getElementById('profileName').textContent = fullDisplayName;

  var metaParts = [];
  if (storedUser.yearOfStudy) metaParts.push(yearLabel(storedUser.yearOfStudy));
  if (storedUser.branch) metaParts.push(storedUser.branch);
  metaParts.push('IGDTUW');
  document.getElementById('profileMeta').textContent = metaParts.join(' \u00b7 ');

  var yearTagsHtml = '';
  if (storedUser.yearOfStudy) yearTagsHtml += '<span class="mentor-card__tag">' + yearLabel(storedUser.yearOfStudy) + '</span>';
  if (storedUser.branch) yearTagsHtml += '<span class="mentor-card__tag">' + storedUser.branch + '</span>';
  yearTagsHtml += canMentor
    ? '<span class="mentor-card__tag">Mentor</span>'
    : '<span class="mentor-card__tag">Mentee</span>';
  document.getElementById('profileYearTags').innerHTML = yearTagsHtml;

  // ---- About ----
  document.getElementById('profileBio').textContent = storedUser.bio || 'No bio added yet \u2014 add one from Edit Profile so juniors know what you can help with.';

  // ---- Skills ----
  var skillsEl = document.getElementById('profileSkills');
  if (storedUser.skills.length) {
    skillsEl.innerHTML = storedUser.skills.map(function (s) {
      return '<span class="mentor-card__tag">' + s + '</span>';
    }).join('');
  } else {
    skillsEl.innerHTML = '<p class="settings-card__hint">No skills added yet.</p>';
  }

  // ---- Projects (only shown if filled in) ----
  if (storedUser.projects) {
    document.getElementById('projectsCard').hidden = false;
    document.getElementById('profileProjects').textContent = storedUser.projects;
  }

  // ---- Links (only shown if at least one is filled in) ----
  if (storedUser.linkedin || storedUser.handle) {
    document.getElementById('linksCard').hidden = false;
    if (storedUser.linkedin) {
      var linkedinRow = document.getElementById('linkedinRow');
      var linkedinHref = storedUser.linkedin.indexOf('http') === 0 ? storedUser.linkedin : 'https://' + storedUser.linkedin;
      linkedinRow.href = linkedinHref;
      linkedinRow.hidden = false;
      document.getElementById('linkedinValue').textContent = storedUser.linkedin;
    }
    if (storedUser.handle) {
      document.getElementById('handleRow').hidden = false;
      document.getElementById('handleValue').textContent = storedUser.handle;
    }
  }

  // ---- Incomplete-profile nudge (mirrors the dashboard profile-strength logic) ----
  var missing = [];
  if (!storedUser.photoDataUrl) missing.push('a photo');
  if (!storedUser.bio) missing.push('a bio');
  if (!storedUser.skills.length) missing.push('skills');
  if (missing.length) {
    document.getElementById('incompleteBanner').hidden = false;
    document.getElementById('incompleteText').textContent =
      'Add ' + missing.join(', ') + ' from Edit Profile so juniors can find and choose you as a mentor.';
  }

  // ---- Coins & rating ----
  document.getElementById('profileCoins').textContent = storedUser.coins;
  var ratingEl = document.getElementById('profileRating');
  var ratingLabelEl = document.getElementById('profileRatingLabel');
  if (storedUser.rating != null && storedUser.ratingCount > 0) {
    ratingEl.textContent = storedUser.rating.toFixed(1) + ' \u2605';
    ratingLabelEl.textContent = storedUser.ratingCount + (storedUser.ratingCount === 1 ? ' review' : ' reviews');
  } else {
    ratingEl.textContent = '\u2014';
    ratingLabelEl.textContent = 'No ratings yet';
  }

  // ---- Sessions completed / in progress (both directions: as mentee + as mentor) ----
  var S = window.OnceUSessions;
  var completed = 0;
  var inProgress = 0;

  var sent = S.getSentRequests();
  Object.keys(sent).forEach(function (id) {
    var status = sent[id].status;
    if (status === 'completed') completed++;
    else if (status === 'pending' || status === 'accepted') inProgress++;
  });

  if (canMentor) {
    var incoming = S.getIncomingRequests(storedUser.email, storedUser.yearOfStudy).list;
    incoming.forEach(function (req) {
      if (req.status === 'completed') completed++;
      else if (req.status === 'pending' || req.status === 'accepted') inProgress++;
    });
  }

  document.getElementById('profileSessionsDone').textContent = completed;
  document.getElementById('profileSessionsPending').textContent = inProgress;

  // ---- Recent activity (reuses the same transaction list markup as Settings) ----
  var txnList = document.getElementById('profileTxnList');
  if (!storedUser.coinTransactions.length) {
    txnList.innerHTML = '<p class="txn-empty">No activity yet.</p>';
  } else {
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

  // ---- Visibility hint (reflects Settings > Privacy toggles) ----
  var visibilityHint = document.getElementById('visibilityHint');
  if (!storedUser.privacyPrefs.visibility) {
    visibilityHint.textContent = 'Your profile is currently hidden from other OnceU users. Change this in Settings \u2192 Privacy & Security.';
  } else if (!storedUser.privacyPrefs.college) {
    visibilityHint.textContent = 'Visible to all OnceU users \u2014 your college is hidden.';
  } else {
    visibilityHint.textContent = 'Visible to all OnceU users, including your college (IGDTUW).';
  }
})();