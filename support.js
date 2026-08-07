/* =============================================================================
   support.js — page runtime for Samantha's Crochet Boutique

   Everything here is progressive: the page is readable, navigable and
   purchasable-looking with JavaScript switched off. This file adds the
   behaviour on top.

     · theme          light/dark toggle, remembers the choice
     · header         hairline rule appears once the page has scrolled
     · drawer         small-screen navigation, focus + Esc handling
     · reveal         staggered entrance for sections as they come into view
     · nav            highlights the section you are currently reading
     · filters        shop grid category filtering with a live count
     · basket         add-to-basket count, persisted, with a toast
     · faq            one answer open at a time
     · signup         email validation and confirmation

   Depends on _ds_bundle.js for DS.icon / DS.ready / DS.reducedMotion.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var STORE = {
    theme: "scb:theme",
    basket: "scb:basket"
  };

  /* Storage is a nicety, never a dependency — private mode must not break the
     page, so every access is guarded. */
  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* quota or blocked — the session still works, it just won't be remembered */
    }
  }

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ---------------------------------------------------------------------------
     Theme
     ------------------------------------------------------------------------ */

  function initTheme() {
    var toggle = $("[data-theme-toggle]");
    var media = matchMedia("(prefers-color-scheme: dark)");

    function current() {
      var set = root.getAttribute("data-theme");
      if (set === "dark" || set === "light") return set;
      return media.matches ? "dark" : "light";
    }

    function paint() {
      if (!toggle) return;
      var next = current() === "dark" ? "light" : "dark";
      toggle.innerHTML = window.DS
        ? DS.icon(current() === "dark" ? "sun" : "moon")
        : "";
      toggle.setAttribute("aria-label", "Switch to " + next + " theme");
      toggle.setAttribute("title", "Switch to " + next + " theme");
    }

    var saved = read(STORE.theme);
    if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
    paint();

    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = current() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        write(STORE.theme, next);
        paint();
      });
    }

    // Follow the system while the visitor has not made an explicit choice.
    media.addEventListener("change", function () {
      if (!read(STORE.theme)) paint();
    });
  }

  /* ---------------------------------------------------------------------------
     Header
     ------------------------------------------------------------------------ */

  function initHeader() {
    var header = $(".site-header");
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    }

    update();
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------------------
     Drawer
     ------------------------------------------------------------------------ */

  function initDrawer() {
    var drawer = $("#nav-drawer");
    var openBtn = $("[data-nav-open]");
    var closeBtn = $("[data-nav-close]");
    if (!drawer || !openBtn) return;

    var regions = $$("[data-page-region]");

    function setOpen(open) {
      drawer.setAttribute("data-open", String(open));
      openBtn.setAttribute("aria-expanded", String(open));
      document.body.toggleAttribute("data-lock", open);
      regions.forEach(function (region) {
        region.inert = open;
      });

      if (open) {
        var first = $("a, button", drawer);
        if (first) first.focus();
      } else {
        openBtn.focus();
      }
    }

    openBtn.addEventListener("click", function () {
      setOpen(true);
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setOpen(false);
      });
    }

    drawer.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer.getAttribute("data-open") === "true") {
        setOpen(false);
      }
    });

    // A resize past the breakpoint leaves the drawer stranded open.
    matchMedia("(min-width: 62rem)").addEventListener("change", function (event) {
      if (event.matches && drawer.getAttribute("data-open") === "true") setOpen(false);
    });
  }

  /* ---------------------------------------------------------------------------
     Reveal
     ------------------------------------------------------------------------ */

  function initReveal() {
    var targets = $$("[data-reveal]");
    if (!targets.length) return;

    if (typeof IntersectionObserver !== "function") {
      targets.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    // Stagger siblings so a row of cards arrives as a sequence, not a slab.
    targets.forEach(function (el) {
      var group = el.closest("[data-reveal-stagger]");
      if (!group) return;
      var peers = $$("[data-reveal]", group);
      var delay = Math.min(peers.indexOf(el), 6) * 70;
      if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------------------
     Current-section navigation
     ------------------------------------------------------------------------ */

  function initSectionNav() {
    var links = $$(".nav__link[href^='#']");
    if (!links.length || typeof IntersectionObserver !== "function") return;

    var byId = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = byId[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach(function (other) {
              other.removeAttribute("aria-current");
            });
            link.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach(function (section) {
      io.observe(section);
    });
  }

  /* ---------------------------------------------------------------------------
     Shop filters
     ------------------------------------------------------------------------ */

  function initFilters() {
    var chips = $$("[data-filter]");
    var products = $$("[data-category]");
    var status = $("[data-filter-status]");
    if (!chips.length || !products.length) return;

    function apply(value) {
      var shown = 0;
      products.forEach(function (product) {
        var match = value === "all" || product.dataset.category === value;
        product.hidden = !match;
        if (match) shown++;
      });

      chips.forEach(function (chip) {
        chip.setAttribute("aria-pressed", String(chip.dataset.filter === value));
      });

      if (status) {
        status.textContent =
          shown + (shown === 1 ? " piece" : " pieces") +
          (value === "all" ? " in the collection" : " in " + value);
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        apply(chip.dataset.filter);
      });
    });

    apply("all");
  }

  /* ---------------------------------------------------------------------------
     Toasts
     ------------------------------------------------------------------------ */

  function toast(message, iconName) {
    var region = $(".toast-region");
    if (!region) return;

    while (region.children.length >= 3) region.removeChild(region.firstElementChild);

    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = window.DS ? DS.icon(iconName || "check") : "";
    el.appendChild(document.createTextNode(message));
    region.appendChild(el);

    setTimeout(function () {
      el.setAttribute("data-leaving", "");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 240);
    }, 3000);
  }

  /* ---------------------------------------------------------------------------
     Basket
     ------------------------------------------------------------------------ */

  function initBasket() {
    var counter = $("[data-basket-count]");
    var count = parseInt(read(STORE.basket), 10);
    if (isNaN(count) || count < 0) count = 0;

    function paint(bump) {
      if (!counter) return;
      counter.textContent = String(count);
      counter.classList.toggle("is-live", count > 0);
      var label = count === 1 ? "1 item in basket" : count + " items in basket";
      var trigger = counter.closest("button, a");
      if (trigger) trigger.setAttribute("aria-label", "Basket, " + label);

      if (bump) {
        counter.classList.remove("is-bump");
        void counter.offsetWidth; // restart the animation
        counter.classList.add("is-bump");
      }
    }

    paint(false);

    $$("[data-add]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        count++;
        write(STORE.basket, String(count));
        paint(true);
        toast("Added " + (button.dataset.add || "item") + " to your basket", "check");
      });
    });
  }

  /* ---------------------------------------------------------------------------
     FAQ — one answer open at a time
     ------------------------------------------------------------------------ */

  function initFaq() {
    var items = $$(".faq__item");
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ---------------------------------------------------------------------------
     Signup
     ------------------------------------------------------------------------ */

  function initSignup() {
    var form = $("[data-signup]");
    if (!form) return;

    var input = $("input[type='email']", form);
    var note = $("[data-signup-note]", form);

    function say(message, state) {
      if (!note) return;
      note.textContent = message;
      note.setAttribute("data-state", state);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = (input.value || "").trim();

      if (!value) {
        say("Pop your email in first.", "error");
        input.focus();
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        say("That address doesn't look quite right.", "error");
        input.focus();
        return;
      }

      say("You're on the list — see you at the next drop.", "ok");
      toast("Thanks! Check your inbox to confirm", "mail");
      form.reset();
    });

    if (input) {
      input.addEventListener("input", function () {
        if (note && note.getAttribute("data-state") === "error") say("", "");
      });
    }
  }

  /* ---------------------------------------------------------------------------
     Odds and ends
     ------------------------------------------------------------------------ */

  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* Placeholder links should feel considered rather than broken. */
  function initStubLinks() {
    document.addEventListener("click", function (event) {
      var stub = event.target.closest("[data-stub]");
      if (!stub) return;
      event.preventDefault();
      toast(stub.dataset.stub || "Coming soon", "yarn");
    });
  }

  /* ---------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */

  function boot() {
    initTheme();
    initHeader();
    initDrawer();
    initReveal();
    initSectionNav();
    initFilters();
    initBasket();
    initFaq();
    initSignup();
    initYear();
    initStubLinks();
  }

  if (window.DS && typeof DS.ready === "function") {
    DS.ready(boot);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
