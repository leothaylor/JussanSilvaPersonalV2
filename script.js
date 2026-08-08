(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasFinePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- 1. Reveal on scroll (hero handled separately, on load) ----------
     Content starts fully visible in the HTML/CSS. Only now, with JS confirmed
     running, do we opt elements into the hidden pre-reveal state — so a slow
     or failed script never hides real content. */
  var revealTargets = document.querySelectorAll('.reveal, .reveal-up');

  if (reduced || !('IntersectionObserver' in window)) {
    // Motion disabled or unsupported: leave content visible as-is, no class needed.
  } else {
    revealTargets.forEach(function (el) { el.classList.add('js-anim'); });

    var heroTargets = document.querySelectorAll('.hero .reveal-up');
    var scrollTargets = document.querySelectorAll('.reveal:not(.hero .reveal-up)');

    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    scrollTargets.forEach(function (el) { revealIO.observe(el); });

    // Hero reveals on load, not on scroll.
    var revealHero = function () {
      heroTargets.forEach(function (el) { el.classList.add('is-visible'); });
    };
    if (document.readyState === 'complete') revealHero();
    else window.addEventListener('load', revealHero);

    // Safety net: if anything was missed (e.g. tab backgrounded during load),
    // force full visibility after a short ceiling so nothing stays hidden.
    setTimeout(function () {
      document.querySelectorAll('.js-anim:not(.is-visible)').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }, 2500);
  }

  /* ---------- 3. Count-up on result figures ---------- */
  var counters = document.querySelectorAll('[data-count-to]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced) {
      el.textContent = prefix + target + suffix;
      return;
    }
    var start = null;
    var duration = 900;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(eased * target);
      el.textContent = prefix + value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countIO.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- 4. Process scrollspy ---------- */
  var steps = document.querySelectorAll('.process-step');
  var activeNum = document.getElementById('processActive');
  if (steps.length && activeNum && 'IntersectionObserver' in window) {
    var numEl = activeNum.querySelector('.process-active-num');
    var titleEl = activeNum.querySelector('.process-active-title');
    var stepIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          steps.forEach(function (s) { s.classList.remove('is-active'); });
          entry.target.classList.add('is-active');
          numEl.textContent = entry.target.getAttribute('data-step');
          titleEl.textContent = entry.target.getAttribute('data-title');
        }
      });
    }, { threshold: 0.5, rootMargin: '-15% 0px -55% 0px' });
    steps.forEach(function (s) { stepIO.observe(s); });
  }

  /* ---------- 5. Subtle parallax on visual masks (desktop, no reduced motion) ---------- */
  if (!reduced && hasFinePointer) {
    var parallaxEls = document.querySelectorAll('[data-parallax]');
    if (parallaxEls.length) {
      var ticking = false;
      function updateParallax() {
        var vh = window.innerHeight;
        parallaxEls.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          var center = rect.top + rect.height / 2;
          var offset = ((center - vh / 2) / vh) * 18; // max ~18px shift
          el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
        });
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
      updateParallax();
    }
  }

  /* ---------- 6. Magnetic-lite buttons (desktop only, very subtle) ---------- */
  if (!reduced && hasFinePointer) {
    document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
      var strength = 8; // max px displacement
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x / rect.width * strength).toFixed(1) + 'px,' +
                                              (y / rect.height * strength).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---------- 7. Path panel: keyboard focus mirrors hover intent (desktop CSS already handles hover) ---------- */
  document.querySelectorAll('.path-panel').forEach(function (panel) {
    panel.addEventListener('click', function () {
      var target = panel.querySelector('.path-list');
      if (target) target.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    });
  });

})();
