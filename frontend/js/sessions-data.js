
window.OnceUSessions = (function () {
  'use strict';

  var SENT_KEY = 'onceu_sent_requests';
  var INCOMING_PREFIX = 'onceu_incoming_requests_';
  var BLOCKED_KEY = 'onceu_blocked';

  // cost depends on the requester's own year.
  var MODE_COSTS = {
    1: { chat: 30, voice: 60, video: 100 },
    2: { chat: 40, voice: 80, video: 130 },
    3: { chat: 50, voice: 100, video: 160 },
    4: { chat: 60, voice: 120, video: 200 }
  };

  var MOCK_JUNIOR_NAMES = ['Diya Menon', 'Aisha Khan', 'Ritika Bose'];

  function costFor(requesterYear, mode) {
    var table = MODE_COSTS[requesterYear] || MODE_COSTS[1];
    return table[mode] || table.chat;
  }

  // ---- Sent requests (you as mentee) ----
  function getSentRequests() {
    try {
      return JSON.parse(localStorage.getItem(SENT_KEY)) || {};
    } catch (err) {
      return {};
    }
  }
  function saveSentRequests(all) {
    localStorage.setItem(SENT_KEY, JSON.stringify(all));
  }

  function sendRequest(mentorId, mode, requesterYear) {
    var all = getSentRequests();
    all[mentorId] = {
      status: 'pending',
      mode: mode,
      cost: costFor(requesterYear, mode),
      slot: null,
      messages: []
    };
    saveSentRequests(all);
    return all[mentorId];
  }

  function isRequested(mentorId) {
    return !!getSentRequests()[mentorId];
  }

  function simulateAccept(mentorId) {
    var all = getSentRequests();
    if (all[mentorId]) {
      all[mentorId].status = 'accepted';
      saveSentRequests(all);
    }
  }

  function setSentSlot(mentorId, slot) {
    var all = getSentRequests();
    if (all[mentorId]) {
      all[mentorId].slot = slot;
      saveSentRequests(all);
    }
  }

  function addSentMessage(mentorId, from, text) {
    var all = getSentRequests();
    if (all[mentorId]) {
      all[mentorId].messages.push({ from: from, text: text, at: Date.now() });
      saveSentRequests(all);
    }
  }

  // ---- Incoming requests (you as mentor) — seeded demo data per account ----
  function getIncomingRequests(email, currentYear) {
    var key = INCOMING_PREFIX + (email || 'anon').toLowerCase();
    var stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(key));
    } catch (err) {
      stored = null;
    }
    if (stored) return { key: key, list: stored };

    
    var juniorYear = (currentYear || 2) - 1;
    var seeded = MOCK_JUNIOR_NAMES.slice(0, 2).map(function (name, i) {
      return {
        id: 'demo-' + i,
        juniorName: name,
        juniorYear: juniorYear,
        mode: i === 0 ? 'chat' : 'voice',
        cost: costFor(juniorYear, i === 0 ? 'chat' : 'voice'),
        message: i === 0
          ? 'Hi! Could you help me figure out which electives to pick this sem?'
          : 'Would love a quick call about internship prep, if you have time!',
        status: 'pending',
        slot: null,
        messages: []
      };
    });
    localStorage.setItem(key, JSON.stringify(seeded));
    return { key: key, list: seeded };
  }

  function saveIncoming(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  function respondIncoming(email, currentYear, requestId, accept) {
    var data = getIncomingRequests(email, currentYear);
    var req = data.list.find(function (r) { return r.id === requestId; });
    if (req) req.status = accept ? 'accepted' : 'declined';
    saveIncoming(data.key, data.list);
    return data.list;
  }

  function setIncomingSlot(email, currentYear, requestId, slot) {
    var data = getIncomingRequests(email, currentYear);
    var req = data.list.find(function (r) { return r.id === requestId; });
    if (req) req.slot = slot;
    saveIncoming(data.key, data.list);
  }

  function addIncomingMessage(email, currentYear, requestId, from, text) {
    var data = getIncomingRequests(email, currentYear);
    var req = data.list.find(function (r) { return r.id === requestId; });
    if (req) req.messages.push({ from: from, text: text, at: Date.now() });
    saveIncoming(data.key, data.list);
  }

  // ---- Block list ----
  function getBlocked() {
    try {
      return JSON.parse(localStorage.getItem(BLOCKED_KEY)) || {};
    } catch (err) {
      return {};
    }
  }
  function isBlocked(id) {
    return !!getBlocked()[id];
  }
  function toggleBlock(id) {
    var blocked = getBlocked();
    if (blocked[id]) delete blocked[id];
    else blocked[id] = true;
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(blocked));
    return !!blocked[id];
  }

  return {
    MODE_COSTS: MODE_COSTS,
    costFor: costFor,
    getSentRequests: getSentRequests,
    sendRequest: sendRequest,
    isRequested: isRequested,
    simulateAccept: simulateAccept,
    setSentSlot: setSentSlot,
    addSentMessage: addSentMessage,
    getIncomingRequests: getIncomingRequests,
    respondIncoming: respondIncoming,
    setIncomingSlot: setIncomingSlot,
    addIncomingMessage: addIncomingMessage,
    isBlocked: isBlocked,
    toggleBlock: toggleBlock
  };
})();