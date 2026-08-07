/* =============================================================================
   MODERNIST — design system runtime
   id: modernist-d258255b-cd92-4baf-aa18-0c668ae74ef5

   Ships alongside styles.css. Classic script, no build step, no dependencies —
   load it with `defer` before any page script that touches `window.DS`.

   Exposes
     DS.version            bundle version string
     DS.icon(name, attrs)  inline SVG markup from the icon set
     DS.icons              icon name list
     DS.token(name)        computed value of a --token on :root
     DS.money(amount)      currency formatter used across the kit
     DS.ready(fn)          run after DOM parse (safe to call at any time)
     DS.reducedMotion()    honours prefers-reduced-motion

   Custom elements
     <ds-icon name="cart">                       inline icon
     <ds-marquee speed="60" aria-label="...">    seamless ticker
     <ds-counter value="12" suffix="+">          count-up on first view
   ========================================================================== */

(function (global) {
  "use strict";

  /* ---------------------------------------------------------------------------
     Icons — 24x24 grid, 1.6 stroke, round caps. Inherit currentColor.
     ------------------------------------------------------------------------ */

  var PATHS = {
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    cart:
      '<path d="M3 4h2.2l2 12.2A2 2 0 0 0 9.2 18h8.4a2 2 0 0 0 2-1.6L21 8H6.2"/>' +
      '<circle cx="10" cy="21" r="1.2"/><circle cx="18" cy="21" r="1.2"/>',
    arrow:
      '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M4 12.5l5.2 5.2L20 7"/>',
    star:
      '<path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z" ' +
      'fill="currentColor" stroke="none"/>',
    sun:
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22' +
      'M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>',
    moon: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z"/>',
    mail:
      '<rect x="2.8" y="5" width="18.4" height="14" rx="2"/><path d="M3.4 6.6L12 13l8.6-6.4"/>',
    instagram:
      '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>' +
      '<circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>',
    pinterest:
      '<circle cx="12" cy="12" r="9"/><path d="M9.6 20l2-7.6"/>' +
      '<path d="M8.6 10.6c0-2.4 1.9-4.2 4.3-4.2 2.2 0 3.7 1.4 3.7 3.6 0 2.6-1.4 4.6-3.3 4.6' +
      '-1 0-1.8-.8-1.6-1.8"/>',
    yarn:
      '<circle cx="11" cy="12" r="7.4"/><path d="M5.4 7.6C8.9 9 12.4 12 14.2 16.8"/>' +
      '<path d="M4.2 13.2c3.4-.6 6.8.6 9.3 3.4"/><path d="M9 4.9c1.5 3 4.9 5.4 9.2 6.2"/>' +
      '<path d="M18.4 12.4c.9 1.6 2 2.6 3.2 3-1.4.6-2.4 1.8-2.8 3.4-.8-1.5-2-2.4-3.4-2.7"/>',
    hook:
      '<path d="M7 3.5v10.8a4.4 4.4 0 0 0 8.8 0V12"/><path d="M15.8 12c1.6 0 2.7-1 2.7-2.4"/>',
    truck:
      '<path d="M2.8 6.5h10.6v9.8H2.8z"/><path d="M13.4 10h3.7l3.1 3v3.3h-6.8z"/>' +
      '<circle cx="7" cy="18.4" r="1.7"/><circle cx="17" cy="18.4" r="1.7"/>',
    leaf:
      '<path d="M20 4.5C10.5 4.5 4.5 8.6 4.5 15.4c0 2.3 1 3.9 1 3.9S8.4 12 16.4 9.4"/>' +
      '<path d="M5.5 19.3C12 20.8 20 17.4 20 4.5"/>',
    heart:
      '<path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>'
  };

  function icon(name, attrs) {
    var d = PATHS[name];
    if (!d) return "";
    var extra = "";
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          extra += " " + k + '="' + String(attrs[k]).replace(/"/g, "&quot;") + '"';
        }
      }
    }
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"' +
      extra +
      ">" +
      d +
      "</svg>"
    );
  }

  /* ---------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */

  function token(name) {
    var key = name.indexOf("--") === 0 ? name : "--" + name;
    return getComputedStyle(document.documentElement).getPropertyValue(key).trim();
  }

  function reducedMotion() {
    return (
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  var money = (function () {
    var fmt;
    try {
      fmt = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } catch {
      fmt = null;
    }
    return function (amount) {
      return fmt ? fmt.format(amount) : "$" + Math.round(amount);
    };
  })();

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function inView(el, fn, options) {
    if (typeof IntersectionObserver !== "function") {
      fn();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          io.disconnect();
          fn();
          return;
        }
      }
    }, options || { rootMargin: "0px 0px -12% 0px" });
    io.observe(el);
  }

  /* ---------------------------------------------------------------------------
     <ds-icon name="cart">
     ------------------------------------------------------------------------ */

  class DsIcon extends HTMLElement {
    static get observedAttributes() {
      return ["name"];
    }

    connectedCallback() {
      this.setAttribute("aria-hidden", "true");
      this.style.display = "inline-flex";
      this.render();
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    render() {
      this.innerHTML = icon(this.getAttribute("name") || "");
    }
  }

  /* ---------------------------------------------------------------------------
     <ds-marquee speed="60"> — seamless horizontal ticker.

     Repeats its markup until the track is wider than the element, then mirrors
     the track so a -50% translate loops without a seam. Duration is derived
     from content width so every marquee on the page scrolls at the same px/s.
     ------------------------------------------------------------------------ */

  class DsMarquee extends HTMLElement {
    connectedCallback() {
      if (this.built) return;
      this.built = true;
      this.unit = this.innerHTML;

      // Wait a frame so layout has settled before measuring.
      requestAnimationFrame(() => this.build());

      if (typeof ResizeObserver === "function") {
        this.ro = new ResizeObserver(() => {
          clearTimeout(this.timer);
          this.timer = setTimeout(() => this.build(), 180);
        });
        this.ro.observe(this);
      }
    }

    disconnectedCallback() {
      if (this.ro) this.ro.disconnect();
      clearTimeout(this.timer);
    }

    build() {
      var width = this.offsetWidth;
      if (!width) return;

      this.innerHTML = '<div class="marquee__track" aria-hidden="true"></div>';
      var track = this.firstElementChild;
      track.innerHTML = this.unit;

      var guard = 0;
      while (track.scrollWidth < width && guard++ < 40) {
        track.insertAdjacentHTML("beforeend", this.unit);
      }

      var half = track.scrollWidth;
      track.insertAdjacentHTML("beforeend", track.innerHTML);

      var speed = parseFloat(this.getAttribute("speed")) || 60; // px per second
      this.style.setProperty("--marquee-dur", (half / speed).toFixed(2) + "s");
    }
  }

  /* ---------------------------------------------------------------------------
     <ds-counter value="12" suffix="+" duration="1200">
     ------------------------------------------------------------------------ */

  class DsCounter extends HTMLElement {
    connectedCallback() {
      if (this.started) return;
      this.started = true;

      var target = parseFloat(this.getAttribute("value"));
      if (isNaN(target)) return;

      var prefix = this.getAttribute("prefix") || "";
      var suffix = this.getAttribute("suffix") || "";
      var decimals = parseInt(this.getAttribute("decimals"), 10) || 0;
      var duration = parseInt(this.getAttribute("duration"), 10) || 1100;

      var paint = (value) => {
        this.textContent = prefix + value.toFixed(decimals) + suffix;
      };

      if (reducedMotion()) {
        paint(target);
        return;
      }

      paint(0);
      inView(this, function () {
        var start = performance.now();
        (function step(now) {
          var p = Math.min(1, (now - start) / duration);
          // easeOutExpo — quick off the line, settles onto the number
          var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          paint(p < 1 ? target * eased : target);
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }
  }

  /* ---------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */

  var DS = {
    version: "1.0.0",
    id: "modernist-d258255b-cd92-4baf-aa18-0c668ae74ef5",
    icons: Object.keys(PATHS),
    icon: icon,
    token: token,
    money: money,
    ready: ready,
    inView: inView,
    reducedMotion: reducedMotion
  };

  if ("customElements" in global) {
    if (!customElements.get("ds-icon")) customElements.define("ds-icon", DsIcon);
    if (!customElements.get("ds-marquee")) customElements.define("ds-marquee", DsMarquee);
    if (!customElements.get("ds-counter")) customElements.define("ds-counter", DsCounter);
  }

  global.DS = DS;
})(window);
