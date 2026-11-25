(function () {
  var dismissed = false;
  function dismissPreloader() {
    if (dismissed) return;
    dismissed = true;
    var p = document.getElementById('website-preloader');
    if (!p) return;
    p.style.transition = 'opacity 0.5s ease, visibility 0.5s ease';
    p.style.opacity = '0';
    p.style.visibility = 'hidden';
    p.style.pointerEvents = 'none';
    setTimeout(function () {
      if (p && p.parentNode) p.parentNode.removeChild(p);
    }, 550);
  }

  function checkReactReady() {
    var root = document.getElementById('root');
    if (root && root.children.length > 0) {
      setTimeout(dismissPreloader, 150);
    } else {
      setTimeout(checkReactReady, 50);
    }
  }

  setTimeout(checkReactReady, 200);
  setTimeout(dismissPreloader, 4000);
})();
