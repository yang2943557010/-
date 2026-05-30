(function () {
  try {
    if (localStorage.getItem('hideGuidePanel') === 'true') {
      document.documentElement.classList.add('guide-hidden');
    }
  } catch (e) {}
})();
