/* =============================================================================
   <image-slot> — art-directed image placeholder

   A slot holds the shape of an image before there is an image. Give it a ratio
   and a label and it renders a crochet-stitch swatch at exactly the size the
   real photograph will occupy, so layout never shifts when art lands. Set
   `src` and it swaps to a real <img>; if that image fails to load it falls
   back to the swatch rather than collapsing.

   Attributes
     src       image URL. Omit for a placeholder.
     alt       alt text. Required whenever src is set; "" marks it decorative.
     ratio     aspect ratio, e.g. "4/5", "1", "16/9". Default "4/5".
     label     caption drawn on the placeholder. Falls back to alt.
     tone      clay | sage | wheat | blush | ink. Default clay.
     fit       cover | contain. Default cover.
     position  object-position value, e.g. "top", "50% 20%".

   Colours are mixed from the page's own palette tokens, so a slot follows the
   active theme without being told about it.
   ========================================================================== */

(function () {
  "use strict";

  var TEMPLATE = document.createElement("template");
  TEMPLATE.innerHTML = [
    "<style>",
    ":host{",
    "  --slot-seed: var(--clay-500, #c4562f);",
    "  --slot-ground: var(--bg-sunk, #f2e9dc);",
    "  --slot-bg: color-mix(in srgb, var(--slot-seed) 13%, var(--slot-ground));",
    "  --slot-ink: color-mix(in srgb, var(--slot-seed) 40%, var(--slot-ground));",
    // Weighted towards the page's own foreground so pale tones (wheat, blush)
    // keep their contrast instead of dissolving into the swatch.
    "  --slot-text: color-mix(in srgb, var(--slot-seed) 26%, var(--fg, #12100e));",
    "  display: block;",
    "  position: relative;",
    "  overflow: hidden;",
    "  aspect-ratio: 4 / 5;",
    "  background: var(--slot-bg);",
    "}",
    ':host([tone="sage"]){ --slot-seed: var(--sage-500, #6b7f6a); }',
    ':host([tone="wheat"]){ --slot-seed: var(--wheat-400, #dfc79a); }',
    ':host([tone="blush"]){ --slot-seed: var(--blush-400, #e7b7ae); }',
    ':host([tone="ink"]){ --slot-seed: var(--ink-500, #5a504a); }',
    ":host([hidden]){ display: none; }",
    "img{",
    "  inline-size: 100%;",
    "  block-size: 100%;",
    "  object-fit: cover;",
    "  object-position: center;",
    "  display: block;",
    "}",
    ':host([fit="contain"]) img{ object-fit: contain; }',
    ".ph{",
    "  position: absolute;",
    "  inset: 0;",
    "  display: grid;",
    "  place-items: center;",
    "  padding: 1rem;",
    "}",
    ".weave{",
    "  position: absolute;",
    "  inset: 0;",
    "  inline-size: 100%;",
    "  block-size: 100%;",
    "  color: var(--slot-ink);",
    "  opacity: 0.85;",
    "}",
    ".label{",
    "  position: relative;",
    "  max-inline-size: 90%;",
    "  padding: 0.45rem 0.85rem;",
    "  border-radius: 2px;",
    "  background: color-mix(in srgb, var(--slot-bg) 78%, transparent);",
    "  color: var(--slot-text);",
    "  font-family: var(--font-sans, system-ui, sans-serif);",
    "  font-size: 0.6875rem;",
    "  font-weight: 700;",
    "  letter-spacing: 0.16em;",
    "  line-height: 1.35;",
    "  text-align: center;",
    "  text-transform: uppercase;",
    "  -webkit-backdrop-filter: blur(2px);",
    "  backdrop-filter: blur(2px);",
    "}",
    ".label:empty{ display: none; }",
    "</style>"
  ].join("\n");

  // V-stitch fabric: two offset chevron rows read as rows of crochet.
  var WEAVE = [
    '<svg class="weave" aria-hidden="true" preserveAspectRatio="xMidYMid slice">',
    "<defs>",
    '<pattern id="stitch" width="32" height="17" patternUnits="userSpaceOnUse">',
    '<path d="M-8 17 L0 3 L8 17 L16 3 L24 17 L32 3 L40 17" fill="none" ',
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    '<circle cx="8" cy="16" r="1.15" fill="currentColor"/>',
    '<circle cx="24" cy="16" r="1.15" fill="currentColor"/>',
    "</pattern>",
    "</defs>",
    '<rect width="100%" height="100%" fill="url(#stitch)"/>',
    "</svg>"
  ].join("");

  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ["src", "alt", "ratio", "label", "fit", "position"];
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
      this.body = document.createElement("div");
      this.shadowRoot.appendChild(this.body);
    }

    connectedCallback() {
      this.applyRatio();
      this.render();
    }

    attributeChangedCallback(name) {
      if (name === "src") this.failed = false; // a new URL deserves a fresh try
      if (!this.isConnected) return;
      if (name === "ratio") this.applyRatio();
      else this.render();
    }

    applyRatio() {
      var ratio = (this.getAttribute("ratio") || "").trim();
      this.style.aspectRatio = ratio ? ratio.replace("/", " / ") : "";
    }

    render() {
      var src = this.getAttribute("src");

      if (src && !this.failed) {
        var img = this.body.querySelector("img");
        if (!img) {
          this.body.innerHTML = "";
          img = document.createElement("img");
          img.loading = "lazy";
          img.decoding = "async";
          img.addEventListener("error", () => {
            this.failed = true;
            this.render();
          });
          this.body.appendChild(img);
        }
        img.src = src;
        img.alt = this.getAttribute("alt") || "";
        img.style.objectPosition = this.getAttribute("position") || "";
        if (this.getAttribute("role") === "presentation") this.removeAttribute("role");
        return;
      }

      var caption = this.getAttribute("label");
      if (caption === null) caption = this.getAttribute("alt") || "";

      this.body.innerHTML =
        '<div class="ph">' + WEAVE + '<span class="label"></span></div>';
      this.body.querySelector(".label").textContent = caption;

      // A slot with no photograph carries no information a reader needs.
      if (!this.hasAttribute("role")) this.setAttribute("role", "presentation");
    }
  }

  if ("customElements" in window && !customElements.get("image-slot")) {
    customElements.define("image-slot", ImageSlot);
  }
})();
