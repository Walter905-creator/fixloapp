// client/src/shield/guard.js
(function () {
  document.addEventListener('submit', function (e) {
    const inputs = e.target.querySelectorAll('input, textarea');
    for (let input of inputs) {
      if (/select|drop|alert|script|onload|onerror/i.test(input.value)) {
        alert('Malicious input detected.');
        e.preventDefault();
        return false;
      }
    }
  });
})();