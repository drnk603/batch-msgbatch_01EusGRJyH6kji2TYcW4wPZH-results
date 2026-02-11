(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var app = window.__app;

  function debounce(fn, delay) {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(context, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    var waiting = false;
    return function() {
      if (!waiting) {
        fn.apply(this, arguments);
        waiting = true;
        setTimeout(function() {
          waiting = false;
        }, limit);
      }
    };
  }

  function initBurgerMenu() {
    if (app.burgerInited) return;
    app.burgerInited = true;

    var toggle = document.querySelector('.navbar-toggler');
    var navbarCollapse = document.querySelector('.navbar-collapse');

    if (!toggle || !navbarCollapse) return;

    var focusableElements = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openMenu() {
      navbarCollapse.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      trapFocus();
    }

    function closeMenu() {
      navbarCollapse.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    }

    function trapFocus() {
      var focusable = navbarCollapse.querySelectorAll(focusableElements);
      if (focusable.length === 0) return;

      var firstFocusable = focusable[0];
      var lastFocusable = focusable[focusable.length - 1];

      function handleTabKey(e) {
        if (!navbarCollapse.classList.contains('show')) return;

        if (e.key === 'Tab' || e.keyCode === 9) {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              lastFocusable.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              firstFocusable.focus();
              e.preventDefault();
            }
          }
        }
      }

      document.removeEventListener('keydown', handleTabKey);
      document.addEventListener('keydown', handleTabKey);
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (navbarCollapse.classList.contains('show')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'Escape' || e.keyCode === 27) && navbarCollapse.classList.contains('show')) {
        closeMenu();
      }
    });

    document.addEventListener('click', function(e) {
      if (navbarCollapse.classList.contains('show') && 
          !navbarCollapse.contains(e.target) && 
          !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    var navLinks = document.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        closeMenu();
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 768 && navbarCollapse.classList.contains('show')) {
        closeMenu();
      }
    }, 200);

    window.addEventListener('resize', resizeHandler);
  }

  function initScrollSpy() {
    if (app.scrollSpyInited) return;
    app.scrollSpyInited = true;

    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    var header = document.querySelector('.l-header');
    var offset = header ? header.offsetHeight + 20 : 100;

    function activateLink() {
      var scrollPosition = window.pageYOffset;

      for (var i = sections.length - 1; i >= 0; i--) {
        var section = sections[i];
        var sectionTop = section.offsetTop - offset;
        var sectionBottom = sectionTop + section.offsetHeight;
        var sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          for (var j = 0; j < navLinks.length; j++) {
            var link = navLinks[j];
            link.classList.remove('active');
            link.removeAttribute('aria-current');

            if (link.getAttribute('href') === '#' + sectionId) {
              link.classList.add('active');
              link.setAttribute('aria-current', 'location');
            }
          }
          return;
        }
      }
    }

    var scrollHandler = throttle(activateLink, 100);
    window.addEventListener('scroll', scrollHandler);
    activateLink();
  }

  function initSmoothScroll() {
    if (app.smoothScrollInited) return;
    app.smoothScrollInited = true;

    var isHomepage = window.location.pathname === '/' || 
                     window.location.pathname === '/index.html' || 
                     window.location.pathname.endsWith('/index.html');

    if (!isHomepage) {
      var sectionLinks = document.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#!"])');
      for (var i = 0; i < sectionLinks.length; i++) {
        var link = sectionLinks[i];
        var href = link.getAttribute('href');
        if (href && href.length > 1 && !href.startsWith('/#')) {
          link.setAttribute('href', '/' + href);
        }
      }
    }

    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target) return;

      var href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      var isAnchor = href.startsWith('#');
      var isHomeAnchor = href.startsWith('/#');

      if (isAnchor || (isHomeAnchor && isHomepage)) {
        var hash = isAnchor ? href : href.substring(1);
        var element = document.querySelector(hash);

        if (element) {
          e.preventDefault();

          var header = document.querySelector('.l-header');
          var offset = header ? header.offsetHeight : 80;
          var elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          var offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  }

  function initActiveMenu() {
    if (app.activeMenuInited) return;
    app.activeMenuInited = true;

    var currentPath = window.location.pathname;
    var navLinks = document.querySelectorAll('.nav-link');

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      link.removeAttribute('aria-current');
      link.classList.remove('active');

      if (linkPath && !linkPath.startsWith('#')) {
        if (linkPath === currentPath || 
            (currentPath === '/' && linkPath === '/index.html') ||
            (currentPath === '/index.html' && linkPath === '/')) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('active');
        }
      }
    }
  }

  function initImages() {
    if (app.imagesInited) return;
    app.imagesInited = true;

    var images = document.querySelectorAll('img');

    function createPlaceholderSVG() {
      return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
        '<rect fill="#e9ecef" width="400" height="300"/>' +
        '<text fill="#6c757d" font-family="sans-serif" font-size="18" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">' +
        'Image not available</text></svg>'
      );
    }

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      var isLogo = img.classList.contains('c-logo__img');
      var isCritical = img.hasAttribute('data-critical');

      if (!img.hasAttribute('loading') && !isLogo && !isCritical) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function() {
        this.src = createPlaceholderSVG();
      });
    }
  }

  function initFormValidation() {
    if (app.formsInited) return;
    app.formsInited = true;

    var forms = document.querySelectorAll('.needs-validation');

    var validationRules = {
      name: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Lūdzu, ievadiet derīgu vārdu (2-50 rakstzīmes)'
      },
      firstName: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Lūdzu, ievadiet derīgu vārdu (2-50 rakstzīmes)'
      },
      lastName: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Lūdzu, ievadiet derīgu uzvārdu (2-50 rakstzīmes)'
      },
      email: {
        pattern: /^[^s@]+@[^s@]+.[^s@]+$/,
        message: 'Lūdzu, ievadiet derīgu e-pasta adresi'
      },
      phone: {
        pattern: /^[+-ds()]{7,20}$/,
        message: 'Lūdzu, ievadiet derīgu tālruņa numuru'
      },
      subject: {
        pattern: /^.{3,200}$/,
        message: 'Lūdzu, ievadiet tēmu (3-200 rakstzīmes)'
      },
      message: {
        pattern: /^.{10,2000}$/,
        message: 'Lūdzu, ievadiet ziņojumu (vismaz 10 rakstzīmes)'
      }
    };

    function validateField(field) {
      var fieldName = field.getAttribute('name');
      var fieldValue = field.value.trim();
      var fieldType = field.getAttribute('type');

      var errorElement = field.parentElement.querySelector('.invalid-feedback');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        field.parentElement.appendChild(errorElement);
      }

      if (field.hasAttribute('required') && !fieldValue) {
        field.classList.add('is-invalid');
        errorElement.textContent = 'Šis lauks ir obligāts';
        errorElement.classList.add('is-visible');
        return false;
      }

      if (fieldType === 'checkbox' && field.hasAttribute('required') && !field.checked) {
        field.classList.add('is-invalid');
        errorElement.textContent = 'Jums jāpiekrīt, lai turpinātu';
        errorElement.classList.add('is-visible');
        return false;
      }

      if (fieldValue && validationRules[fieldName]) {
        var rule = validationRules[fieldName];
        if (!rule.pattern.test(fieldValue)) {
          field.classList.add('is-invalid');
          errorElement.textContent = rule.message;
          errorElement.classList.add('is-visible');
          return false;
        }
      }

      field.classList.remove('is-invalid');
      errorElement.classList.remove('is-visible');
      return true;
    }

    app.notify = function(message, type) {
      var container = document.querySelector('.toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
      }

      var toast = document.createElement('div');
      toast.className = 'toast align-items-center text-white bg-' + (type || 'primary') + ' border-0';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.setAttribute('aria-atomic', 'true');

      toast.innerHTML = 
        '<div class="d-flex">' +
        '<div class="toast-body">' + message + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
        '</div>';

      container.appendChild(toast);

      if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Toast) {
        var bsToast = new window.bootstrap.Toast(toast, { delay: 5000 });
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', function() {
          toast.remove();
        });
      } else {
        toast.style.display = 'block';
        toast.style.opacity = '1';
        setTimeout(function() {
          toast.style.opacity = '0';
          setTimeout(function() {
            toast.remove();
          }, 300);
        }, 5000);
      }
    };

    for (var i = 0; i < forms.length; i++) {
      (function(form) {
        var fields = form.querySelectorAll('input, textarea, select');
        
        for (var j = 0; j < fields.length; j++) {
          fields[j].addEventListener('blur', function() {
            validateField(this);
          });
        }

        form.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();

          form.classList.add('was-validated');

          var isValid = true;
          var firstInvalidField = null;

          for (var k = 0; k < fields.length; k++) {
            if (!validateField(fields[k])) {
              isValid = false;
              if (!firstInvalidField) {
                firstInvalidField = fields[k];
              }
            }
          }

          if (!isValid) {
            if (firstInvalidField) {
              firstInvalidField.focus();
            }
            app.notify('Lūdzu, aizpildiet visus obligātos laukus pareizi', 'danger');
            return;
          }

          var submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = true;
            var originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 
              '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sūta...';

            var formData = new FormData(form);
            var data = {};
            formData.forEach(function(value, key) {
              data[key] = value;
            });

            setTimeout(function() {
              fetch('/process.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
              })
              .then(function(response) {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                return response.json();
              })
              .then(function(result) {
                if (result.success) {
                  app.notify('Jūsu ziņojums ir veiksmīgi nosūtīts!', 'success');
                  setTimeout(function() {
                    window.location.href = '/thank_you.html';
                  }, 1500);
                } else {
                  app.notify(result.message || 'Radās kļūda. Lūdzu, mēģiniet vēlreiz.', 'danger');
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = originalText;
                }
              })
              .catch(function() {
                app.notify('Ошибка соединения, попробуйте позже', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
              });
            }, 800);
          }
        });
      })(forms[i]);
    }
  }

  function initScrollToTop() {
    if (app.scrollToTopInited) return;
    app.scrollToTopInited = true;

    var scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.style.display = 'none';
    document.body.appendChild(scrollToTopBtn);

    function toggleButton() {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.style.display = 'flex';
      } else {
        scrollToTopBtn.style.display = 'none';
      }
    }

    scrollToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    var scrollHandler = throttle(toggleButton, 100);
    window.addEventListener('scroll', scrollHandler);
    toggleButton();
  }

  function initCountUp() {
    if (app.countUpInited) return;
    app.countUpInited = true;

    var counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    var countedElements = [];

    function animateCount(element) {
      if (countedElements.indexOf(element) !== -1) return;
      countedElements.push(element);

      var target = parseInt(element.getAttribute('data-count'), 10);
      var duration = parseInt(element.getAttribute('data-duration') || '2000', 10);
      var start = 0;
      var increment = target / (duration / 16);
      var current = start;

      var timer = setInterval(function() {
        current += increment;
        if (current >= target) {
          element.textContent = target;
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(current);
        }
      }, 16);
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
        }
      });
    }, { threshold: 0.5 });

    for (var i = 0; i < counters.length; i++) {
      observer.observe(counters[i]);
    }
  }

  function initPrivacyModal() {
    if (app.privacyModalInited) return;
    app.privacyModalInited = true;

    var privacyLinks = document.querySelectorAll('a[href*="privacy"]');
    
    for (var i = 0; i < privacyLinks.length; i++) {
      var link = privacyLinks[i];
      var href = link.getAttribute('href');
      
      if (href && href !== '/privacy.html' && href.includes('privacy')) {
        link.addEventListener('click', function(e) {
          var target = e.target;
          if (target.getAttribute('data-toggle') === 'modal') {
            e.preventDefault();
          }
        });
      }
    }
  }

  app.init = function() {
    if (app.initialized) return;
    app.initialized = true;

    initBurgerMenu();
    initScrollSpy();
    initSmoothScroll();
    initActiveMenu();
    initImages();
    initFormValidation();
    initScrollToTop();
    initCountUp();
    initPrivacyModal();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();
**Дополнительные CSS стили для scroll-to-top кнопки (добавить в style.css):**

.scroll-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 48px;
  height: 48px;
  background-color: var(--color-accent);
  color: var(--color-white);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  z-index: 998;
  transition: all var(--transition-base);
}

.scroll-to-top:hover,
.scroll-to-top:focus {
  background-color: var(--color-accent-hover);
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(196, 181, 216, 0.4);
}

.scroll-to-top:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.u-no-scroll {
  overflow: hidden;
}
