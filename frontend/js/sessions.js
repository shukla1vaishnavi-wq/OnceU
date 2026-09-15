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
  storedUser.coins = storedUser.coins != null ? storedUser.coins : 500;
  storedUser.coinTransactions = storedUser.coinTransactions || [];
  storedUser.rating = storedUser.rating != null ? storedUser.rating : null;
  storedUser.ratingCount = storedUser.ratingCount || 0;

  var MENTORS = window.OnceUMentors.MENTORS;
  var yearLabel = window.OnceUMentors.yearLabel;
  var initials = window.OnceUMentors.initials;
  var S = window.OnceUSessions;

  window.OnceUCommon.initTopbar(storedUser);

  var SLOTS = ['Today, 6:00 PM', 'Tomorrow, 11:00 AM', 'Tomorrow, 5:00 PM'];
  var canMentor = storedUser.yearOfStudy && storedUser.yearOfStudy >= 2;

  function persistUser() {
    window.OnceUCommon.saveCurrentUser(storedUser);
  }

  // ---- Tabs ----
  var tabMine = document.getElementById('tabMine');
  var tabIncoming = document.getElementById('tabIncoming');
  var tabPill = document.getElementById('sessionTabPill');
  var mineSection = document.getElementById('mineSection');
  var incomingSection = document.getElementById('incomingSection');

  if (!canMentor) {
    document.getElementById('sessionTabs').hidden = true;
    document.getElementById('sessionsSubhead').textContent = 'Track guidance you\u2019ve requested from seniors.';
  } else {
    tabMine.addEventListener('click', function () { setTab('mine'); });
    tabIncoming.addEventListener('click', function () { setTab('incoming'); });
  }

  function setTab(which) {
    var isIncoming = which === 'incoming';
    tabMine.classList.toggle('is-active', !isIncoming);
    tabIncoming.classList.toggle('is-active', isIncoming);
    tabPill.classList.toggle('is-signup', isIncoming);
    mineSection.hidden = isIncoming;
    incomingSection.hidden = !isIncoming;
  }

  // ---- Shared bits: chat panel + voice/video placeholder ----
  function chatHtml(uid, messages, disabled) {
    var msgsHtml = messages.length
      ? messages.map(function (m) {
          return '<div class="chat-msg chat-msg--' + m.from + '"><span>' + m.text + '</span></div>';
        }).join('')
      : '<p class="chat-empty">Say hello to kick things off!</p>';

    return (
      '<div class="chat-panel">' +
        '<div class="chat-panel__messages">' + msgsHtml + '</div>' +
        (disabled ? '' :
          '<div class="chat-panel__input">' +
            '<input type="text" placeholder="Type a message..." data-chat-input="' + uid + '" />' +
            '<button type="button" class="pill-btn" data-action="send-msg" data-id="' + uid + '">Send</button>' +
          '</div>')
      + '</div>'
    );
  }

  function callHtml() {
    return (
      '<div class="call-placeholder">' +
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15 8a4 4 0 0 1 4 4M15 4a8 8 0 0 1 8 8M4 5.5c0-1 .8-1.5 1.7-1.5h2c.6 0 1.1.4 1.3 1l1 2.6c.2.5 0 1.1-.4 1.5l-1.4 1.2a12 12 0 0 0 5.5 5.5l1.2-1.4c.4-.4 1-.6 1.5-.4l2.6 1c.6.2 1 .7 1 1.3v2c0 1-.6 1.8-1.6 1.8C10.5 20 4 13.5 4 5.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
        '<p><strong>Voice/Video calling is coming soon.</strong><br>This build will wire it up via Agora/ZegoCloud, as in our tech stack.</p>' +
        '<button type="button" class="ghost-btn ghost-btn--muted" disabled>Join Call</button>' +
      '</div>'
    );
  }

  function slotPickerHtml(uid) {
    return (
      '<div class="slot-picker">' +
        '<p>Pick a time that works:</p>' +
        '<div class="slot-options">' +
          SLOTS.map(function (s) {
            return '<button type="button" class="slot-option" data-action="pick-slot" data-id="' + uid + '" data-slot="' + s + '">' + s + '</button>';
          }).join('') +
        '</div>' +
      '</div>'
    );
  }

  // ---- Render: My Requests (as mentee) ----
  function renderMine() {
    var all = S.getSentRequests();
    var ids = Object.keys(all).filter(function (id) { return !S.isBlocked(Number(id)); });

    if (ids.length === 0) {
      mineSection.innerHTML = '<p class="empty-state">You haven\u2019t requested anyone yet \u2014 <a href="find-mentors.html">go find a mentor</a>.</p>';
      return;
    }

    mineSection.innerHTML = ids.map(function (idStr) {
      var id = Number(idStr);
      var mentor = MENTORS.find(function (m) { return m.id === id; });
      if (!mentor) return '';
      var req = all[idStr];

      var body = '';
      if (req.status === 'pending') {
        body =
          '<p class="session-note">Waiting for ' + mentor.name + ' to accept your ' + req.mode + ' request (' + req.cost + ' coins).</p>' +
          '<button type="button" class="ghost-btn" data-action="simulate-accept" data-id="' + id + '">Simulate senior accepting (demo)</button>';
      } else if (req.status === 'accepted' && !req.slot) {
        body = slotPickerHtml(id);
      } else if (req.status === 'accepted' && req.slot) {
        body =
          '<p class="session-note">Session set for <strong>' + req.slot + '</strong>.</p>' +
          (req.mode === 'chat' ? chatHtml(id, req.messages, false) : callHtml()) +
          '<button type="button" class="save-btn session-complete-btn" data-action="complete-mine" data-id="' + id + '">Mark Session Complete</button>';
      } else if (req.status === 'completed') {
        body = '<p class="session-note session-note--done">Session completed \u2713 &mdash; ' + req.cost + ' coins sent to ' + mentor.name + '.</p>';
      }

      return (
        '<div class="session-card">' +
          '<div class="session-card__top">' +
            '<div class="mentor-card__avatar">' + initials(mentor.name) + '</div>' +
            '<div class="mentor-card__id">' +
              '<div class="mentor-card__name">' + mentor.name + '</div>' +
              '<div class="mentor-card__meta">' + yearLabel(mentor.year) + ' &middot; ' + mentor.branch + '</div>' +
            '</div>' +
            '<span class="session-status session-status--' + req.status + '">' + req.status + '</span>' +
            '<button type="button" class="block-btn" data-action="block-mine" data-id="' + id + '" title="Block">Block</button>' +
          '</div>' +
          body +
        '</div>'
      );
    }).join('');
  }

  // ---- Render: Junior Requests (as mentor) ----
  function renderIncoming() {
    if (!canMentor) return;
    var data = S.getIncomingRequests(storedUser.email, storedUser.yearOfStudy);
    var list = data.list.filter(function (r) { return !S.isBlocked('junior-' + r.id); });

    if (list.length === 0) {
      incomingSection.innerHTML = '<p class="empty-state">No requests from juniors yet.</p>';
      return;
    }

    incomingSection.innerHTML = list.map(function (req) {
      var body = '';
      if (req.status === 'pending') {
        body =
          '<p class="session-note">&ldquo;' + req.message + '&rdquo;</p>' +
          '<p class="session-note">Requesting a ' + req.mode + ' session (' + req.cost + ' coins).</p>' +
          '<div class="session-actions">' +
            '<button type="button" class="save-btn" data-action="accept-incoming" data-id="' + req.id + '">Accept</button>' +
            '<button type="button" class="ghost-btn" data-action="decline-incoming" data-id="' + req.id + '">Decline</button>' +
          '</div>';
      } else if (req.status === 'declined') {
        body = '<p class="session-note session-note--muted">You declined this request.</p>';
      } else if (req.status === 'accepted' && !req.slot) {
        body = slotPickerHtml('j-' + req.id);
      } else if (req.status === 'accepted' && req.slot) {
        body =
          '<p class="session-note">Session set for <strong>' + req.slot + '</strong>.</p>' +
          (req.mode === 'chat' ? chatHtml('j-' + req.id, req.messages, false) : callHtml()) +
          '<button type="button" class="save-btn session-complete-btn" data-action="complete-incoming" data-id="' + req.id + '">Mark Session Complete</button>';
      } else if (req.status === 'completed') {
        body = '<p class="session-note session-note--done">Session completed \u2713 &mdash; you earned ' + req.cost + ' coins.</p>';
      }

      return (
        '<div class="session-card">' +
          '<div class="session-card__top">' +
            '<div class="mentor-card__avatar">' + initials(req.juniorName) + '</div>' +
            '<div class="mentor-card__id">' +
              '<div class="mentor-card__name">' + req.juniorName + '</div>' +
              '<div class="mentor-card__meta">' + yearLabel(req.juniorYear) + '</div>' +
            '</div>' +
            '<span class="session-status session-status--' + req.status + '">' + req.status + '</span>' +
            '<button type="button" class="block-btn" data-action="block-junior" data-id="' + req.id + '" title="Block">Block</button>' +
          '</div>' +
          body +
        '</div>'
      );
    }).join('');
  }

  function renderAll() {
    renderMine();
    if (canMentor) renderIncoming();
  }

  // ---- Delegated actions ----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var id = btn.getAttribute('data-id');

    if (action === 'simulate-accept') {
      S.simulateAccept(Number(id));
      renderMine();
    } else if (action === 'block-mine') {
      if (confirm('Block this mentor? You won\u2019t see them in listings anymore.')) {
        S.toggleBlock(Number(id));
        renderMine();
      }
    } else if (action === 'block-junior') {
      if (confirm('Block this junior? Their requests will be hidden.')) {
        S.toggleBlock('junior-' + id);
        renderIncoming();
      }
    } else if (action === 'pick-slot') {
      var slot = btn.getAttribute('data-slot');
      if (String(id).indexOf('j-') === 0) {
        S.setIncomingSlot(storedUser.email, storedUser.yearOfStudy, id.slice(2), slot);
        renderIncoming();
      } else {
        S.setSentSlot(Number(id), slot);
        renderMine();
      }
    } else if (action === 'accept-incoming') {
      S.respondIncoming(storedUser.email, storedUser.yearOfStudy, id, true);
      renderIncoming();
    } else if (action === 'decline-incoming') {
      S.respondIncoming(storedUser.email, storedUser.yearOfStudy, id, false);
      renderIncoming();
    } else if (action === 'send-msg') {
      var input = document.querySelector('[data-chat-input="' + id + '"]');
      var text = input.value.trim();
      if (!text) return;
      if (String(id).indexOf('j-') === 0) {
        var reqId = id.slice(2);
        S.addIncomingMessage(storedUser.email, storedUser.yearOfStudy, reqId, 'me', text);
        renderIncoming();
        setTimeout(function () {
          S.addIncomingMessage(storedUser.email, storedUser.yearOfStudy, reqId, 'them', 'Thank you so much, this really helps!');
          renderIncoming();
        }, 1000);
      } else {
        S.addSentMessage(Number(id), 'me', text);
        renderMine();
        setTimeout(function () {
          S.addSentMessage(Number(id), 'them', 'Happy to help \u2014 let\u2019s dive in!');
          renderMine();
        }, 1000);
      }
    } else if (action === 'complete-mine') {
      var mentor = MENTORS.find(function (m) { return m.id === Number(id); });
      var all = S.getSentRequests();
      var req = all[id];
      req.status = 'completed';
      localStorage.setItem('onceu_sent_requests', JSON.stringify(all));
      storedUser.coins = Math.max(0, storedUser.coins - req.cost);
      storedUser.coinTransactions.push({ type: 'session', amount: -req.cost, note: 'Session with ' + mentor.name, at: Date.now() });
      persistUser();
      window.OnceUCommon.updateTopbarInfo(storedUser);
      renderMine();
    } else if (action === 'complete-incoming') {
      var data = S.getIncomingRequests(storedUser.email, storedUser.yearOfStudy);
      var incReq = data.list.find(function (r) { return r.id === id; });
      incReq.status = 'completed';
      localStorage.setItem(data.key, JSON.stringify(data.list));
      storedUser.coins += incReq.cost;
      storedUser.coinTransactions.push({ type: 'session', amount: incReq.cost, note: 'Mentored ' + incReq.juniorName, at: Date.now() });
      storedUser.ratingCount = (storedUser.ratingCount || 0) + 1;
      storedUser.rating = (((storedUser.rating || 5) * (storedUser.ratingCount - 1)) + 5) / storedUser.ratingCount;
      persistUser();
      window.OnceUCommon.updateTopbarInfo(storedUser);
      renderIncoming();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('[data-chat-input]')) {
      var uid = e.target.getAttribute('data-chat-input');
      document.querySelector('[data-action="send-msg"][data-id="' + uid + '"]').click();
    }
  });

  renderAll();
})();