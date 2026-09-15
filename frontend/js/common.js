// Shared topbar wiring for dashboard.html, settings.html and find-mentors.html
// so the user-menu dropdown, notification/message icons and logout behave
// identically (and get fixed in one place) across every page.
window.OnceUCommon = (function () {
  'use strict';

  function yearLabel(year) {
    var suffix = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' }[year] || 'th';
    return year + suffix + ' Year';
  }

  function initials(name) {
    return (name || 'S')
      .split(' ')
      .map(function (part) { return part.charAt(0); })
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function getDisplayName(storedUser) {
    var firstName = (storedUser.fullName || '').trim().split(' ')[0];
    return firstName && firstName.toLowerCase() !== 'student' ? firstName : 'Student';
  }

  function getFullDisplayName(storedUser) {
    var displayName = getDisplayName(storedUser);
    return storedUser.fullName && storedUser.fullName.toLowerCase() !== 'student' ? storedUser.fullName : displayName;
  }

  // Applies a saved profile photo (data URL) to any avatar element,
  // or falls back to initials if none is set.
  function applyAvatar(el, fullDisplayName, photoDataUrl) {
    if (!el) return;
    if (photoDataUrl) {
      el.style.backgroundImage = 'url(' + photoDataUrl + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.textContent = initials(fullDisplayName);
    }
  }

  function updateTopbarInfo(storedUser) {
    var fullDisplayName = getFullDisplayName(storedUser);
    var nameEl = document.getElementById('userGreetingName');
    var metaEl = document.getElementById('userGreetingMeta');
    var avatarEl = document.getElementById('userAvatar');

    if (nameEl) nameEl.textContent = fullDisplayName;
    if (metaEl) {
      metaEl.textContent = storedUser.yearOfStudy
        ? yearLabel(storedUser.yearOfStudy) + ' \u2022 IGDTUW'
        : 'IGDTUW';
    }
    applyAvatar(avatarEl, fullDisplayName, storedUser.photoDataUrl || null);
  }

  function getUsersDirectory() {
    try {
      return JSON.parse(localStorage.getItem('onceu_users')) || {};
    } catch (err) {
      return {};
    }
  }

  function getUserByEmail(email) {
    if (!email) return null;
    var directory = getUsersDirectory();
    return directory[email.toLowerCase()] || null;
  }

  // Writes the current session AND keeps the users directory (keyed by email)
  // in sync, so the next time this email logs in, their saved profile —
  // name, branch, photo, bio, coins, everything — comes back instead of
  // being reset to defaults.
  function saveCurrentUser(user) {
    localStorage.setItem('onceu_user', JSON.stringify(user));
    if (user && user.email) {
      var directory = getUsersDirectory();
      directory[user.email.toLowerCase()] = user;
      localStorage.setItem('onceu_users', JSON.stringify(directory));
    }
  }

  // Builds and shows a small "choose how to connect" modal with Chat/Voice/Video
  // options (and their coin cost for this requester's year). Calls onConfirm(mode)
  // if the person picks one and confirms; does nothing if they cancel.
  function promptRequestMode(mentorName, requesterYear, onConfirm) {
    var costs = window.OnceUSessions.MODE_COSTS[requesterYear] || window.OnceUSessions.MODE_COSTS[1];
    var selected = 'chat';

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal">' +
        '<h3>Request ' + mentorName + '</h3>' +
        '<p class="modal__note">Choose how you\u2019d like to connect. Coins move to your mentor once the session happens.</p>' +
        '<div class="mode-options">' +
          '<label class="mode-option is-selected"><input type="radio" name="mode" value="chat" checked><span>Chat</span><em>' + costs.chat + ' coins</em></label>' +
          '<label class="mode-option"><input type="radio" name="mode" value="voice"><span>Voice</span><em>' + costs.voice + ' coins</em></label>' +
          '<label class="mode-option"><input type="radio" name="mode" value="video"><span>Video</span><em>' + costs.video + ' coins</em></label>' +
        '</div>' +
        '<div class="modal__actions">' +
          '<button type="button" class="ghost-btn" data-action="cancel">Cancel</button>' +
          '<button type="button" class="save-btn" data-action="confirm">Send Request</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.mode-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        overlay.querySelectorAll('.mode-option').forEach(function (o) { o.classList.remove('is-selected'); });
        opt.classList.add('is-selected');
        selected = opt.querySelector('input').value;
      });
    });

    function close() { overlay.remove(); }

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', function () {
      close();
      onConfirm(selected);
    });
  }

  function initTopbar(storedUser) {
    var fullDisplayName = getFullDisplayName(storedUser);
    var photoDataUrl = storedUser.photoDataUrl || null;

    var nameEl = document.getElementById('userGreetingName');
    var metaEl = document.getElementById('userGreetingMeta');
    var avatarEl = document.getElementById('userAvatar');

    if (nameEl) nameEl.textContent = fullDisplayName;
    if (metaEl) {
      metaEl.textContent = storedUser.yearOfStudy
        ? yearLabel(storedUser.yearOfStudy) + ' \u2022 IGDTUW'
        : 'IGDTUW';
    }
    applyAvatar(avatarEl, fullDisplayName, photoDataUrl);

    // ---- User menu dropdown ----
    var userMenu = document.getElementById('userMenu');
    var userMenuTrigger = document.getElementById('userMenuTrigger');
    var userMenuDropdown = document.getElementById('userMenuDropdown');

    if (userMenuTrigger && userMenuDropdown) {
      userMenuTrigger.addEventListener('click', function (e) {
        e.stopPropagation();
        closeAllDropdowns();
        userMenuDropdown.hidden = !userMenuDropdown.hidden;
      });
    }

    // ---- Notification / message icon dropdowns (placeholder empty states) ----
    var notifTrigger = document.getElementById('notifTrigger');
    var notifDropdown = document.getElementById('notifDropdown');
    var msgTrigger = document.getElementById('msgTrigger');
    var msgDropdown = document.getElementById('msgDropdown');

    function wireIconDropdown(trigger, dropdown) {
      if (!trigger || !dropdown) return;
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasHidden = dropdown.hidden;
        closeAllDropdowns();
        dropdown.hidden = !wasHidden;
      });
    }
    wireIconDropdown(notifTrigger, notifDropdown);
    wireIconDropdown(msgTrigger, msgDropdown);

    function closeAllDropdowns() {
      [userMenuDropdown, notifDropdown, msgDropdown].forEach(function (d) {
        if (d) d.hidden = true;
      });
    }

    document.addEventListener('click', function () { closeAllDropdowns(); });

    // ---- Logout ----
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('onceu_user');
        window.location.href = 'index.html';
      });
    }

    // ---- "Coming soon" links (not built yet) ----
    document.querySelectorAll('[data-soon]').forEach(function (el) {
      el.setAttribute('title', 'Coming soon');
      el.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  return {
    yearLabel: yearLabel,
    initials: initials,
    getDisplayName: getDisplayName,
    getFullDisplayName: getFullDisplayName,
    applyAvatar: applyAvatar,
    initTopbar: initTopbar,
    updateTopbarInfo: updateTopbarInfo,
    getUsersDirectory: getUsersDirectory,
    getUserByEmail: getUserByEmail,
    saveCurrentUser: saveCurrentUser,
    promptRequestMode: promptRequestMode
  };
})();