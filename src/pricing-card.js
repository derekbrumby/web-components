/**
 * @file pricing-card.js
 * @version 1.0.0
 *
 * Commerce-focused pricing card web component with slots for descriptive
 * content and a CTA link. The surface is fully themable through CSS custom
 * properties and `::part` selectors, making it easy to blend into product and
 * marketing pages without additional dependencies.
 */

(() => {
  if (customElements.get('wc-pricing-card')) {
    return;
  }

  /**
   * Upgrade properties that might have been set before the element definition registered.
   *
   * @param {HTMLElement & Record<string, unknown>} element
   * @param {string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = element[property];
      delete element[property];
      element[property] = value;
    }
  };

  let nextId = 0;

  /**
   * Highlight a pricing plan with a built-in CTA and feature list.
   */
  class WcPricingCard extends HTMLElement {
    static get observedAttributes() {
      return ['plan', 'price', 'period', 'cta-label', 'href', 'recommended', 'badge-label'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLElement} */
    #container;
    /** @type {HTMLHeadingElement} */
    #titleEl;
    /** @type {HTMLSpanElement} */
    #amountEl;
    /** @type {HTMLSpanElement} */
    #periodEl;
    /** @type {HTMLAnchorElement} */
    #ctaEl;
    /** @type {HTMLDivElement} */
    #badgeEl;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-pricing-card-background: rgba(248, 250, 252, 0.9);
            --wc-pricing-card-border: rgba(148, 163, 184, 0.35);
            --wc-pricing-card-radius: 1.5rem;
            --wc-pricing-card-shadow: 0 32px 64px -36px rgba(15, 23, 42, 0.35);
            --wc-pricing-card-accent: #2563eb;
            --wc-pricing-card-foreground: #0f172a;
            --wc-pricing-card-muted: #475569;
            --wc-pricing-card-feature-icon: #22c55e;
            display: block;
            color: inherit;
          }

          :host([hidden]) {
            display: none !important;
          }

          article {
            position: relative;
            display: grid;
            gap: 1.5rem;
            padding: 2rem;
            border-radius: var(--wc-pricing-card-radius);
            background: var(--wc-pricing-card-background);
            border: 1px solid var(--wc-pricing-card-border);
            box-shadow: var(--wc-pricing-card-shadow);
            color: var(--wc-pricing-card-foreground);
            overflow: hidden;
          }

          :host([recommended]) article {
            border-color: rgba(37, 99, 235, 0.45);
            box-shadow: 0 40px 80px -48px rgba(37, 99, 235, 0.55);
          }

          .badge {
            position: absolute;
            top: 1.25rem;
            right: 1.25rem;
            padding: 0.35rem 0.75rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: rgba(37, 99, 235, 0.12);
            color: var(--wc-pricing-card-accent);
            border: 1px solid rgba(37, 99, 235, 0.2);
          }

          header {
            display: grid;
            gap: 0.5rem;
          }

          .eyebrow {
            margin: 0;
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--wc-pricing-card-accent);
          }

          h3 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--wc-pricing-card-foreground);
          }

          .description {
            margin: 0;
            color: var(--wc-pricing-card-muted);
            line-height: 1.6;
          }

          .price {
            display: flex;
            align-items: baseline;
            gap: 0.4rem;
            font-variant-numeric: tabular-nums;
          }

          .amount {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--wc-pricing-card-foreground);
          }

          .period {
            color: var(--wc-pricing-card-muted);
            font-size: 1rem;
          }

          ul {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 0.75rem;
          }

          ::slotted(li) {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: start;
            gap: 0.75rem;
            font-size: 0.95rem;
            color: var(--wc-pricing-card-foreground);
          }

          ::slotted(li)::before {
            content: '';
            inline-size: 0.75rem;
            block-size: 0.75rem;
            margin-top: 0.25rem;
            border-radius: 999px;
            background: var(--wc-pricing-card-feature-icon);
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
          }

          a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.85rem 1.5rem;
            border-radius: 999px;
            font-weight: 600;
            text-decoration: none;
            background: linear-gradient(135deg, var(--wc-pricing-card-accent), #7c3aed);
            color: #f8fafc;
            transition: transform 150ms ease, box-shadow 150ms ease;
          }

          a:focus-visible {
            outline: 3px solid rgba(37, 99, 235, 0.5);
            outline-offset: 4px;
          }

          a:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 32px -24px rgba(37, 99, 235, 0.65);
          }

          a:active {
            transform: translateY(0);
            box-shadow: none;
          }

          @media (max-width: 640px) {
            article {
              padding: 1.5rem;
            }

            .amount {
              font-size: 2.15rem;
            }
          }
        </style>
        <article part="container">
          <div class="badge" part="badge" hidden></div>
          <header part="header">
            <p class="eyebrow" part="eyebrow"><slot name="eyebrow">For growing teams</slot></p>
            <h3 part="title"></h3>
            <p class="description" part="description">
              <slot name="description">Unlock automation, analytics, and unlimited collaborators.</slot>
            </p>
          </header>
          <div class="price" part="price">
            <span class="amount" part="amount"></span>
            <span class="period" part="period"></span>
          </div>
          <ul class="features" part="features">
            <slot>
              <li>Unlimited projects and environments</li>
              <li>Priority support with a two-hour response time</li>
              <li>Advanced security controls and SSO</li>
            </slot>
          </ul>
          <a class="cta" part="cta" href="#"></a>
        </article>
      `;

      this.#container = this.#root.querySelector('article');
      this.#titleEl = this.#root.querySelector('h3');
      this.#amountEl = this.#root.querySelector('.amount');
      this.#periodEl = this.#root.querySelector('.period');
      this.#ctaEl = this.#root.querySelector('a');
      this.#badgeEl = this.#root.querySelector('.badge');

      const titleId = `wc-pricing-card-title-${++nextId}`;
      this.#titleEl.id = titleId;
      this.#container.setAttribute('aria-labelledby', titleId);
    }

    connectedCallback() {
      upgradeProperty(this, 'plan');
      upgradeProperty(this, 'price');
      upgradeProperty(this, 'period');
      upgradeProperty(this, 'ctaLabel');
      upgradeProperty(this, 'href');
      upgradeProperty(this, 'recommended');
      upgradeProperty(this, 'badgeLabel');

      this.#syncPlan();
      this.#syncPrice();
      this.#syncPeriod();
      this.#syncCta();
      this.#syncHref();
      this.#syncRecommended();
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'plan':
          this.#syncPlan();
          break;
        case 'price':
          this.#syncPrice();
          break;
        case 'period':
          this.#syncPeriod();
          break;
        case 'cta-label':
          this.#syncCta();
          break;
        case 'href':
          this.#syncHref();
          break;
        case 'recommended':
        case 'badge-label':
          this.#syncRecommended();
          break;
        default:
          break;
      }
    }

    /**
     * Display name of the plan.
     */
    get plan() {
      return this.getAttribute('plan') ?? 'Scale';
    }

    set plan(value) {
      if (value == null) {
        this.removeAttribute('plan');
      } else {
        this.setAttribute('plan', value);
      }
    }

    /**
     * Price string, e.g. `$49`.
     */
    get price() {
      return this.getAttribute('price') ?? '$49';
    }

    set price(value) {
      if (value == null) {
        this.removeAttribute('price');
      } else {
        this.setAttribute('price', value);
      }
    }

    /**
     * Billing cadence text appended to the price.
     */
    get period() {
      return this.getAttribute('period') ?? '/month';
    }

    set period(value) {
      if (value == null) {
        this.removeAttribute('period');
      } else {
        this.setAttribute('period', value);
      }
    }

    /**
     * Text for the call-to-action control.
     */
    get ctaLabel() {
      return this.getAttribute('cta-label') ?? 'Start free trial';
    }

    set ctaLabel(value) {
      if (value == null) {
        this.removeAttribute('cta-label');
      } else {
        this.setAttribute('cta-label', value);
      }
    }

    /**
     * Destination URL for the CTA link.
     */
    get href() {
      return this.getAttribute('href') ?? '#';
    }

    set href(value) {
      if (value == null) {
        this.removeAttribute('href');
      } else {
        this.setAttribute('href', value);
      }
    }

    /**
     * Whether the plan is recommended.
     */
    get recommended() {
      return this.hasAttribute('recommended');
    }

    set recommended(value) {
      if (value) {
        this.setAttribute('recommended', '');
      } else {
        this.removeAttribute('recommended');
      }
    }

    /**
     * Text displayed inside the recommendation badge.
     */
    get badgeLabel() {
      return this.getAttribute('badge-label') ?? 'Recommended';
    }

    set badgeLabel(value) {
      if (value == null) {
        this.removeAttribute('badge-label');
      } else {
        this.setAttribute('badge-label', value);
      }
    }

    #syncPlan() {
      this.#titleEl.textContent = this.plan;
    }

    #syncPrice() {
      this.#amountEl.textContent = this.price;
    }

    #syncPeriod() {
      this.#periodEl.textContent = this.period;
    }

    #syncCta() {
      this.#ctaEl.textContent = this.ctaLabel;
    }

    #syncHref() {
      this.#ctaEl.href = this.href;
    }

    #syncRecommended() {
      const isRecommended = this.recommended;
      this.#badgeEl.hidden = !isRecommended;
      this.#badgeEl.textContent = this.badgeLabel;
      if (isRecommended) {
        this.setAttribute('aria-current', 'true');
      } else {
        this.removeAttribute('aria-current');
      }
    }
  }

  customElements.define('wc-pricing-card', WcPricingCard);
})();
