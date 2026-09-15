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

  // ---- Mentor pool (shared with find-mentors.js) ----
  var MENTORS = window.OnceUMentors.MENTORS;
  var yearLabel = window.OnceUMentors.yearLabel;
  var initials = window.OnceUMentors.initials;

  // A mentee only ever sees the year directly above their own —
  // e.g. a 1st year is matched to 2nd years, never 3rd or 4th.
  var targetYear = storedUser.yearOfStudy ? storedUser.yearOfStudy + 1 : null;

  // ---- Header / greeting / topbar (shared) ----
  window.OnceUCommon.initTopbar(storedUser);
  var displayName = window.OnceUCommon.getDisplayName(storedUser);

  document.getElementById('welcomeHeading').textContent = 'Welcome to OnceU, ' + displayName + '! \uD83D\uDC4B';
  document.getElementById('userCoins').textContent = storedUser.coins != null ? storedUser.coins : 500;

  // ---- Profile strength (real, based on filled-in fields) ----
  var strengthChecks = [
    !!(storedUser.fullName && storedUser.fullName.toLowerCase() !== 'student'),
    !!storedUser.yearOfStudy,
    !!storedUser.branch,
    !!storedUser.photoDataUrl
  ];
  var filledCount = strengthChecks.filter(Boolean).length;
  var strengthPct = Math.round((filledCount / strengthChecks.length) * 100);

  document.getElementById('profileStrengthBar').style.width = strengthPct + '%';
  if (strengthPct === 100) {
    document.getElementById('profileStrengthLink').textContent = 'Profile complete';
  }

  // ---- Mentor grid ----
  var mentorGrid = document.getElementById('mentorGrid');
  var emptyState = document.getElementById('emptyState');
  var mentorsHeading = document.getElementById('mentorsHeading');
  var mentorsSubhead = document.getElementById('mentorsSubhead');
  var quickLinkBrowse = document.getElementById('quickLinkBrowse');

  function renderMentors() {
    if (!targetYear || targetYear > 4) {
      mentorsHeading.textContent = 'Recommended Mentors';
      mentorsSubhead.textContent = 'Alumni mentors are coming in a future update.';
      mentorGrid.innerHTML = '';
      emptyState.hidden = false;
      emptyState.textContent = 'You\u2019re in your final year \u2014 alumni mentors aren\u2019t wired up yet. Check back after the first alumni batch joins.';
      quickLinkBrowse.textContent = 'Browse Mentors';
      return;
    }

    mentorsHeading.textContent = 'Recommended Mentors (' + yearLabel(targetYear) + ' \u2013 IGDTUW)';
    mentorsSubhead.textContent = 'Connect with experienced seniors from your college';
    quickLinkBrowse.textContent = 'Browse ' + yearLabel(targetYear) + ' Mentors';

    var filtered = MENTORS.filter(function (m) { return m.year === targetYear && !window.OnceUSessions.isBlocked(m.id); }).slice(0, 3);

    mentorGrid.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.textContent = 'No ' + yearLabel(targetYear) + ' mentors yet \u2014 check back soon.';
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    filtered.forEach(function (mentor) {
      var card = document.createElement('div');
      card.className = 'mentor-card';

      var isSent = window.OnceUSessions.isRequested(mentor.id);
      var tagsHtml = mentor.tags.map(function (t) { return '<span class="mentor-card__tag">' + t + '</span>'; }).join('');

      card.innerHTML =
        '<div class="mentor-card__top">' +
          '<div class="mentor-card__avatar">' + initials(mentor.name) + '<span class="mentor-card__available" title="Available"></span></div>' +
          '<div class="mentor-card__id">' +
            '<div class="mentor-card__name">' + mentor.name + '</div>' +
            '<div class="mentor-card__meta">' + yearLabel(mentor.year) + ' &middot; ' + mentor.branch + '</div>' +
          '</div>' +
          '<button type="button" class="mentor-card__save" aria-label="Save mentor" title="Coming soon">' +
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20.5s-7.5-4.6-9.7-9C.7 8 2 4.5 5.4 3.7c2-.5 3.9.2 5 1.8l1.6 2.2 1.6-2.2c1.1-1.6 3-2.3 5-1.8C22 4.5 23.3 8 21.7 11.5c-2.2 4.4-9.7 9-9.7 9Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="mentor-card__tags">' + tagsHtml + '</div>' +
        '<p class="mentor-card__bio">' + mentor.bio + '</p>' +
        '<button type="button" class="request-btn' + (isSent ? ' is-sent' : '') + '" data-mentor-id="' + mentor.id + '">' +
          '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 9.5h17" stroke="currentColor" stroke-width="1.7"/></svg>' +
          (isSent ? 'Requested' : 'Request Session') +
        '</button>';

      mentorGrid.appendChild(card);
    });
  }

  mentorGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.request-btn');
    if (!btn || btn.classList.contains('is-sent')) return;

    var mentorId = Number(btn.getAttribute('data-mentor-id'));
    var mentor = MENTORS.find(function (m) { return m.id === mentorId; });

    window.OnceUCommon.promptRequestMode(mentor.name, storedUser.yearOfStudy, function (mode) {
      window.OnceUSessions.sendRequest(mentorId, mode, storedUser.yearOfStudy);
      renderMentors();
    });
  });

  renderMentors();
})();