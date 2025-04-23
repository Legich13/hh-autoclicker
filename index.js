(async () => {
  // Убираем href, чтобы ссылки “Откликнуться” не вели на новую страницу
  const responseButtons = document.querySelectorAll('[data-qa="vacancy-serp__vacancy_response"]');
  responseButtons.forEach(btn => btn.removeAttribute('href'));
  
  // Простая утилита для задержки
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // Эмуляция полноценного пользовательского клика
  function simulateClick(el, opts = {}) {
    const base = { bubbles: true, cancelable: true, view: window, ...opts };
    ['mouseover','pointerdown','mousedown','pointerup','mouseup','click']
      .forEach(type => el.dispatchEvent(new MouseEvent(type, base)));
  }

  // Ждём появления основного модального окна отклика
  function waitForResponseModal() {
    return new Promise(resolve => {
      const obs = new MutationObserver(() => {
        const modal = document.querySelector('.magritte-modal-overlay___lK22l_7-1-1');
        if (modal) {
          obs.disconnect();
          resolve('response');
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Ждём появления предупреждения о переезде
  function waitForRelocationModal() {
    return new Promise(resolve => {
      const obs = new MutationObserver(() => {
        const warn = document.querySelector('.magritte-overlay___hMlKJ_2-0-4');
        if (warn) {
          obs.disconnect();
          resolve('relocation');
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Ждём закрытия основного модального окна (по стилю/удалению)
  function waitForResponseModalClose() {
    return new Promise(resolve => {
      const iv = setInterval(() => {
        const modal = document.querySelector('.magritte-modal-overlay___lK22l_7-1-1');
        if (!modal || getComputedStyle(modal).display === 'none' || modal.offsetParent === null) {
          clearInterval(iv);
          resolve();
        }
      }, 300);
    });
  }

  // Ждём закрытия предупреждения о переезде
  function waitForRelocationModalClose() {
    return new Promise(resolve => {
      const iv = setInterval(() => {
        const warn = document.querySelector('.magritte-overlay___hMlKJ_2-0-4');
        if (!warn || getComputedStyle(warn).display === 'none' || warn.offsetParent === null) {
          clearInterval(iv);
          resolve();
        }
      }, 300);
    });
  }

  // Закрыть основное окно отклика, кликнув в пустом углу подложки
  function closeResponseModal() {
    const overlay = document.querySelector('.magritte-modal-overlay___lK22l_7-1-1');
    if (overlay) {
      const { left, top } = overlay.getBoundingClientRect();
      simulateClick(overlay, { clientX: left + 10, clientY: top + 10 });
    }
  }

  // Нажать “Отменить” в предупреждении о переезде
  function cancelRelocation() {
    const btn = document.querySelector('[data-qa="relocation-warning-abort"]');
    if (btn) {
      simulateClick(btn);
    }
  }

  // Обработка одного отклика
  async function handleVacancy(button) {
    console.log('▶️ Отклик №', index + 1);
    simulateClick(button);

    // Ждём либо модалку отклика, либо переезд, либо таймаут
    const which = await Promise.race([
      waitForResponseModal(),
      waitForRelocationModal(),
      delay(2000).then(() => 'timeout')
    ]);

    if (which === 'relocation') {
      console.log('⚠️ Появилось предупреждение о переезде — отменяем');
      cancelRelocation();
      await waitForRelocationModalClose();
      console.log('↩️ Продолжаем к следующей вакансии');
      return;
    }

    if (which === 'response') {
      console.log('✅ Модалка отклика открыта');
      await delay(800);
      closeResponseModal();
      await waitForResponseModalClose();
      console.log('✅ Модалка отклика закрыта');
      return;
    }

    console.log('⏱️ Ничего не открылось — пропускаем');
  }

  // Основной цикл
  let index = 0;
  while (index < responseButtons.length) {
    await handleVacancy(responseButtons[index]);
    index++;
    await delay(1000);
  }

  console.log('🎉 Готово — все вакансии обработаны без переходов!');
})();
