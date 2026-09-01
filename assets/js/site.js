(function(){
  var header = document.querySelector('header');
  var hero = document.querySelector('.hero');

  // Exposes the header's real height as a CSS var so the hero can pull itself
  // up behind the header (negative margin-top) by exactly that amount, letting
  // the hero photo show through behind the navbar instead of stopping below it.
  function setHeaderHeightVar(){
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
  setHeaderHeightVar();
  window.addEventListener('resize', setHeaderHeightVar);

  // Solid-white cutover happens once the header has fully cleared the hero photo,
  // not at a fixed pixel count — so it adapts to the hero's real height at any viewport size.
  var solidAt = 400;
  function measureSolidAt(){
    if (hero) solidAt = Math.max(hero.offsetHeight - header.offsetHeight, 80);
  }
  measureSolidAt();
  window.addEventListener('resize', measureSolidAt);

  // Past the hero, the header should match whatever section currently sits
  // beneath it (light -> solid off-white, dark -> the same frosted navy the
  // hero uses) rather than turning solid white for the rest of the page.
  function sectionThemeBelowHeader(){
    var probeY = header.offsetHeight + 4;
    var el = document.elementFromPoint(window.innerWidth / 2, probeY);
    var themed = el && el.closest ? el.closest('[data-nav-theme]') : null;
    return themed ? themed.getAttribute('data-nav-theme') : 'light';
  }
  function onScroll(){
    var y = window.scrollY;
    var pastHero = y > solidAt;
    var isLight = pastHero && sectionThemeBelowHeader() === 'light';
    header.classList.toggle('is-scrolled', isLight);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // Toggles (rather than one-time reveals) so sections animate back out when
  // scrolled past going up, then back in on the way back down.
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, {threshold:0.12, rootMargin:'-6% 0px -6% 0px'});
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('is-visible'); });
  }

  // Magic cursor: a small dot that replaces the native pointer, inverting
  // color via mix-blend-mode against whatever it's over, and swelling into
  // a ring over anything clickable. Skipped entirely on touch, and on any
  // page whose <body> opts out via .no-magic-cursor (the LPs, where it kept
  // glitching over the embedded form iframes).
  if (window.matchMedia('(pointer: fine)').matches && !document.body.classList.contains('no-magic-cursor')) {
    var magicCursor = document.createElement('div');
    magicCursor.className = 'magic-cursor';
    document.body.appendChild(magicCursor);
    document.body.classList.add('has-magic-cursor');
    var interactiveSel = 'a, button, input, select, textarea, summary, label, [tabindex], .btn, .service-card, .motion-card, .social-btn, .gallery-grid a, .cert-card, .resource-card';
    window.addEventListener('mousemove', function(e){
      magicCursor.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-50%)';
      magicCursor.style.opacity = '1';
    }, {passive:true});
    document.addEventListener('mouseleave', function(){ magicCursor.style.opacity = '0'; });
    document.addEventListener('mouseover', function(e){
      if (e.target.closest(interactiveSel)) magicCursor.classList.add('is-active');
    });
    document.addEventListener('mouseout', function(e){
      if (e.target.closest(interactiveSel)) magicCursor.classList.remove('is-active');
    });
    document.addEventListener('mousedown', function(){ magicCursor.classList.add('is-down'); });
    document.addEventListener('mouseup', function(){ magicCursor.classList.remove('is-down'); });

    // mousemove never fires on the parent document while the pointer is over
    // an <iframe> (separate browsing context), so the fake cursor would
    // otherwise freeze in place over every embedded form/map. Hide it on
    // entry and let the next real mousemove bring it back on exit.
    document.querySelectorAll('iframe').forEach(function(frame){
      frame.addEventListener('mouseenter', function(){ magicCursor.style.opacity = '0'; });
    });
  }

  // Stay Connected phone: tilts toward the cursor in 3D while hovered,
  // easing back flat on mouseleave.
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.phone-mock').forEach(function(mock){
      var frame = mock.querySelector('.iphone-frame');
      if (!frame) return;
      mock.addEventListener('mousemove', function(e){
        var r = mock.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        frame.style.transform = 'rotateY(' + (px * 16) + 'deg) rotateX(' + (py * -16) + 'deg) translateZ(6px)';
      });
      mock.addEventListener('mouseleave', function(){ frame.style.transform = ''; });
    });
  }

  // Parallax on the brand-bg linear gradient: it drifts opposite the scroll
  // (slower than the page, for depth) and eases toward the cursor position.
  // Both offsets are clamped well inside the -16% oversize so an edge never
  // shows, and combined into one transform each frame.
  var brandBg = document.querySelector('.brand-bg');
  if (brandBg) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pointerFine = window.matchMedia('(pointer: fine)').matches;
    var scrollShift = 0, targetPX = 0, targetPY = 0, curPX = 0, curPY = 0, bgRaf = null;
    function applyBg(){
      brandBg.style.transform = 'translate3d(' + curPX + 'px,' + (curPY + scrollShift) + 'px,0)';
    }
    function bgLoop(){
      curPX += (targetPX - curPX) * 0.06;
      curPY += (targetPY - curPY) * 0.06;
      applyBg();
      if (Math.abs(targetPX - curPX) > 0.05 || Math.abs(targetPY - curPY) > 0.05) {
        bgRaf = requestAnimationFrame(bgLoop);
      } else {
        bgRaf = null;
      }
    }
    if (!reduceMotion) {
      window.addEventListener('scroll', function(){
        scrollShift = Math.max(-70, Math.min(70, window.scrollY * 0.08));
        applyBg();
      }, {passive:true});
      if (pointerFine) {
        window.addEventListener('mousemove', function(e){
          targetPX = (e.clientX / window.innerWidth - 0.5) * 90;
          targetPY = (e.clientY / window.innerHeight - 0.5) * 90;
          if (!bgRaf) bgRaf = requestAnimationFrame(bgLoop);
        }, {passive:true});
      }
    }
  }

  // Cursor glow that follows the mouse over the hero and every navy section
  // (skipped on touch devices, where there's no real cursor to follow).
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.glow-host').forEach(function(host){
      var glow = host.querySelector('.cursor-glow');
      if (!glow) return;
      host.addEventListener('mousemove', function(e){
        var r = host.getBoundingClientRect();
        glow.style.transform = 'translate(' + (e.clientX - r.left) + 'px,' + (e.clientY - r.top) + 'px) translate(-50%,-50%)';
        glow.style.opacity = '1';
      });
      host.addEventListener('mouseleave', function(){ glow.style.opacity = '0'; });
    });
  }

  // Motion-card videos only play while scrolled into view (saves battery/bandwidth),
  // and never autoplay for users who've asked for reduced motion.
  var motionVideos = document.querySelectorAll('.motion-card video, .iphone-screen video');
  if (motionVideos.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) entry.target.play().catch(function(){});
          else entry.target.pause();
        });
      }, {threshold:0.4});
      motionVideos.forEach(function(v){ vio.observe(v); });
    } else {
      motionVideos.forEach(function(v){ v.play().catch(function(){}); });
    }
  }

  // Service cards flip on hover (desktop) via CSS; this adds a tap-to-flip
  // toggle so touch devices (no real :hover) can flip them back and forth too.
  document.querySelectorAll('.service-card').forEach(function(card){
    card.addEventListener('click', function(e){
      if (e.target.closest('a')) return;
      card.classList.toggle('is-flipped');
    });
  });

  // Tactile ripple on every button, from the actual click point.
  document.querySelectorAll('.btn').forEach(function(btn){
    btn.addEventListener('click', function(e){
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height);
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function(){ ripple.remove(); });
    });
  });
})();
