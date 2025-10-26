/**
 * @file sonner.js
 * @version 1.0.0
 *
 * Opinionated toast notification web component inspired by the Sonner React library.
 * The element renders a fixed viewport that queues toast messages, exposes typed
 * helpers (success, info, warning, error, loading) and supports promise tracking
 * similar to `toast.promise`.
 *
 * Usage:
 * ```html
 * <script type="module" src="https://cdn.example.com/web-components/sonner.js"></script>
 *
 * <wc-sonner id="toaster" position="bottom-right"></wc-sonner>
 * <button id="trigger" type="button">Show toast</button>
 *
 * <script type="module">
 *   const toaster = document.getElementById('toaster');
 *   document.getElementById('trigger')?.addEventListener('click', () => {
 *     toaster.toast('Event has been created', {
 *       description: 'Sunday, December 03, 2023 at 9:00 AM',
 *       action: {
 *         label: 'Undo',
 *         onClick: () => console.log('Undo'),
 *       },
 *     });
 *   });
 * </script>
 * ```
 */

(() => {
  if (customElements.get('wc-sonner')) {
    return;
  }

  const ICON_NAMESPACE = 'http://www.w3.org/2000/svg';

  const VALID_POSITIONS = new Set([
    'top-left',
    'top-right',
    'top-center',
    'bottom-left',
    'bottom-right',
    'bottom-center',
  ]);

  const DEFAULT_DURATION = 4000;

  /**
   * @typedef {'default' | 'success' | 'info' | 'warning' | 'error' | 'loading'} SonnerToastType
   */

  /**
   * @typedef {Object} SonnerToastAction
   * @property {string} label - Accessible label rendered on the action button.
   * @property {() => void} [onClick] - Callback invoked when the action is activated.
   */

  /**
   * @typedef {Object} SonnerToastOptions
   * @property {string} [description] - Optional helper text displayed under the title.
   * @property {number} [duration] - Override the auto-dismiss duration (ms). Use `Infinity` to persist.
   * @property {SonnerToastAction | null} [action] - Action button configuration.
   * @property {boolean} [dismissible] - When false the close affordance is hidden.
   * @property {string} [label] - Custom accessible label announced with the toast.
   */

  /**
   * @typedef {Object} SonnerToastRecord
   * @property {string} id
   * @property {string} title
   * @property {string} description
   * @property {SonnerToastType} type
   * @property {number} duration
   * @property {boolean} dismissible
   * @property {SonnerToastAction | null} action
   * @property {string} ariaLabel
   */

  /**
   * @param {HTMLElement} element
   * @param {keyof HTMLElement} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = /** @type {any} */ (element)[property];
      delete /** @type {any} */ (element)[property];
      /** @type {any} */ (element)[property] = value;
    }
  };

  /**
   * @param {unknown} value
   * @param {number} fallback
   */
  const numberOr = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  /**
   * @param {SonnerToastType} type
   */
  const createIcon = (type) => {
    const svg = document.createElementNS(ICON_NAMESPACE, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('sonner-icon');
    const path = document.createElementNS(ICON_NAMESPACE, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '1.75');

    switch (type) {
      case 'success':
        path.setAttribute('d', 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
        break;
      case 'info':
        path.setAttribute('d', 'M12 8h.01M11 12h1v4h1m7-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
        break;
      case 'warning':
        path.setAttribute('d', 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z');
        break;
      case 'error':
        path.setAttribute('d', 'm15 9-6 6m0-6 6 6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
        break;
      case 'loading': {
        path.setAttribute('d', 'M21 12a9 9 0 1 1-9-9');
        path.classList.add('sonner-icon--spinner');
        break;
      }
      default:
        path.setAttribute('d', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z');
        break;
    }

    svg.append(path);
    return svg;
  };

  class WcSonner extends HTMLElement {
    static get observedAttributes() {
      return ['position', 'duration', 'close-on-click'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLDivElement} */
    #viewport;
    /** @type {Map<string, SonnerToastRecord>} */
    #toasts = new Map();
    /** @type {Map<string, number>} */
    #timers = new Map();
    /** @type {number} */
    #sequence = 0;

    /**
     * Bound toast helper mirroring Sonner's API.
     * @type {(title: string, options?: SonnerToastOptions) => string} & {
     *   success: (title: string, options?: SonnerToastOptions) => string;
     *   info: (title: string, options?: SonnerToastOptions) => string;
     *   warning: (title: string, options?: SonnerToastOptions) => string;
     *   error: (title: string, options?: SonnerToastOptions) => string;
     *   loading: (title: string, options?: SonnerToastOptions) => string;
     *   promise: <T>(factory: (() => Promise<T>) | Promise<T>, messages: {
     *     loading: string;
     *     success: string | ((value: T) => string);
     *     error: string | ((reason: unknown) => string);
     *   }) => Promise<T>;
     *   dismiss: (id?: string) => void;
     * }
     */
    toast;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --sonner-z-index: 9999;
            --sonner-gap: 1rem;
            --sonner-max-width: min(360px, calc(100vw - 2rem));
            --sonner-radius: 0.875rem;
            --sonner-font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            --sonner-color: var(--normal-text, rgb(15 23 42));
            --sonner-background: var(--normal-bg, rgb(248 250 252));
            --sonner-border: var(--normal-border, rgba(148, 163, 184, 0.35));
            --sonner-shadow: 0 24px 60px -30px rgba(15, 23, 42, 0.35);
            --sonner-success: hsl(142 76% 36%);
            --sonner-info: hsl(217 91% 60%);
            --sonner-warning: hsl(36 93% 55%);
            --sonner-error: hsl(0 84% 60%);
            --sonner-loading: hsl(215 20% 65%);
            display: contents;
          }

          .sonner-viewport {
            position: fixed;
            inset-inline: auto;
            inset-block: auto;
            z-index: var(--sonner-z-index);
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            pointer-events: none;
            max-inline-size: var(--sonner-max-width);
          }

          :host([position='top-left']) .sonner-viewport {
            inset-block-start: var(--sonner-gap);
            inset-inline-start: var(--sonner-gap);
            align-items: flex-start;
          }

          :host([position='top-right']) .sonner-viewport,
          :host(:not([position])) .sonner-viewport {
            inset-block-start: var(--sonner-gap);
            inset-inline-end: var(--sonner-gap);
            align-items: flex-end;
          }

          :host([position='top-center']) .sonner-viewport {
            inset-block-start: var(--sonner-gap);
            inset-inline: 0;
            margin-inline: auto;
            align-items: center;
          }

          :host([position='bottom-left']) .sonner-viewport {
            inset-block-end: var(--sonner-gap);
            inset-inline-start: var(--sonner-gap);
            align-items: flex-start;
          }

          :host([position='bottom-right']) .sonner-viewport {
            inset-block-end: var(--sonner-gap);
            inset-inline-end: var(--sonner-gap);
            align-items: flex-end;
          }

          :host([position='bottom-center']) .sonner-viewport {
            inset-block-end: var(--sonner-gap);
            inset-inline: 0;
            margin-inline: auto;
            align-items: center;
          }

          .sonner-toast {
            pointer-events: auto;
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 0.75rem;
            border-radius: var(--sonner-radius);
            padding: 0.85rem 1rem;
            color: var(--sonner-color);
            background: var(--sonner-background);
            border: 1px solid var(--sonner-border);
            box-shadow: var(--sonner-shadow);
            font-family: var(--sonner-font-family);
            backdrop-filter: blur(12px);
            transition: transform 150ms ease, opacity 150ms ease;
          }

          .sonner-toast[data-state='enter'] {
            opacity: 0;
            transform: translateY(12px);
          }

          .sonner-toast[data-state='ready'] {
            opacity: 1;
            transform: translateY(0);
          }

          .sonner-toast[data-state='exit'] {
            opacity: 0;
            transform: translateY(-12px);
          }

          :host([position^='bottom']) .sonner-toast[data-state='enter'] {
            transform: translateY(-12px);
          }

          :host([position^='bottom']) .sonner-toast[data-state='exit'] {
            transform: translateY(12px);
          }

          .sonner-icon {
            inline-size: 1.25rem;
            block-size: 1.25rem;
            align-self: center;
          }

          .sonner-icon--spinner {
            stroke-dasharray: 44;
            animation: sonner-spin 0.75s linear infinite;
          }

          @keyframes sonner-spin {
            from {
              stroke-dashoffset: 44;
            }
            to {
              stroke-dashoffset: 0;
              transform: rotate(360deg);
            }
          }

          .sonner-toast[data-type='success'] .sonner-icon {
            color: var(--sonner-success);
          }

          .sonner-toast[data-type='info'] .sonner-icon {
            color: var(--sonner-info);
          }

          .sonner-toast[data-type='warning'] .sonner-icon {
            color: var(--sonner-warning);
          }

          .sonner-toast[data-type='error'] .sonner-icon {
            color: var(--sonner-error);
          }

          .sonner-toast[data-type='loading'] .sonner-icon {
            color: var(--sonner-loading);
          }

          .sonner-body {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            min-inline-size: 12rem;
          }

          .sonner-title {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 600;
            letter-spacing: -0.01em;
          }

          .sonner-description {
            margin: 0;
            font-size: 0.85rem;
            color: color-mix(in srgb, var(--sonner-color) 75%, transparent);
          }

          .sonner-actions {
            display: grid;
            gap: 0.35rem;
            align-content: start;
          }

          .sonner-button {
            appearance: none;
            border: none;
            font: inherit;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            background: color-mix(in srgb, var(--sonner-color) 12%, transparent);
            color: inherit;
            cursor: pointer;
            transition: background 120ms ease, transform 120ms ease;
          }

          .sonner-button:hover,
          .sonner-button:focus-visible {
            background: color-mix(in srgb, var(--sonner-color) 18%, transparent);
          }

          .sonner-button:focus-visible {
            outline: 2px solid color-mix(in srgb, var(--sonner-color) 35%, transparent);
            outline-offset: 2px;
          }

          .sonner-button--close {
            inline-size: 2rem;
            block-size: 2rem;
            border-radius: 999px;
          }

          .sonner-sr-only {
            position: absolute;
            inline-size: 1px;
            block-size: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
          }

          @media (prefers-reduced-motion: reduce) {
            .sonner-toast {
              transition: none;
            }
          }
        </style>
        <div class="sonner-viewport" role="region" aria-live="polite" aria-label="Notifications"></div>
      `;

      const viewport = this.#root.querySelector('.sonner-viewport');
      if (!viewport) {
        throw new Error('wc-sonner failed to initialise viewport');
      }
      this.#viewport = viewport;
      this.#viewport.setAttribute('part', 'viewport');
      this.toast = this.#createToastFunction();
    }

    connectedCallback() {
      upgradeProperty(this, 'position');
      upgradeProperty(this, 'duration');
      upgradeProperty(this, 'closeOnClick');

      if (!VALID_POSITIONS.has(this.position)) {
        this.position = 'top-right';
      }
    }

    /**
     * Preferred position for the toast viewport.
     * @returns {'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center'}
     */
    get position() {
      const value = this.getAttribute('position');
      return value && VALID_POSITIONS.has(value) ? value : 'top-right';
    }

    set position(value) {
      if (!value) {
        this.removeAttribute('position');
        return;
      }
      const normalised = VALID_POSITIONS.has(value) ? value : 'top-right';
      this.setAttribute('position', normalised);
    }

    /**
     * Default dismissal duration for toasts in milliseconds.
     * @returns {number}
     */
    get duration() {
      return numberOr(this.getAttribute('duration'), DEFAULT_DURATION);
    }

    set duration(value) {
      if (value == null || Number.isNaN(Number(value))) {
        this.removeAttribute('duration');
        return;
      }
      this.setAttribute('duration', String(Math.max(0, Number(value))));
    }

    /**
     * When true the toast dismisses when the body is clicked.
     * @returns {boolean}
     */
    get closeOnClick() {
      return this.hasAttribute('close-on-click');
    }

    set closeOnClick(value) {
      if (value) {
        this.setAttribute('close-on-click', '');
      } else {
        this.removeAttribute('close-on-click');
      }
    }

    /**
     * Show a toast notification.
     * @param {SonnerToastType} type
     * @param {string} title
     * @param {SonnerToastOptions} [options]
     */
    #enqueueToast(type, title, options = {}) {
      const id = `wc-sonner-${++this.#sequence}`;
      const description = options.description ? String(options.description) : '';
      const action = options.action ?? null;
      const dismissible = options.dismissible ?? type !== 'loading';
      const ariaLabel = options.label ? String(options.label) : title;
      const duration = numberOr(options.duration ?? (type === 'loading' ? Infinity : this.duration),
        type === 'loading' ? Infinity : this.duration);

      /** @type {SonnerToastRecord} */
      const record = {
        id,
        title: String(title ?? ''),
        description,
        type,
        duration,
        dismissible,
        action,
        ariaLabel,
      };

      this.#toasts.set(id, record);
      this.#render();
      this.#startTimer(record);

      this.dispatchEvent(
        new CustomEvent('wc-sonner-open', {
          detail: { id, record },
        })
      );

      return id;
    }

    /**
     * @param {string} id
     * @param {Partial<SonnerToastRecord>} patch
     */
    #updateToast(id, patch) {
      const record = this.#toasts.get(id);
      if (!record) {
        return;
      }

      const merged = { ...record, ...patch };
      this.#toasts.set(id, merged);

      this.#render();
      this.#restartTimer(merged);
    }

    /**
     * Dismiss a toast.
     * @param {string} [id]
     * @param {'manual' | 'timeout' | 'action' | 'click'} [reason]
     */
    dismiss(id, reason = 'manual') {
      if (typeof id === 'undefined') {
        [...this.#toasts.keys()].forEach((key) => this.dismiss(key, reason));
        return;
      }

      const record = this.#toasts.get(id);
      if (!record) {
        return;
      }

      const timer = this.#timers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.#timers.delete(id);
      }

      this.#toasts.delete(id);
      this.#render();

      this.dispatchEvent(
        new CustomEvent('wc-sonner-dismiss', {
          detail: { id, reason, record },
        })
      );
    }

    /**
     * @param {SonnerToastRecord} record
     */
    #startTimer(record) {
      if (record.duration === Infinity) {
        return;
      }

      const timer = window.setTimeout(() => {
        this.dismiss(record.id, 'timeout');
      }, record.duration);
      this.#timers.set(record.id, timer);
    }

    /**
     * @param {SonnerToastRecord} record
     */
    #restartTimer(record) {
      const existing = this.#timers.get(record.id);
      if (existing) {
        clearTimeout(existing);
        this.#timers.delete(record.id);
      }
      this.#startTimer(record);
    }

    /**
     * Build the toast helper object.
     */
    #createToastFunction() {
      const show = (title, options) => this.#enqueueToast('default', title, options);
      show.success = (title, options) => this.#enqueueToast('success', title, options);
      show.info = (title, options) => this.#enqueueToast('info', title, options);
      show.warning = (title, options) => this.#enqueueToast('warning', title, options);
      show.error = (title, options) => this.#enqueueToast('error', title, options);
      show.loading = (title, options) =>
        this.#enqueueToast('loading', title, { ...options, duration: Infinity, dismissible: false });
      show.dismiss = (id) => this.dismiss(id, 'manual');

      show.promise = (factory, messages) => {
        const loading = messages?.loading ?? 'Loading…';
        const id = this.#enqueueToast('loading', loading, {
          duration: Infinity,
          dismissible: false,
          label: loading,
        });

        const resolveFactory = typeof factory === 'function' ? factory : () => factory;

        return Promise.resolve()
          .then(() => resolveFactory())
          .then((value) => {
            const successMessage = messages?.success;
            const title =
              typeof successMessage === 'function'
                ? successMessage(value)
                : successMessage || 'Completed';
            this.#updateToast(id, {
              type: 'success',
              title,
              description: '',
              duration: this.duration,
              dismissible: true,
            });
            return value;
          })
          .catch((error) => {
            const errorMessage = messages?.error;
            const title =
              typeof errorMessage === 'function'
                ? errorMessage(error)
                : errorMessage || 'Something went wrong';
            this.#updateToast(id, {
              type: 'error',
              title,
              description: '',
              duration: this.duration,
              dismissible: true,
            });
            throw error;
          });
      };

      return show;
    }

    /**
     * Render all toasts inside the viewport.
     */
    #render() {
      if (!this.#viewport) {
        return;
      }

      const fragment = document.createDocumentFragment();

      for (const record of this.#toasts.values()) {
        const toast = document.createElement('article');
        toast.className = 'sonner-toast';
        toast.setAttribute('role', record.type === 'error' || record.type === 'warning' ? 'alert' : 'status');
        toast.dataset.type = record.type;
        toast.dataset.state = 'ready';
        toast.setAttribute('aria-label', record.ariaLabel);
        toast.setAttribute('part', 'toast');

        const icon = createIcon(record.type);
        icon.setAttribute('part', 'icon');
        toast.append(icon);

        const body = document.createElement('div');
        body.className = 'sonner-body';
        body.setAttribute('part', 'body');

        const title = document.createElement('p');
        title.className = 'sonner-title';
        title.textContent = record.title;
        title.setAttribute('part', 'title');
        body.append(title);

        if (record.description) {
          const description = document.createElement('p');
          description.className = 'sonner-description';
          description.textContent = record.description;
          description.setAttribute('part', 'description');
          body.append(description);
        }

        toast.append(body);

        const actions = document.createElement('div');
        actions.className = 'sonner-actions';
        actions.setAttribute('part', 'actions');

        if (record.action?.label) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'sonner-button';
          button.textContent = record.action.label;
          button.setAttribute('part', 'action-button');
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            try {
              record.action?.onClick?.();
            } finally {
              this.dispatchEvent(
                new CustomEvent('wc-sonner-action', {
                  detail: { id: record.id, record },
                })
              );
              this.dismiss(record.id, 'action');
            }
          });
          actions.append(button);
        }

        if (record.dismissible) {
          const close = document.createElement('button');
          close.type = 'button';
          close.className = 'sonner-button sonner-button--close';
          close.innerHTML =
            '<span aria-hidden="true">×</span><span class="sonner-sr-only">Dismiss notification</span>';
          close.setAttribute('part', 'close-button');
          close.addEventListener('click', (event) => {
            event.stopPropagation();
            this.dismiss(record.id, 'manual');
          });
          actions.append(close);
        }

        if (actions.childElementCount > 0) {
          toast.append(actions);
        }

        toast.addEventListener('click', (event) => {
          if (!this.closeOnClick) {
            return;
          }
          const target = event.target;
          if (target instanceof Element && target.closest('button')) {
            return;
          }
          this.dismiss(record.id, 'click');
        });

        fragment.append(toast);
      }

      this.#viewport.replaceChildren(fragment);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) {
        return;
      }

      if (name === 'position' && newValue && !VALID_POSITIONS.has(newValue)) {
        this.position = 'top-right';
      }

      if (name === 'duration') {
        const duration = this.duration;
        for (const record of this.#toasts.values()) {
          if (record.type !== 'loading' && record.duration === numberOr(oldValue, DEFAULT_DURATION)) {
            this.#updateToast(record.id, { duration });
          }
        }
      }
    }
  }

  customElements.define('wc-sonner', WcSonner);
})();

