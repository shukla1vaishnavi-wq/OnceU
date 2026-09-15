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

  window.OnceUCommon.initTopbar(storedUser);
})();