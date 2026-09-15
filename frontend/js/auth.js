(function () {
  'use strict';

  // ---- If already logged in, skip straight to dashboard ----
  var existingUser = null;
  try {
    existingUser = JSON.parse(localStorage.getItem('onceu_user'));
  } catch (err) {
    existingUser = null;
  }
  if (existingUser) {
    window.location.href = 'dashboard.html';
    return;
  }

  var mode = 'login';

  var splash = document.getElementById('splash');
  var mainContent = document.getElementById('mainContent');

  var tabLogin = document.getElementById('tabLogin');
  var tabSignup = document.getElementById('tabSignup');
  var pill = document.getElementById('switcherPill');
  var formTitle = document.getElementById('formTitle');
  var formSubtitle = document.getElementById('formSubtitle');
  var submitBtnText = document.getElementById('submitBtnText');
  var submitBtn = document.getElementById('submitBtn');
  var switchPrompt = document.getElementById('switchPrompt');
  var switchLink = document.getElementById('switchLink');
  var authForm = document.getElementById('authForm');
  var formStatus = document.getElementById('formStatus');
  var fullNameField = document.getElementById('fullNameField');

  var fullNameInput = document.getElementById('fullName');
  var emailField = document.getElementById('collegeEmail');
  var passwordField = document.getElementById('password');
  var togglePassword = document.getElementById('togglePassword');

  var EMAIL_PATTERN = /^[a-z]+\d{2,4}[a-z]{2,6}\d{2}@igdtuw\.ac\.in$/i;
  var PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  var SPLASH_DURATION_MS = 1500;

  function hideSplash() {
    splash.classList.add('is-hidden');
    mainContent.classList.add('is-visible');
    setTimeout(function () {
      splash.style.display = 'none';
    }, 500);
  }

  window.addEventListener('load', function () {
    setTimeout(hideSplash, SPLASH_DURATION_MS);
  });

  // ---- Show / hide password ----
  togglePassword.addEventListener('click', function () {
    var isPassword = passwordField.type === 'password';
    passwordField.type = isPassword ? 'text' : 'password';
    togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    togglePassword.classList.toggle('is-visible', isPassword);
  });

  function setMode(next) {
    mode = next;
    var isSignup = mode === 'signup';

    tabLogin.classList.toggle('is-active', !isSignup);
    tabSignup.classList.toggle('is-active', isSignup);
    pill.classList.toggle('is-signup', isSignup);

    formTitle.textContent = isSignup ? 'Create your account' : 'Welcome back';
    formSubtitle.textContent = isSignup
      ? 'Sign up with your college email to get started.'
      : 'Log in with your college email to continue.';

    submitBtnText.textContent = isSignup ? 'Sign Up' : 'Log In';

    switchPrompt.textContent = isSignup ? 'Already on OnceU?' : 'New to OnceU?';
    switchLink.textContent = isSignup ? 'Log in' : 'Create an account';

    fullNameField.classList.toggle('is-open', isSignup);

    clearErrors();
    hideStatus();
  }

  function clearErrors() {
    document.querySelectorAll('.field').forEach(function (f) {
      f.classList.remove('has-error');
    });
  }

  function setError(fieldEl, hasError) {
    fieldEl.closest('.field').classList.toggle('has-error', hasError);
  }

  function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = 'status is-' + type;
  }

  function hideStatus() {
    formStatus.textContent = '';
    formStatus.className = 'status';
  }

  function deriveYearOfStudy(email) {
    var match = email.match(/(\d{2})@igdtuw\.ac\.in$/i);
    if (!match) return null;

    var admissionYear = 2000 + parseInt(match[1], 10);
    var now = new Date();
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth() + 1;

    // Admission year can't be in the future — that batch doesn't exist yet.
    if (admissionYear > currentYear) return null;

    var yearsPassed = currentYear - admissionYear;
    var yearOfStudy = currentMonth >= 7 ? yearsPassed + 1 : yearsPassed;

    if (yearOfStudy < 1) yearOfStudy = 1;
    return yearOfStudy;
  }

  function validate() {
    var valid = true;

    if (mode === 'signup' && fullNameInput.value.trim().length < 2) {
      setError(fullNameInput, true);
      valid = false;
    } else if (mode === 'signup') {
      setError(fullNameInput, false);
    }

    if (!EMAIL_PATTERN.test(emailField.value.trim()) || deriveYearOfStudy(emailField.value.trim()) === null) {
      setError(emailField, true);
      valid = false;
    } else {
      setError(emailField, false);
    }

    if (!PASSWORD_PATTERN.test(passwordField.value)) {
      setError(passwordField, true);
      valid = false;
    } else {
      setError(passwordField, false);
    }

    return valid;
  }

  function handleSubmit(e) {
    e.preventDefault();
    hideStatus();

    if (!validate()) {
      showStatus('Please fix the highlighted fields.', 'error');
      return;
    }

    var email = emailField.value.trim();
    var year = deriveYearOfStudy(email);

    submitBtn.disabled = true;
    submitBtnText.textContent = mode === 'signup' ? 'Creating account...' : 'Logging in...';

    setTimeout(function () {
      var existingRecord = window.OnceUCommon.getUserByEmail(email);
      var destination = 'dashboard.html';
      var user;

      if (mode === 'signup') {
        if (existingRecord) {
          // Already has an account — sign them in instead of wiping their data.
          user = existingRecord;
        } else {
          user = {
            fullName: fullNameInput.value.trim() || 'Student',
            email: email,
            yearOfStudy: year,
            branch: null,
            photoDataUrl: null,
            coins: 500,
            bio: '',
            linkedin: '',
            handle: '',
            skills: [],
            projects: '',
            rating: null,
            ratingCount: 0,
            profileBonusAwarded: false,
            notifPrefs: { mentor: true, resource: true, community: true },
            privacyPrefs: { visibility: true, college: true, invitations: true },
            googleConnected: true,
            coinTransactions: [{ type: 'signup', amount: 500, note: 'Welcome bonus', at: Date.now() }]
          };
          // First-time signup — send them to Settings to fill in their profile
          // (bio, branch, skills) before they start browsing/mentoring.
          destination = 'settings.html';
        }
      } else {
        // Login — restore the saved profile if it exists; only fall back to
        // a fresh record if this email genuinely hasn't been seen before.
        user = existingRecord || {
          fullName: 'Student',
          email: email,
          yearOfStudy: year,
          branch: null,
          photoDataUrl: null,
          coins: 500,
          bio: '',
          linkedin: '',
          handle: '',
          skills: [],
          projects: '',
          rating: null,
          ratingCount: 0,
          profileBonusAwarded: false,
          notifPrefs: { mentor: true, resource: true, community: true },
          privacyPrefs: { visibility: true, college: true, invitations: true },
          googleConnected: true,
          coinTransactions: [{ type: 'signup', amount: 500, note: 'Welcome bonus', at: Date.now() }]
        };
      }

      window.OnceUCommon.saveCurrentUser(user);

      showStatus(
        mode === 'signup' ? 'Account created successfully!' : 'Logged in successfully!',
        'success'
      );

      setTimeout(function () {
        window.location.href = destination;
      }, 700);
    }, 500);
  }

  tabLogin.addEventListener('click', function () { setMode('login'); });
  tabSignup.addEventListener('click', function () { setMode('signup'); });
  switchLink.addEventListener('click', function () { setMode(mode === 'login' ? 'signup' : 'login'); });
  authForm.addEventListener('submit', handleSubmit);

  setMode('login');
})();