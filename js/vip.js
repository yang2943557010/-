(function () {
  const benefitFilters = Array.from(document.querySelectorAll('#benefitFilters .filter'));
  const benefitCards = Array.from(document.querySelectorAll('.benefit'));
  const benefitEmpty = document.getElementById('benefitEmpty');

  benefitFilters.forEach(filter => {
    filter.addEventListener('click', () => {
      const key = filter.dataset.filter;
      let count = 0;
      benefitFilters.forEach(item => item.classList.toggle('active', item === filter));
      benefitCards.forEach(card => {
        const visible = key === 'all' || card.dataset.tags.includes(key);
        card.classList.toggle('is-hidden', !visible);
        if (visible) count++;
      });
      benefitEmpty.classList.toggle('show', count === 0);
    });
  });

  window.reportInvalid = function (button) {
    button.textContent = '已记录反馈';
    button.disabled = true;
  };
})();
