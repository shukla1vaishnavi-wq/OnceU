// Shared across dashboard.js and find-mentors.js so mentor data and
// sent-request status stay consistent no matter which page you're on.
window.OnceUMentors = (function () {
  'use strict';

  var REQUESTS_KEY = 'onceu_sent_requests';

  // Note: alumni mentors (for 4th years) aren't part of this build yet.
  // IGDTUW is a women's college — every mentor in this pool is a student there.
  var MENTORS = [
    { id: 1, name: 'Simran Kaur', year: 2, branch: 'IT', tags: ['Web Dev', 'Beginner Friendly'], bio: 'Built 3 full-stack projects last year — can guide on tech stack choices for beginners.' },
    { id: 2, name: 'Ishita Rawat', year: 2, branch: 'CSE', tags: ['DSA Basics', 'Java'], bio: 'Just cleared first-year DSA with a strong grade — great for juniors starting from zero.' },
    { id: 3, name: 'Meher Chawla', year: 2, branch: 'ECE', tags: ['Hostel Life', 'Time Management'], bio: 'RA at the hostel — knows every shortcut to surviving first-year hostel chaos.' },
    { id: 4, name: 'Kavya Malhotra', year: 2, branch: 'MAE', tags: ['Electives'], bio: 'Picked electives carefully and doesn\u2019t regret a single one — happy to map it out for you.' },
    { id: 5, name: 'Ananya Sharma', year: 3, branch: 'ECE', tags: ['Embedded Systems', 'Placements'], bio: 'Cracked 2 internships in embedded systems — happy to help with resumes and interview prep.' },
    { id: 6, name: 'Priya Verma', year: 3, branch: 'CSE', tags: ['Hackathons', 'Pitching'], bio: 'Won 2 national-level hackathons — loves helping juniors structure their first pitch.' },
    { id: 7, name: 'Kavya Reddy', year: 3, branch: 'MAE', tags: ['Core Companies'], bio: 'Interned at a core mechanical firm — good for core-branch placement guidance.' },
    { id: 8, name: 'Zoya Ahmed', year: 3, branch: 'IT', tags: ['Study Abroad', 'Exchange'], bio: 'Got into an exchange semester — can walk you through the whole process.' },
    { id: 9, name: 'Riya Kapoor', year: 4, branch: 'CSE', tags: ['DSA & Coding', 'Product Companies'], bio: 'Competitive programmer, cleared multiple product-based company interviews.' },
    { id: 10, name: 'Neha Gupta', year: 4, branch: 'ECE', tags: ['Research', 'Signal Processing'], bio: 'Published a paper in signal processing — can help with research direction and papers.' }
  ];

  function getSentRequests() {
    try {
      return JSON.parse(localStorage.getItem(REQUESTS_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function sendRequest(mentorId) {
    var requests = getSentRequests();
    requests[mentorId] = true;
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    return requests;
  }

  function isRequested(mentorId) {
    return !!getSentRequests()[mentorId];
  }

  function yearLabel(year) {
    var suffix = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' }[year] || 'th';
    return year + suffix + ' Year';
  }

  function initials(name) {
    return name
      .split(' ')
      .map(function (part) { return part.charAt(0); })
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  return {
    MENTORS: MENTORS,
    getSentRequests: getSentRequests,
    sendRequest: sendRequest,
    isRequested: isRequested,
    yearLabel: yearLabel,
    initials: initials
  };
})();