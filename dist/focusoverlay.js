(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('core-js/modules/es6.object.assign'), require('core-js/modules/es7.array.includes'), require('core-js/modules/es6.string.includes'), require('core-js/modules/es6.function.name')) :
  typeof define === 'function' && define.amd ? define(['core-js/modules/es6.object.assign', 'core-js/modules/es7.array.includes', 'core-js/modules/es6.string.includes', 'core-js/modules/es6.function.name'], factory) :
  (global = global || self, global.FocusOverlay = factory());
}(this, function () { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
  ((function () {
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }

    if (!Element.prototype.closest) {
      Element.prototype.closest = function (s) {
        var el = this;

        do {
          if (el.matches(s)) return el;
          el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);

        return null;
      };
    }
  })());

  function extend() {
    var obj,
        name,
        copy,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length;

    for (; i < length; i++) {
      if ((obj = arguments[i]) !== null) {
        for (name in obj) {
          copy = obj[name];

          if (target === copy) {
            continue;
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }

    return target;
  }

  // https://stackoverflow.com/a/32623832/8862005
  function absolutePosition(el) {
    var found,
        left = 0,
        top = 0,
        width = 0,
        height = 0,
        offsetBase = absolutePosition.offsetBase;

    if (!offsetBase && document.body) {
      offsetBase = absolutePosition.offsetBase = document.createElement('div');
      offsetBase.style.cssText = 'position:absolute;left:0;top:0';
      document.body.appendChild(offsetBase);
    }

    if (el && el.ownerDocument === document && 'getBoundingClientRect' in el && offsetBase) {
      var boundingRect = el.getBoundingClientRect();
      var baseRect = offsetBase.getBoundingClientRect();
      found = true;
      left = boundingRect.left - baseRect.left;
      top = boundingRect.top - baseRect.top;
      width = boundingRect.right - boundingRect.left;
      height = boundingRect.bottom - boundingRect.top;
    }

    return {
      found: found,
      left: left,
      top: top,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height
    };
  }

  /**
   * Cross browser transitionEnd event
   * https://davidwalsh.name/css-animation-callback
   * @return {String} Browser's supported transitionend type
   */
  function whichTransitionEvent () {
    var el = document.createElement('fakeelement');
    var transitions = {
      transition: 'transitionend',
      OTransition: 'oTransitionEnd',
      MozTransition: 'transitionend',
      WebkitTransition: 'webkitTransitionEnd'
    };

    for (var t in transitions) {
      if (el.style[t] !== undefined) {
        return transitions[t];
      }
    }
  }

  /**
   * The plugin constructor
   * @param {Element|String} element The DOM element where plugin is applied
   * @param {Object} options Options passed to the constructor
   */

  var FocusOverlay =
  /*#__PURE__*/
  function () {
    function FocusOverlay(element, options) {
      _classCallCheck(this, FocusOverlay);

      this.active = false;
      this.scopedEl;
      this.focusBox;
      this.previousTarget;
      this.nextTarget;
      this.timeout = 0;
      this.inScope = false;
      this.transitionEvent = whichTransitionEvent();
      this.options = extend({
        // Class added to the focus box
        class: 'focus-overlay',
        // Class added while the focus box is active
        activeClass: 'focus-overlay-active',
        // Class added while the focus box is animating
        animatingClass: 'focus-overlay-animating',
        // Class added to the target element
        targetClass: 'focus-overlay-target',
        // z-index of focus box
        zIndex: 9001,
        // Duration of the animatingClass (milliseconds)
        duration: 500,
        // Removes activeClass after duration
        inactiveAfterDuration: false,
        // Tab, Arrow Keys, Enter, Space, Shift, Ctrl, Alt, ESC
        triggerKeys: [9, 36, 37, 38, 39, 40, 13, 32, 16, 17, 18, 27],
        // Make focus box inactive when a non specified key is pressed
        inactiveOnNonTriggerKey: true,
        // Make focus box inactive when a user clicks
        inactiveOnClick: true,
        // Force the box to always stay active. Overrides everything
        alwaysActive: false,
        // Reposition focus box on transitionEnd for focused elements
        watchTransitionEnd: true,
        // Initialization event
        onInit: function onInit() {},
        // Before focus box move
        onBeforeMove: function onBeforeMove() {},
        // After focus box move
        onAfterMove: function onAfterMove() {},
        // After FocusOverlay is destroyed
        onDestroy: function onDestroy() {}
      }, options || {});
      /**
       * Setup main scoped element. First expect a DOM element, then
       * fallback to a string querySelector, and finally fallback to <body>
       */

      if (element instanceof Element) {
        this.scopedEl = element;
      } else if (typeof element === 'string' || element instanceof String) {
        this.scopedEl = document.querySelector(element);
      } else {
        this.scopedEl = document.querySelector('body');
      } // Binding


      this.onKeyDownHandler = this.onKeyDownHandler.bind(this);
      this.onFocusHandler = this.onFocusHandler.bind(this);
      this.moveFocusBox = this.moveFocusBox.bind(this);
      this.stop = this.stop.bind(this); // Initialize

      this.init();
    }
    /**
     * Initialize the plugin instance. Add event listeners
     * to the window depending on which options are enabled.
     */


    _createClass(FocusOverlay, [{
      key: "init",
      value: function init() {
        if (this.options.alwaysActive) {
          this.active = true;
          window.addEventListener('focusin', this.onFocusHandler, true);
        } else {
          window.addEventListener('keydown', this.onKeyDownHandler, false);

          if (this.options.inactiveOnClick) {
            window.addEventListener('mousedown', this.stop, false);
          }
        }

        this._createFocusBox();

        this.options.onInit(this);
      }
      /**
       * Handler method for the keydown event
       * @param {Event}
       */

    }, {
      key: "onKeyDownHandler",
      value: function onKeyDownHandler(e) {
        var _this = this;

        var code = e.which; // Checks if the key pressed is in the triggerKeys array

        if (this.options.triggerKeys.includes(code)) {
          if (this.active === false) {
            this.active = true;
            window.addEventListener('focusin', this.onFocusHandler, true);
          }
          /**
           * Iframes don't trigger a focus event so I hacked this check in there.
           * Slight delay on the setTimeout for cross browser reasons.
           * See https://stackoverflow.com/a/28932220/8862005
           */


          setTimeout(function () {
            var activeEl = document.activeElement;
            /**
             * Check if the active element is an iframe, is part of
             * the scope, and that focusOverlay is currently active.
             */

            if (activeEl instanceof HTMLIFrameElement && _this.scopedEl.contains(activeEl) && _this.active === true) {
              _this.moveFocusBox(activeEl);
            }
          }, 5);
        } else if (this.options.inactiveOnNonTriggerKey) {
          this.stop();
        }
      }
      /**
       * Creates the focusBox DIV element and appends itself to the DOM
       */

    }, {
      key: "_createFocusBox",
      value: function _createFocusBox() {
        this.focusBox = document.createElement('div');
        this.focusBox.setAttribute('aria-hidden', 'true');
        this.focusBox.classList.add(this.options.class);
        Object.assign(this.focusBox.style, {
          position: 'absolute',
          zIndex: this.options.zIndex,
          pointerEvents: 'none'
        });
        this.scopedEl.insertAdjacentElement('beforeend', this.focusBox);
      }
      /**
       * Cleanup method that runs whenever variables,
       * methods, etc. needs to be refreshed.
       */

    }, {
      key: "_cleanup",
      value: function _cleanup() {
        // Remove previous target's classes and event listeners
        if (this.nextTarget != null) {
          this.previousTarget = this.nextTarget;
          this.previousTarget.classList.remove(this.options.targetClass);
          this.previousTarget.removeEventListener(this.transitionEvent, this.moveFocusBox);
        }
      }
      /**
       * Handler method for the focus event
       * @param {Event}
       */

    }, {
      key: "onFocusHandler",
      value: function onFocusHandler(e) {
        var focusedEl = e.target;

        this._cleanup(); // If the focused element is a child of the main element


        if (this.scopedEl.contains(focusedEl)) {
          // Variable to be added to onBeforeMove event later
          var currentEl = this.nextTarget;
          this.inScope = true; // If the focused element has data-focus then assign a new $target

          if (focusedEl.getAttribute('data-focus') !== null) {
            var focusSelector = focusedEl.getAttribute('data-focus');
            this.nextTarget = document.querySelector("[data-focus='".concat(focusSelector, "']")); // If the focused element has data-focus-label then focus the associated label
          } else if (focusedEl.getAttribute('data-focus-label') !== null) {
            var associatedEl = document.querySelector("[for='".concat(focusedEl.id, "']")); // If there is no label pointing directly to the focused element, then point to the wrapping label

            if (associatedEl === null) {
              associatedEl = focusedEl.closest('label');
            }

            this.nextTarget = associatedEl; // If the focused element has data-ignore then stop
          } else if (focusedEl.getAttribute('data-focus-ignore') !== null) {
            return; // If none of the above is true then set the target as the currently focused element
          } else {
            this.nextTarget = focusedEl;
          }
          /**
           * Clear the timeout of the duration just in case if the
           * user focuses a new element before the timer runs out.
           */


          clearTimeout(this.timeout);
          /**
           * If transitionEnd is supported and watchTransitionEnd is enabled
           * add a check to make the focusBox recalculate its position
           * if the focused element has a long transition on focus.
           */

          if (this.transitionEvent && this.options.watchTransitionEnd) {
            this.nextTarget.addEventListener(this.transitionEvent, this.moveFocusBox);
          }

          this.options.onBeforeMove(currentEl, this.nextTarget, this);
          this.moveFocusBox(this.nextTarget); // If the focused element is a child of the main element but alwaysActive do nothing
        } else if (this.options.alwaysActive) {
          this.inScope = false; // If the element focused is not a child of the main element stop being active
        } else {
          this.inScope = false;
          this.stop();
        }
      }
      /**
       * Ends the active state of the focusBox
       */

    }, {
      key: "stop",
      value: function stop() {
        this.active = false;
        window.removeEventListener('focusin', this.onFocusHandler, true);

        this._cleanup();

        this.focusBox.classList.remove(this.options.activeClass);
      }
      /**
       * Moves the focusBox to a target element
       * @param {Element|Event} targetEl
       */

    }, {
      key: "moveFocusBox",
      value: function moveFocusBox(targetEl) {
        var _this2 = this;

        // When passed as a handler we'll get the event target
        if (targetEl instanceof Event) targetEl = document.activeElement; // Marking current element as being targeted

        targetEl.classList.add(this.options.targetClass);
        /**
         * Check to see if what we're targeting is actually still there.
         * Then check to see if we're targeting a DOM element. There was
         * an IE issue with the document and window sometimes being targeted
         * and throwing errors since you can't get the position values of those.
         */

        if (document.body.contains(targetEl) && targetEl instanceof Element) {
          var rect = absolutePosition(targetEl);
          var width = "".concat(rect.width, "px");
          var height = "".concat(rect.height, "px");
          var left = "".concat(rect.left, "px");
          var top = "".concat(rect.top, "px");
          this.focusBox.classList.add(this.options.animatingClass);
          this.focusBox.classList.add(this.options.activeClass);
          Object.assign(this.focusBox.style, {
            width: width,
            height: height,
            left: left,
            top: top
          }); // Remove animating/active class after the duration ends.

          this.timeout = setTimeout(function () {
            _this2.focusBox.classList.remove(_this2.options.animatingClass);

            if (_this2.options.inactiveAfterDuration) {
              _this2.focusBox.classList.remove(_this2.options.activeClass);
            }

            _this2.options.onAfterMove(_this2.previousTarget, targetEl, _this2);
          }, this.options.duration);
        } else {
          this._cleanup();
        }
      }
      /**
       * The destroy method to free resources used by the plugin:
       * References, unregister listeners, etc.
       */

    }, {
      key: "destroy",
      value: function destroy() {
        // Remove focusBox
        this.focusBox.parentNode.removeChild(this.focusBox); // Remove any extra classes given to other elements if they exist

        this.previousTarget != null && this.previousTarget.classList.remove(this.options.targetClass);
        this.nextTarget != null && this.nextTarget.classList.remove(this.options.targetClass); // Remove event listeners

        window.removeEventListener('focusin', this.onFocusHandler, true);
        window.removeEventListener('keydown', this.onKeyDownHandler, false);
        window.removeEventListener('mousedown', this.stop, false);
        this.options.onDestroy(this);
      }
    }]);

    return FocusOverlay;
  }();

  return FocusOverlay;

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXNvdmVybGF5LmpzIiwic291cmNlcyI6WyIuLi9zcmMvcG9seWZpbGxzL2Nsb3Nlc3QuanMiLCIuLi9zcmMvdXRpbHMvZXh0ZW5kLmpzIiwiLi4vc3JjL3V0aWxzL2Fic29sdXRlUG9zaXRpb24uanMiLCIuLi9zcmMvdXRpbHMvd2hpY2hUcmFuc2l0aW9uRXZlbnQuanMiLCIuLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvY2xvc2VzdCNQb2x5ZmlsbFxuZXhwb3J0IGRlZmF1bHQgKGZ1bmN0aW9uKCkge1xuICBpZiAoIUVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMpIHtcbiAgICBFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzID1cbiAgICAgIEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICBFbGVtZW50LnByb3RvdHlwZS53ZWJraXRNYXRjaGVzU2VsZWN0b3I7XG4gIH1cblxuICBpZiAoIUVsZW1lbnQucHJvdG90eXBlLmNsb3Nlc3QpIHtcbiAgICBFbGVtZW50LnByb3RvdHlwZS5jbG9zZXN0ID0gZnVuY3Rpb24ocykge1xuICAgICAgdmFyIGVsID0gdGhpcztcblxuICAgICAgZG8ge1xuICAgICAgICBpZiAoZWwubWF0Y2hlcyhzKSkgcmV0dXJuIGVsO1xuICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQgfHwgZWwucGFyZW50Tm9kZTtcbiAgICAgIH0gd2hpbGUgKGVsICE9PSBudWxsICYmIGVsLm5vZGVUeXBlID09PSAxKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gIH1cbn0pKCk7XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBleHRlbmQoKSB7XG4gIHZhciBvYmosXG4gICAgbmFtZSxcbiAgICBjb3B5LFxuICAgIHRhcmdldCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICBpID0gMSxcbiAgICBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuXG4gIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKG9iaiA9IGFyZ3VtZW50c1tpXSkgIT09IG51bGwpIHtcbiAgICAgIGZvciAobmFtZSBpbiBvYmopIHtcbiAgICAgICAgY29weSA9IG9ialtuYW1lXTtcblxuICAgICAgICBpZiAodGFyZ2V0ID09PSBjb3B5KSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoY29weSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGFyZ2V0W25hbWVdID0gY29weTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuIiwiLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzMyNjIzODMyLzg4NjIwMDVcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGFic29sdXRlUG9zaXRpb24oZWwpIHtcbiAgdmFyIGZvdW5kLFxuICAgIGxlZnQgPSAwLFxuICAgIHRvcCA9IDAsXG4gICAgd2lkdGggPSAwLFxuICAgIGhlaWdodCA9IDAsXG4gICAgb2Zmc2V0QmFzZSA9IGFic29sdXRlUG9zaXRpb24ub2Zmc2V0QmFzZTtcbiAgaWYgKCFvZmZzZXRCYXNlICYmIGRvY3VtZW50LmJvZHkpIHtcbiAgICBvZmZzZXRCYXNlID0gYWJzb2x1dGVQb3NpdGlvbi5vZmZzZXRCYXNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgb2Zmc2V0QmFzZS5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MDt0b3A6MCc7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvZmZzZXRCYXNlKTtcbiAgfVxuICBpZiAoXG4gICAgZWwgJiZcbiAgICBlbC5vd25lckRvY3VtZW50ID09PSBkb2N1bWVudCAmJlxuICAgICdnZXRCb3VuZGluZ0NsaWVudFJlY3QnIGluIGVsICYmXG4gICAgb2Zmc2V0QmFzZVxuICApIHtcbiAgICB2YXIgYm91bmRpbmdSZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIGJhc2VSZWN0ID0gb2Zmc2V0QmFzZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBmb3VuZCA9IHRydWU7XG4gICAgbGVmdCA9IGJvdW5kaW5nUmVjdC5sZWZ0IC0gYmFzZVJlY3QubGVmdDtcbiAgICB0b3AgPSBib3VuZGluZ1JlY3QudG9wIC0gYmFzZVJlY3QudG9wO1xuICAgIHdpZHRoID0gYm91bmRpbmdSZWN0LnJpZ2h0IC0gYm91bmRpbmdSZWN0LmxlZnQ7XG4gICAgaGVpZ2h0ID0gYm91bmRpbmdSZWN0LmJvdHRvbSAtIGJvdW5kaW5nUmVjdC50b3A7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBmb3VuZDogZm91bmQsXG4gICAgbGVmdDogbGVmdCxcbiAgICB0b3A6IHRvcCxcbiAgICB3aWR0aDogd2lkdGgsXG4gICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgcmlnaHQ6IGxlZnQgKyB3aWR0aCxcbiAgICBib3R0b206IHRvcCArIGhlaWdodFxuICB9O1xufVxuIiwiLyoqXG4gKiBDcm9zcyBicm93c2VyIHRyYW5zaXRpb25FbmQgZXZlbnRcbiAqIGh0dHBzOi8vZGF2aWR3YWxzaC5uYW1lL2Nzcy1hbmltYXRpb24tY2FsbGJhY2tcbiAqIEByZXR1cm4ge1N0cmluZ30gQnJvd3NlcidzIHN1cHBvcnRlZCB0cmFuc2l0aW9uZW5kIHR5cGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKSB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZmFrZWVsZW1lbnQnKTtcbiAgY29uc3QgdHJhbnNpdGlvbnMgPSB7XG4gICAgdHJhbnNpdGlvbjogJ3RyYW5zaXRpb25lbmQnLFxuICAgIE9UcmFuc2l0aW9uOiAnb1RyYW5zaXRpb25FbmQnLFxuICAgIE1velRyYW5zaXRpb246ICd0cmFuc2l0aW9uZW5kJyxcbiAgICBXZWJraXRUcmFuc2l0aW9uOiAnd2Via2l0VHJhbnNpdGlvbkVuZCdcbiAgfTtcblxuICBmb3IgKGxldCB0IGluIHRyYW5zaXRpb25zKSB7XG4gICAgaWYgKGVsLnN0eWxlW3RdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uc1t0XTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCAnLi9zdHlsZXMuY3NzJztcbmltcG9ydCAnLi9wb2x5ZmlsbHMvY2xvc2VzdCc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJy4vdXRpbHMvZXh0ZW5kJztcbmltcG9ydCBhYnNvbHV0ZVBvc2l0aW9uIGZyb20gJy4vdXRpbHMvYWJzb2x1dGVQb3NpdGlvbic7XG5pbXBvcnQgd2hpY2hUcmFuc2l0aW9uRXZlbnQgZnJvbSAnLi91dGlscy93aGljaFRyYW5zaXRpb25FdmVudCc7XG5cbi8qKlxuICogVGhlIHBsdWdpbiBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtFbGVtZW50fFN0cmluZ30gZWxlbWVudCBUaGUgRE9NIGVsZW1lbnQgd2hlcmUgcGx1Z2luIGlzIGFwcGxpZWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE9wdGlvbnMgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvclxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGb2N1c092ZXJsYXkge1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICB0aGlzLnNjb3BlZEVsO1xuICAgIHRoaXMuZm9jdXNCb3g7XG4gICAgdGhpcy5wcmV2aW91c1RhcmdldDtcbiAgICB0aGlzLm5leHRUYXJnZXQ7XG4gICAgdGhpcy50aW1lb3V0ID0gMDtcbiAgICB0aGlzLmluU2NvcGUgPSBmYWxzZTtcbiAgICB0aGlzLnRyYW5zaXRpb25FdmVudCA9IHdoaWNoVHJhbnNpdGlvbkV2ZW50KCk7XG4gICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKFxuICAgICAge1xuICAgICAgICAvLyBDbGFzcyBhZGRlZCB0byB0aGUgZm9jdXMgYm94XG4gICAgICAgIGNsYXNzOiAnZm9jdXMtb3ZlcmxheScsXG4gICAgICAgIC8vIENsYXNzIGFkZGVkIHdoaWxlIHRoZSBmb2N1cyBib3ggaXMgYWN0aXZlXG4gICAgICAgIGFjdGl2ZUNsYXNzOiAnZm9jdXMtb3ZlcmxheS1hY3RpdmUnLFxuICAgICAgICAvLyBDbGFzcyBhZGRlZCB3aGlsZSB0aGUgZm9jdXMgYm94IGlzIGFuaW1hdGluZ1xuICAgICAgICBhbmltYXRpbmdDbGFzczogJ2ZvY3VzLW92ZXJsYXktYW5pbWF0aW5nJyxcbiAgICAgICAgLy8gQ2xhc3MgYWRkZWQgdG8gdGhlIHRhcmdldCBlbGVtZW50XG4gICAgICAgIHRhcmdldENsYXNzOiAnZm9jdXMtb3ZlcmxheS10YXJnZXQnLFxuICAgICAgICAvLyB6LWluZGV4IG9mIGZvY3VzIGJveFxuICAgICAgICB6SW5kZXg6IDkwMDEsXG4gICAgICAgIC8vIER1cmF0aW9uIG9mIHRoZSBhbmltYXRpbmdDbGFzcyAobWlsbGlzZWNvbmRzKVxuICAgICAgICBkdXJhdGlvbjogNTAwLFxuICAgICAgICAvLyBSZW1vdmVzIGFjdGl2ZUNsYXNzIGFmdGVyIGR1cmF0aW9uXG4gICAgICAgIGluYWN0aXZlQWZ0ZXJEdXJhdGlvbjogZmFsc2UsXG4gICAgICAgIC8vIFRhYiwgQXJyb3cgS2V5cywgRW50ZXIsIFNwYWNlLCBTaGlmdCwgQ3RybCwgQWx0LCBFU0NcbiAgICAgICAgdHJpZ2dlcktleXM6IFs5LCAzNiwgMzcsIDM4LCAzOSwgNDAsIDEzLCAzMiwgMTYsIDE3LCAxOCwgMjddLFxuICAgICAgICAvLyBNYWtlIGZvY3VzIGJveCBpbmFjdGl2ZSB3aGVuIGEgbm9uIHNwZWNpZmllZCBrZXkgaXMgcHJlc3NlZFxuICAgICAgICBpbmFjdGl2ZU9uTm9uVHJpZ2dlcktleTogdHJ1ZSxcbiAgICAgICAgLy8gTWFrZSBmb2N1cyBib3ggaW5hY3RpdmUgd2hlbiBhIHVzZXIgY2xpY2tzXG4gICAgICAgIGluYWN0aXZlT25DbGljazogdHJ1ZSxcbiAgICAgICAgLy8gRm9yY2UgdGhlIGJveCB0byBhbHdheXMgc3RheSBhY3RpdmUuIE92ZXJyaWRlcyBldmVyeXRoaW5nXG4gICAgICAgIGFsd2F5c0FjdGl2ZTogZmFsc2UsXG4gICAgICAgIC8vIFJlcG9zaXRpb24gZm9jdXMgYm94IG9uIHRyYW5zaXRpb25FbmQgZm9yIGZvY3VzZWQgZWxlbWVudHNcbiAgICAgICAgd2F0Y2hUcmFuc2l0aW9uRW5kOiB0cnVlLFxuICAgICAgICAvLyBJbml0aWFsaXphdGlvbiBldmVudFxuICAgICAgICBvbkluaXQ6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIC8vIEJlZm9yZSBmb2N1cyBib3ggbW92ZVxuICAgICAgICBvbkJlZm9yZU1vdmU6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIC8vIEFmdGVyIGZvY3VzIGJveCBtb3ZlXG4gICAgICAgIG9uQWZ0ZXJNb3ZlOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAvLyBBZnRlciBGb2N1c092ZXJsYXkgaXMgZGVzdHJveWVkXG4gICAgICAgIG9uRGVzdHJveTogZnVuY3Rpb24oKSB7fVxuICAgICAgfSxcbiAgICAgIG9wdGlvbnMgfHwge31cbiAgICApO1xuXG4gICAgLyoqXG4gICAgICogU2V0dXAgbWFpbiBzY29wZWQgZWxlbWVudC4gRmlyc3QgZXhwZWN0IGEgRE9NIGVsZW1lbnQsIHRoZW5cbiAgICAgKiBmYWxsYmFjayB0byBhIHN0cmluZyBxdWVyeVNlbGVjdG9yLCBhbmQgZmluYWxseSBmYWxsYmFjayB0byA8Ym9keT5cbiAgICAgKi9cbiAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuc2NvcGVkRWwgPSBlbGVtZW50O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnIHx8IGVsZW1lbnQgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgIHRoaXMuc2NvcGVkRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNjb3BlZEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuICAgIH1cblxuICAgIC8vIEJpbmRpbmdcbiAgICB0aGlzLm9uS2V5RG93bkhhbmRsZXIgPSB0aGlzLm9uS2V5RG93bkhhbmRsZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uRm9jdXNIYW5kbGVyID0gdGhpcy5vbkZvY3VzSGFuZGxlci5iaW5kKHRoaXMpO1xuICAgIHRoaXMubW92ZUZvY3VzQm94ID0gdGhpcy5tb3ZlRm9jdXNCb3guYmluZCh0aGlzKTtcbiAgICB0aGlzLnN0b3AgPSB0aGlzLnN0b3AuYmluZCh0aGlzKTtcblxuICAgIC8vIEluaXRpYWxpemVcbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBwbHVnaW4gaW5zdGFuY2UuIEFkZCBldmVudCBsaXN0ZW5lcnNcbiAgICogdG8gdGhlIHdpbmRvdyBkZXBlbmRpbmcgb24gd2hpY2ggb3B0aW9ucyBhcmUgZW5hYmxlZC5cbiAgICovXG4gIGluaXQoKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbHdheXNBY3RpdmUpIHtcbiAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1c2luJywgdGhpcy5vbkZvY3VzSGFuZGxlciwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd25IYW5kbGVyLCBmYWxzZSk7XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW5hY3RpdmVPbkNsaWNrKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLnN0b3AsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9jcmVhdGVGb2N1c0JveCgpO1xuICAgIHRoaXMub3B0aW9ucy5vbkluaXQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlciBtZXRob2QgZm9yIHRoZSBrZXlkb3duIGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9XG4gICAqL1xuICBvbktleURvd25IYW5kbGVyKGUpIHtcbiAgICBjb25zdCBjb2RlID0gZS53aGljaDtcblxuICAgIC8vIENoZWNrcyBpZiB0aGUga2V5IHByZXNzZWQgaXMgaW4gdGhlIHRyaWdnZXJLZXlzIGFycmF5XG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmlnZ2VyS2V5cy5pbmNsdWRlcyhjb2RlKSkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBmYWxzZSkge1xuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1c2luJywgdGhpcy5vbkZvY3VzSGFuZGxlciwgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogSWZyYW1lcyBkb24ndCB0cmlnZ2VyIGEgZm9jdXMgZXZlbnQgc28gSSBoYWNrZWQgdGhpcyBjaGVjayBpbiB0aGVyZS5cbiAgICAgICAqIFNsaWdodCBkZWxheSBvbiB0aGUgc2V0VGltZW91dCBmb3IgY3Jvc3MgYnJvd3NlciByZWFzb25zLlxuICAgICAgICogU2VlIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yODkzMjIyMC84ODYyMDA1XG4gICAgICAgKi9cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjb25zdCBhY3RpdmVFbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIGlmIHRoZSBhY3RpdmUgZWxlbWVudCBpcyBhbiBpZnJhbWUsIGlzIHBhcnQgb2ZcbiAgICAgICAgICogdGhlIHNjb3BlLCBhbmQgdGhhdCBmb2N1c092ZXJsYXkgaXMgY3VycmVudGx5IGFjdGl2ZS5cbiAgICAgICAgICovXG4gICAgICAgIGlmIChcbiAgICAgICAgICBhY3RpdmVFbCBpbnN0YW5jZW9mIEhUTUxJRnJhbWVFbGVtZW50ICYmXG4gICAgICAgICAgdGhpcy5zY29wZWRFbC5jb250YWlucyhhY3RpdmVFbCkgJiZcbiAgICAgICAgICB0aGlzLmFjdGl2ZSA9PT0gdHJ1ZVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLm1vdmVGb2N1c0JveChhY3RpdmVFbCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmluYWN0aXZlT25Ob25UcmlnZ2VyS2V5KSB7XG4gICAgICB0aGlzLnN0b3AoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgZm9jdXNCb3ggRElWIGVsZW1lbnQgYW5kIGFwcGVuZHMgaXRzZWxmIHRvIHRoZSBET01cbiAgICovXG4gIF9jcmVhdGVGb2N1c0JveCgpIHtcbiAgICB0aGlzLmZvY3VzQm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5mb2N1c0JveC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICB0aGlzLmZvY3VzQm94LmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmNsYXNzKTtcblxuICAgIE9iamVjdC5hc3NpZ24odGhpcy5mb2N1c0JveC5zdHlsZSwge1xuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICB6SW5kZXg6IHRoaXMub3B0aW9ucy56SW5kZXgsXG4gICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZSdcbiAgICB9KTtcblxuICAgIHRoaXMuc2NvcGVkRWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KCdiZWZvcmVlbmQnLCB0aGlzLmZvY3VzQm94KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnVwIG1ldGhvZCB0aGF0IHJ1bnMgd2hlbmV2ZXIgdmFyaWFibGVzLFxuICAgKiBtZXRob2RzLCBldGMuIG5lZWRzIHRvIGJlIHJlZnJlc2hlZC5cbiAgICovXG4gIF9jbGVhbnVwKCkge1xuICAgIC8vIFJlbW92ZSBwcmV2aW91cyB0YXJnZXQncyBjbGFzc2VzIGFuZCBldmVudCBsaXN0ZW5lcnNcbiAgICBpZiAodGhpcy5uZXh0VGFyZ2V0ICE9IG51bGwpIHtcbiAgICAgIHRoaXMucHJldmlvdXNUYXJnZXQgPSB0aGlzLm5leHRUYXJnZXQ7XG4gICAgICB0aGlzLnByZXZpb3VzVGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5vcHRpb25zLnRhcmdldENsYXNzKTtcbiAgICAgIHRoaXMucHJldmlvdXNUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uRXZlbnQsXG4gICAgICAgIHRoaXMubW92ZUZvY3VzQm94XG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVyIG1ldGhvZCBmb3IgdGhlIGZvY3VzIGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9XG4gICAqL1xuICBvbkZvY3VzSGFuZGxlcihlKSB7XG4gICAgY29uc3QgZm9jdXNlZEVsID0gZS50YXJnZXQ7XG5cbiAgICB0aGlzLl9jbGVhbnVwKCk7XG5cbiAgICAvLyBJZiB0aGUgZm9jdXNlZCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgdGhlIG1haW4gZWxlbWVudFxuICAgIGlmICh0aGlzLnNjb3BlZEVsLmNvbnRhaW5zKGZvY3VzZWRFbCkpIHtcbiAgICAgIC8vIFZhcmlhYmxlIHRvIGJlIGFkZGVkIHRvIG9uQmVmb3JlTW92ZSBldmVudCBsYXRlclxuICAgICAgY29uc3QgY3VycmVudEVsID0gdGhpcy5uZXh0VGFyZ2V0O1xuXG4gICAgICB0aGlzLmluU2NvcGUgPSB0cnVlO1xuXG4gICAgICAvLyBJZiB0aGUgZm9jdXNlZCBlbGVtZW50IGhhcyBkYXRhLWZvY3VzIHRoZW4gYXNzaWduIGEgbmV3ICR0YXJnZXRcbiAgICAgIGlmIChmb2N1c2VkRWwuZ2V0QXR0cmlidXRlKCdkYXRhLWZvY3VzJykgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgZm9jdXNTZWxlY3RvciA9IGZvY3VzZWRFbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtZm9jdXMnKTtcblxuICAgICAgICB0aGlzLm5leHRUYXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgIGBbZGF0YS1mb2N1cz0nJHtmb2N1c1NlbGVjdG9yfSddYFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIElmIHRoZSBmb2N1c2VkIGVsZW1lbnQgaGFzIGRhdGEtZm9jdXMtbGFiZWwgdGhlbiBmb2N1cyB0aGUgYXNzb2NpYXRlZCBsYWJlbFxuICAgICAgfSBlbHNlIGlmIChmb2N1c2VkRWwuZ2V0QXR0cmlidXRlKCdkYXRhLWZvY3VzLWxhYmVsJykgIT09IG51bGwpIHtcbiAgICAgICAgbGV0IGFzc29jaWF0ZWRFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtmb3I9JyR7Zm9jdXNlZEVsLmlkfSddYCk7XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gbGFiZWwgcG9pbnRpbmcgZGlyZWN0bHkgdG8gdGhlIGZvY3VzZWQgZWxlbWVudCwgdGhlbiBwb2ludCB0byB0aGUgd3JhcHBpbmcgbGFiZWxcbiAgICAgICAgaWYgKGFzc29jaWF0ZWRFbCA9PT0gbnVsbCkge1xuICAgICAgICAgIGFzc29jaWF0ZWRFbCA9IGZvY3VzZWRFbC5jbG9zZXN0KCdsYWJlbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5uZXh0VGFyZ2V0ID0gYXNzb2NpYXRlZEVsO1xuXG4gICAgICAgIC8vIElmIHRoZSBmb2N1c2VkIGVsZW1lbnQgaGFzIGRhdGEtaWdub3JlIHRoZW4gc3RvcFxuICAgICAgfSBlbHNlIGlmIChmb2N1c2VkRWwuZ2V0QXR0cmlidXRlKCdkYXRhLWZvY3VzLWlnbm9yZScpICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyBJZiBub25lIG9mIHRoZSBhYm92ZSBpcyB0cnVlIHRoZW4gc2V0IHRoZSB0YXJnZXQgYXMgdGhlIGN1cnJlbnRseSBmb2N1c2VkIGVsZW1lbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubmV4dFRhcmdldCA9IGZvY3VzZWRFbDtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBDbGVhciB0aGUgdGltZW91dCBvZiB0aGUgZHVyYXRpb24ganVzdCBpbiBjYXNlIGlmIHRoZVxuICAgICAgICogdXNlciBmb2N1c2VzIGEgbmV3IGVsZW1lbnQgYmVmb3JlIHRoZSB0aW1lciBydW5zIG91dC5cbiAgICAgICAqL1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG5cbiAgICAgIC8qKlxuICAgICAgICogSWYgdHJhbnNpdGlvbkVuZCBpcyBzdXBwb3J0ZWQgYW5kIHdhdGNoVHJhbnNpdGlvbkVuZCBpcyBlbmFibGVkXG4gICAgICAgKiBhZGQgYSBjaGVjayB0byBtYWtlIHRoZSBmb2N1c0JveCByZWNhbGN1bGF0ZSBpdHMgcG9zaXRpb25cbiAgICAgICAqIGlmIHRoZSBmb2N1c2VkIGVsZW1lbnQgaGFzIGEgbG9uZyB0cmFuc2l0aW9uIG9uIGZvY3VzLlxuICAgICAgICovXG4gICAgICBpZiAodGhpcy50cmFuc2l0aW9uRXZlbnQgJiYgdGhpcy5vcHRpb25zLndhdGNoVHJhbnNpdGlvbkVuZCkge1xuICAgICAgICB0aGlzLm5leHRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLnRyYW5zaXRpb25FdmVudCxcbiAgICAgICAgICB0aGlzLm1vdmVGb2N1c0JveFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm9wdGlvbnMub25CZWZvcmVNb3ZlKGN1cnJlbnRFbCwgdGhpcy5uZXh0VGFyZ2V0LCB0aGlzKTtcbiAgICAgIHRoaXMubW92ZUZvY3VzQm94KHRoaXMubmV4dFRhcmdldCk7XG5cbiAgICAgIC8vIElmIHRoZSBmb2N1c2VkIGVsZW1lbnQgaXMgYSBjaGlsZCBvZiB0aGUgbWFpbiBlbGVtZW50IGJ1dCBhbHdheXNBY3RpdmUgZG8gbm90aGluZ1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmFsd2F5c0FjdGl2ZSkge1xuICAgICAgdGhpcy5pblNjb3BlID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGZvY3VzZWQgaXMgbm90IGEgY2hpbGQgb2YgdGhlIG1haW4gZWxlbWVudCBzdG9wIGJlaW5nIGFjdGl2ZVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmluU2NvcGUgPSBmYWxzZTtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbmRzIHRoZSBhY3RpdmUgc3RhdGUgb2YgdGhlIGZvY3VzQm94XG4gICAqL1xuICBzdG9wKCkge1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzaW4nLCB0aGlzLm9uRm9jdXNIYW5kbGVyLCB0cnVlKTtcbiAgICB0aGlzLl9jbGVhbnVwKCk7XG4gICAgdGhpcy5mb2N1c0JveC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gIH1cblxuICAvKipcbiAgICogTW92ZXMgdGhlIGZvY3VzQm94IHRvIGEgdGFyZ2V0IGVsZW1lbnRcbiAgICogQHBhcmFtIHtFbGVtZW50fEV2ZW50fSB0YXJnZXRFbFxuICAgKi9cbiAgbW92ZUZvY3VzQm94KHRhcmdldEVsKSB7XG4gICAgLy8gV2hlbiBwYXNzZWQgYXMgYSBoYW5kbGVyIHdlJ2xsIGdldCB0aGUgZXZlbnQgdGFyZ2V0XG4gICAgaWYgKHRhcmdldEVsIGluc3RhbmNlb2YgRXZlbnQpIHRhcmdldEVsID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblxuICAgIC8vIE1hcmtpbmcgY3VycmVudCBlbGVtZW50IGFzIGJlaW5nIHRhcmdldGVkXG4gICAgdGFyZ2V0RWwuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMudGFyZ2V0Q2xhc3MpO1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgdG8gc2VlIGlmIHdoYXQgd2UncmUgdGFyZ2V0aW5nIGlzIGFjdHVhbGx5IHN0aWxsIHRoZXJlLlxuICAgICAqIFRoZW4gY2hlY2sgdG8gc2VlIGlmIHdlJ3JlIHRhcmdldGluZyBhIERPTSBlbGVtZW50LiBUaGVyZSB3YXNcbiAgICAgKiBhbiBJRSBpc3N1ZSB3aXRoIHRoZSBkb2N1bWVudCBhbmQgd2luZG93IHNvbWV0aW1lcyBiZWluZyB0YXJnZXRlZFxuICAgICAqIGFuZCB0aHJvd2luZyBlcnJvcnMgc2luY2UgeW91IGNhbid0IGdldCB0aGUgcG9zaXRpb24gdmFsdWVzIG9mIHRob3NlLlxuICAgICAqL1xuICAgIGlmIChkb2N1bWVudC5ib2R5LmNvbnRhaW5zKHRhcmdldEVsKSAmJiB0YXJnZXRFbCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHJlY3QgPSBhYnNvbHV0ZVBvc2l0aW9uKHRhcmdldEVsKTtcbiAgICAgIGNvbnN0IHdpZHRoID0gYCR7cmVjdC53aWR0aH1weGA7XG4gICAgICBjb25zdCBoZWlnaHQgPSBgJHtyZWN0LmhlaWdodH1weGA7XG4gICAgICBjb25zdCBsZWZ0ID0gYCR7cmVjdC5sZWZ0fXB4YDtcbiAgICAgIGNvbnN0IHRvcCA9IGAke3JlY3QudG9wfXB4YDtcblxuICAgICAgdGhpcy5mb2N1c0JveC5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5hbmltYXRpbmdDbGFzcyk7XG4gICAgICB0aGlzLmZvY3VzQm94LmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcblxuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLmZvY3VzQm94LnN0eWxlLCB7XG4gICAgICAgIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIGxlZnQsXG4gICAgICAgIHRvcFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlbW92ZSBhbmltYXRpbmcvYWN0aXZlIGNsYXNzIGFmdGVyIHRoZSBkdXJhdGlvbiBlbmRzLlxuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZm9jdXNCb3guY2xhc3NMaXN0LnJlbW92ZSh0aGlzLm9wdGlvbnMuYW5pbWF0aW5nQ2xhc3MpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW5hY3RpdmVBZnRlckR1cmF0aW9uKSB7XG4gICAgICAgICAgdGhpcy5mb2N1c0JveC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdGlvbnMub25BZnRlck1vdmUodGhpcy5wcmV2aW91c1RhcmdldCwgdGFyZ2V0RWwsIHRoaXMpO1xuICAgICAgfSwgdGhpcy5vcHRpb25zLmR1cmF0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fY2xlYW51cCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZGVzdHJveSBtZXRob2QgdG8gZnJlZSByZXNvdXJjZXMgdXNlZCBieSB0aGUgcGx1Z2luOlxuICAgKiBSZWZlcmVuY2VzLCB1bnJlZ2lzdGVyIGxpc3RlbmVycywgZXRjLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICAvLyBSZW1vdmUgZm9jdXNCb3hcbiAgICB0aGlzLmZvY3VzQm94LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5mb2N1c0JveCk7XG5cbiAgICAvLyBSZW1vdmUgYW55IGV4dHJhIGNsYXNzZXMgZ2l2ZW4gdG8gb3RoZXIgZWxlbWVudHMgaWYgdGhleSBleGlzdFxuICAgIHRoaXMucHJldmlvdXNUYXJnZXQgIT0gbnVsbCAmJlxuICAgICAgdGhpcy5wcmV2aW91c1RhcmdldC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMub3B0aW9ucy50YXJnZXRDbGFzcyk7XG4gICAgdGhpcy5uZXh0VGFyZ2V0ICE9IG51bGwgJiZcbiAgICAgIHRoaXMubmV4dFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMub3B0aW9ucy50YXJnZXRDbGFzcyk7XG5cbiAgICAvLyBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzaW4nLCB0aGlzLm9uRm9jdXNIYW5kbGVyLCB0cnVlKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duSGFuZGxlciwgZmFsc2UpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLnN0b3AsIGZhbHNlKTtcblxuICAgIHRoaXMub3B0aW9ucy5vbkRlc3Ryb3kodGhpcyk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJFbGVtZW50IiwicHJvdG90eXBlIiwibWF0Y2hlcyIsIm1zTWF0Y2hlc1NlbGVjdG9yIiwid2Via2l0TWF0Y2hlc1NlbGVjdG9yIiwiY2xvc2VzdCIsInMiLCJlbCIsInBhcmVudEVsZW1lbnQiLCJwYXJlbnROb2RlIiwibm9kZVR5cGUiLCJleHRlbmQiLCJvYmoiLCJuYW1lIiwiY29weSIsInRhcmdldCIsImFyZ3VtZW50cyIsImkiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJhYnNvbHV0ZVBvc2l0aW9uIiwiZm91bmQiLCJsZWZ0IiwidG9wIiwid2lkdGgiLCJoZWlnaHQiLCJvZmZzZXRCYXNlIiwiZG9jdW1lbnQiLCJib2R5IiwiY3JlYXRlRWxlbWVudCIsInN0eWxlIiwiY3NzVGV4dCIsImFwcGVuZENoaWxkIiwib3duZXJEb2N1bWVudCIsImJvdW5kaW5nUmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsImJhc2VSZWN0IiwicmlnaHQiLCJib3R0b20iLCJ0cmFuc2l0aW9ucyIsInRyYW5zaXRpb24iLCJPVHJhbnNpdGlvbiIsIk1velRyYW5zaXRpb24iLCJXZWJraXRUcmFuc2l0aW9uIiwidCIsIkZvY3VzT3ZlcmxheSIsImVsZW1lbnQiLCJvcHRpb25zIiwiYWN0aXZlIiwic2NvcGVkRWwiLCJmb2N1c0JveCIsInByZXZpb3VzVGFyZ2V0IiwibmV4dFRhcmdldCIsInRpbWVvdXQiLCJpblNjb3BlIiwidHJhbnNpdGlvbkV2ZW50Iiwid2hpY2hUcmFuc2l0aW9uRXZlbnQiLCJjbGFzcyIsImFjdGl2ZUNsYXNzIiwiYW5pbWF0aW5nQ2xhc3MiLCJ0YXJnZXRDbGFzcyIsInpJbmRleCIsImR1cmF0aW9uIiwiaW5hY3RpdmVBZnRlckR1cmF0aW9uIiwidHJpZ2dlcktleXMiLCJpbmFjdGl2ZU9uTm9uVHJpZ2dlcktleSIsImluYWN0aXZlT25DbGljayIsImFsd2F5c0FjdGl2ZSIsIndhdGNoVHJhbnNpdGlvbkVuZCIsIm9uSW5pdCIsIm9uQmVmb3JlTW92ZSIsIm9uQWZ0ZXJNb3ZlIiwib25EZXN0cm95IiwiU3RyaW5nIiwicXVlcnlTZWxlY3RvciIsIm9uS2V5RG93bkhhbmRsZXIiLCJiaW5kIiwib25Gb2N1c0hhbmRsZXIiLCJtb3ZlRm9jdXNCb3giLCJzdG9wIiwiaW5pdCIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJfY3JlYXRlRm9jdXNCb3giLCJlIiwiY29kZSIsIndoaWNoIiwiaW5jbHVkZXMiLCJzZXRUaW1lb3V0IiwiYWN0aXZlRWwiLCJhY3RpdmVFbGVtZW50IiwiSFRNTElGcmFtZUVsZW1lbnQiLCJjb250YWlucyIsInNldEF0dHJpYnV0ZSIsImNsYXNzTGlzdCIsImFkZCIsIk9iamVjdCIsImFzc2lnbiIsInBvc2l0aW9uIiwicG9pbnRlckV2ZW50cyIsImluc2VydEFkamFjZW50RWxlbWVudCIsInJlbW92ZSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJmb2N1c2VkRWwiLCJfY2xlYW51cCIsImN1cnJlbnRFbCIsImdldEF0dHJpYnV0ZSIsImZvY3VzU2VsZWN0b3IiLCJhc3NvY2lhdGVkRWwiLCJpZCIsImNsZWFyVGltZW91dCIsInRhcmdldEVsIiwiRXZlbnQiLCJyZWN0IiwicmVtb3ZlQ2hpbGQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFBQTtBQUNBLEdBQWUsQ0FBQyxZQUFXO0VBQ3pCLE1BQUksQ0FBQ0EsT0FBTyxDQUFDQyxTQUFSLENBQWtCQyxPQUF2QixFQUFnQztFQUM5QkYsSUFBQUEsT0FBTyxDQUFDQyxTQUFSLENBQWtCQyxPQUFsQixHQUNFRixPQUFPLENBQUNDLFNBQVIsQ0FBa0JFLGlCQUFsQixJQUNBSCxPQUFPLENBQUNDLFNBQVIsQ0FBa0JHLHFCQUZwQjtFQUdEOztFQUVELE1BQUksQ0FBQ0osT0FBTyxDQUFDQyxTQUFSLENBQWtCSSxPQUF2QixFQUFnQztFQUM5QkwsSUFBQUEsT0FBTyxDQUFDQyxTQUFSLENBQWtCSSxPQUFsQixHQUE0QixVQUFTQyxDQUFULEVBQVk7RUFDdEMsVUFBSUMsRUFBRSxHQUFHLElBQVQ7O0VBRUEsU0FBRztFQUNELFlBQUlBLEVBQUUsQ0FBQ0wsT0FBSCxDQUFXSSxDQUFYLENBQUosRUFBbUIsT0FBT0MsRUFBUDtFQUNuQkEsUUFBQUEsRUFBRSxHQUFHQSxFQUFFLENBQUNDLGFBQUgsSUFBb0JELEVBQUUsQ0FBQ0UsVUFBNUI7RUFDRCxPQUhELFFBR1NGLEVBQUUsS0FBSyxJQUFQLElBQWVBLEVBQUUsQ0FBQ0csUUFBSCxLQUFnQixDQUh4Qzs7RUFJQSxhQUFPLElBQVA7RUFDRCxLQVJEO0VBU0Q7RUFDRixDQWxCYyxJQUFmOztFQ0RlLFNBQVNDLE1BQVQsR0FBa0I7RUFDL0IsTUFBSUMsR0FBSjtFQUFBLE1BQ0VDLElBREY7RUFBQSxNQUVFQyxJQUZGO0VBQUEsTUFHRUMsTUFBTSxHQUFHQyxTQUFTLENBQUMsQ0FBRCxDQUFULElBQWdCLEVBSDNCO0VBQUEsTUFJRUMsQ0FBQyxHQUFHLENBSk47RUFBQSxNQUtFQyxNQUFNLEdBQUdGLFNBQVMsQ0FBQ0UsTUFMckI7O0VBT0EsU0FBT0QsQ0FBQyxHQUFHQyxNQUFYLEVBQW1CRCxDQUFDLEVBQXBCLEVBQXdCO0VBQ3RCLFFBQUksQ0FBQ0wsR0FBRyxHQUFHSSxTQUFTLENBQUNDLENBQUQsQ0FBaEIsTUFBeUIsSUFBN0IsRUFBbUM7RUFDakMsV0FBS0osSUFBTCxJQUFhRCxHQUFiLEVBQWtCO0VBQ2hCRSxRQUFBQSxJQUFJLEdBQUdGLEdBQUcsQ0FBQ0MsSUFBRCxDQUFWOztFQUVBLFlBQUlFLE1BQU0sS0FBS0QsSUFBZixFQUFxQjtFQUNuQjtFQUNELFNBRkQsTUFFTyxJQUFJQSxJQUFJLEtBQUtLLFNBQWIsRUFBd0I7RUFDN0JKLFVBQUFBLE1BQU0sQ0FBQ0YsSUFBRCxDQUFOLEdBQWVDLElBQWY7RUFDRDtFQUNGO0VBQ0Y7RUFDRjs7RUFDRCxTQUFPQyxNQUFQO0VBQ0Q7O0VDdEJEO0FBQ0EsRUFBZSxTQUFTSyxnQkFBVCxDQUEwQmIsRUFBMUIsRUFBOEI7RUFDM0MsTUFBSWMsS0FBSjtFQUFBLE1BQ0VDLElBQUksR0FBRyxDQURUO0VBQUEsTUFFRUMsR0FBRyxHQUFHLENBRlI7RUFBQSxNQUdFQyxLQUFLLEdBQUcsQ0FIVjtFQUFBLE1BSUVDLE1BQU0sR0FBRyxDQUpYO0VBQUEsTUFLRUMsVUFBVSxHQUFHTixnQkFBZ0IsQ0FBQ00sVUFMaEM7O0VBTUEsTUFBSSxDQUFDQSxVQUFELElBQWVDLFFBQVEsQ0FBQ0MsSUFBNUIsRUFBa0M7RUFDaENGLElBQUFBLFVBQVUsR0FBR04sZ0JBQWdCLENBQUNNLFVBQWpCLEdBQThCQyxRQUFRLENBQUNFLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBM0M7RUFDQUgsSUFBQUEsVUFBVSxDQUFDSSxLQUFYLENBQWlCQyxPQUFqQixHQUEyQixnQ0FBM0I7RUFDQUosSUFBQUEsUUFBUSxDQUFDQyxJQUFULENBQWNJLFdBQWQsQ0FBMEJOLFVBQTFCO0VBQ0Q7O0VBQ0QsTUFDRW5CLEVBQUUsSUFDRkEsRUFBRSxDQUFDMEIsYUFBSCxLQUFxQk4sUUFEckIsSUFFQSwyQkFBMkJwQixFQUYzQixJQUdBbUIsVUFKRixFQUtFO0VBQ0EsUUFBSVEsWUFBWSxHQUFHM0IsRUFBRSxDQUFDNEIscUJBQUgsRUFBbkI7RUFDQSxRQUFJQyxRQUFRLEdBQUdWLFVBQVUsQ0FBQ1MscUJBQVgsRUFBZjtFQUNBZCxJQUFBQSxLQUFLLEdBQUcsSUFBUjtFQUNBQyxJQUFBQSxJQUFJLEdBQUdZLFlBQVksQ0FBQ1osSUFBYixHQUFvQmMsUUFBUSxDQUFDZCxJQUFwQztFQUNBQyxJQUFBQSxHQUFHLEdBQUdXLFlBQVksQ0FBQ1gsR0FBYixHQUFtQmEsUUFBUSxDQUFDYixHQUFsQztFQUNBQyxJQUFBQSxLQUFLLEdBQUdVLFlBQVksQ0FBQ0csS0FBYixHQUFxQkgsWUFBWSxDQUFDWixJQUExQztFQUNBRyxJQUFBQSxNQUFNLEdBQUdTLFlBQVksQ0FBQ0ksTUFBYixHQUFzQkosWUFBWSxDQUFDWCxHQUE1QztFQUNEOztFQUNELFNBQU87RUFDTEYsSUFBQUEsS0FBSyxFQUFFQSxLQURGO0VBRUxDLElBQUFBLElBQUksRUFBRUEsSUFGRDtFQUdMQyxJQUFBQSxHQUFHLEVBQUVBLEdBSEE7RUFJTEMsSUFBQUEsS0FBSyxFQUFFQSxLQUpGO0VBS0xDLElBQUFBLE1BQU0sRUFBRUEsTUFMSDtFQU1MWSxJQUFBQSxLQUFLLEVBQUVmLElBQUksR0FBR0UsS0FOVDtFQU9MYyxJQUFBQSxNQUFNLEVBQUVmLEdBQUcsR0FBR0U7RUFQVCxHQUFQO0VBU0Q7O0VDcENEOzs7OztBQUtBLEVBQWUsaUNBQVc7RUFDeEIsTUFBTWxCLEVBQUUsR0FBR29CLFFBQVEsQ0FBQ0UsYUFBVCxDQUF1QixhQUF2QixDQUFYO0VBQ0EsTUFBTVUsV0FBVyxHQUFHO0VBQ2xCQyxJQUFBQSxVQUFVLEVBQUUsZUFETTtFQUVsQkMsSUFBQUEsV0FBVyxFQUFFLGdCQUZLO0VBR2xCQyxJQUFBQSxhQUFhLEVBQUUsZUFIRztFQUlsQkMsSUFBQUEsZ0JBQWdCLEVBQUU7RUFKQSxHQUFwQjs7RUFPQSxPQUFLLElBQUlDLENBQVQsSUFBY0wsV0FBZCxFQUEyQjtFQUN6QixRQUFJaEMsRUFBRSxDQUFDdUIsS0FBSCxDQUFTYyxDQUFULE1BQWdCekIsU0FBcEIsRUFBK0I7RUFDN0IsYUFBT29CLFdBQVcsQ0FBQ0ssQ0FBRCxDQUFsQjtFQUNEO0VBQ0Y7RUFDRjs7RUNiRDs7Ozs7O01BS3FCQzs7O0VBQ25CLHdCQUFZQyxPQUFaLEVBQXFCQyxPQUFyQixFQUE4QjtFQUFBOztFQUM1QixTQUFLQyxNQUFMLEdBQWMsS0FBZDtFQUNBLFNBQUtDLFFBQUw7RUFDQSxTQUFLQyxRQUFMO0VBQ0EsU0FBS0MsY0FBTDtFQUNBLFNBQUtDLFVBQUw7RUFDQSxTQUFLQyxPQUFMLEdBQWUsQ0FBZjtFQUNBLFNBQUtDLE9BQUwsR0FBZSxLQUFmO0VBQ0EsU0FBS0MsZUFBTCxHQUF1QkMsb0JBQW9CLEVBQTNDO0VBQ0EsU0FBS1QsT0FBTCxHQUFlcEMsTUFBTSxDQUNuQjtFQUNFO0VBQ0E4QyxNQUFBQSxLQUFLLEVBQUUsZUFGVDtFQUdFO0VBQ0FDLE1BQUFBLFdBQVcsRUFBRSxzQkFKZjtFQUtFO0VBQ0FDLE1BQUFBLGNBQWMsRUFBRSx5QkFObEI7RUFPRTtFQUNBQyxNQUFBQSxXQUFXLEVBQUUsc0JBUmY7RUFTRTtFQUNBQyxNQUFBQSxNQUFNLEVBQUUsSUFWVjtFQVdFO0VBQ0FDLE1BQUFBLFFBQVEsRUFBRSxHQVpaO0VBYUU7RUFDQUMsTUFBQUEscUJBQXFCLEVBQUUsS0FkekI7RUFlRTtFQUNBQyxNQUFBQSxXQUFXLEVBQUUsQ0FBQyxDQUFELEVBQUksRUFBSixFQUFRLEVBQVIsRUFBWSxFQUFaLEVBQWdCLEVBQWhCLEVBQW9CLEVBQXBCLEVBQXdCLEVBQXhCLEVBQTRCLEVBQTVCLEVBQWdDLEVBQWhDLEVBQW9DLEVBQXBDLEVBQXdDLEVBQXhDLEVBQTRDLEVBQTVDLENBaEJmO0VBaUJFO0VBQ0FDLE1BQUFBLHVCQUF1QixFQUFFLElBbEIzQjtFQW1CRTtFQUNBQyxNQUFBQSxlQUFlLEVBQUUsSUFwQm5CO0VBcUJFO0VBQ0FDLE1BQUFBLFlBQVksRUFBRSxLQXRCaEI7RUF1QkU7RUFDQUMsTUFBQUEsa0JBQWtCLEVBQUUsSUF4QnRCO0VBeUJFO0VBQ0FDLE1BQUFBLE1BQU0sRUFBRSxrQkFBVyxFQTFCckI7RUEyQkU7RUFDQUMsTUFBQUEsWUFBWSxFQUFFLHdCQUFXLEVBNUIzQjtFQTZCRTtFQUNBQyxNQUFBQSxXQUFXLEVBQUUsdUJBQVcsRUE5QjFCO0VBK0JFO0VBQ0FDLE1BQUFBLFNBQVMsRUFBRSxxQkFBVztFQWhDeEIsS0FEbUIsRUFtQ25CekIsT0FBTyxJQUFJLEVBbkNRLENBQXJCO0VBc0NBOzs7OztFQUlBLFFBQUlELE9BQU8sWUFBWTlDLE9BQXZCLEVBQWdDO0VBQzlCLFdBQUtpRCxRQUFMLEdBQWdCSCxPQUFoQjtFQUNELEtBRkQsTUFFTyxJQUFJLE9BQU9BLE9BQVAsS0FBbUIsUUFBbkIsSUFBK0JBLE9BQU8sWUFBWTJCLE1BQXRELEVBQThEO0VBQ25FLFdBQUt4QixRQUFMLEdBQWdCdEIsUUFBUSxDQUFDK0MsYUFBVCxDQUF1QjVCLE9BQXZCLENBQWhCO0VBQ0QsS0FGTSxNQUVBO0VBQ0wsV0FBS0csUUFBTCxHQUFnQnRCLFFBQVEsQ0FBQytDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBaEI7RUFDRCxLQXpEMkI7OztFQTRENUIsU0FBS0MsZ0JBQUwsR0FBd0IsS0FBS0EsZ0JBQUwsQ0FBc0JDLElBQXRCLENBQTJCLElBQTNCLENBQXhCO0VBQ0EsU0FBS0MsY0FBTCxHQUFzQixLQUFLQSxjQUFMLENBQW9CRCxJQUFwQixDQUF5QixJQUF6QixDQUF0QjtFQUNBLFNBQUtFLFlBQUwsR0FBb0IsS0FBS0EsWUFBTCxDQUFrQkYsSUFBbEIsQ0FBdUIsSUFBdkIsQ0FBcEI7RUFDQSxTQUFLRyxJQUFMLEdBQVksS0FBS0EsSUFBTCxDQUFVSCxJQUFWLENBQWUsSUFBZixDQUFaLENBL0Q0Qjs7RUFrRTVCLFNBQUtJLElBQUw7RUFDRDtFQUVEOzs7Ozs7Ozs2QkFJTztFQUNMLFVBQUksS0FBS2pDLE9BQUwsQ0FBYW9CLFlBQWpCLEVBQStCO0VBQzdCLGFBQUtuQixNQUFMLEdBQWMsSUFBZDtFQUNBaUMsUUFBQUEsTUFBTSxDQUFDQyxnQkFBUCxDQUF3QixTQUF4QixFQUFtQyxLQUFLTCxjQUF4QyxFQUF3RCxJQUF4RDtFQUNELE9BSEQsTUFHTztFQUNMSSxRQUFBQSxNQUFNLENBQUNDLGdCQUFQLENBQXdCLFNBQXhCLEVBQW1DLEtBQUtQLGdCQUF4QyxFQUEwRCxLQUExRDs7RUFFQSxZQUFJLEtBQUs1QixPQUFMLENBQWFtQixlQUFqQixFQUFrQztFQUNoQ2UsVUFBQUEsTUFBTSxDQUFDQyxnQkFBUCxDQUF3QixXQUF4QixFQUFxQyxLQUFLSCxJQUExQyxFQUFnRCxLQUFoRDtFQUNEO0VBQ0Y7O0VBRUQsV0FBS0ksZUFBTDs7RUFDQSxXQUFLcEMsT0FBTCxDQUFhc0IsTUFBYixDQUFvQixJQUFwQjtFQUNEO0VBRUQ7Ozs7Ozs7dUNBSWlCZSxHQUFHO0VBQUE7O0VBQ2xCLFVBQU1DLElBQUksR0FBR0QsQ0FBQyxDQUFDRSxLQUFmLENBRGtCOztFQUlsQixVQUFJLEtBQUt2QyxPQUFMLENBQWFpQixXQUFiLENBQXlCdUIsUUFBekIsQ0FBa0NGLElBQWxDLENBQUosRUFBNkM7RUFDM0MsWUFBSSxLQUFLckMsTUFBTCxLQUFnQixLQUFwQixFQUEyQjtFQUN6QixlQUFLQSxNQUFMLEdBQWMsSUFBZDtFQUNBaUMsVUFBQUEsTUFBTSxDQUFDQyxnQkFBUCxDQUF3QixTQUF4QixFQUFtQyxLQUFLTCxjQUF4QyxFQUF3RCxJQUF4RDtFQUNEO0VBRUQ7Ozs7Ozs7RUFLQVcsUUFBQUEsVUFBVSxDQUFDLFlBQU07RUFDZixjQUFNQyxRQUFRLEdBQUc5RCxRQUFRLENBQUMrRCxhQUExQjtFQUVBOzs7OztFQUlBLGNBQ0VELFFBQVEsWUFBWUUsaUJBQXBCLElBQ0EsS0FBSSxDQUFDMUMsUUFBTCxDQUFjMkMsUUFBZCxDQUF1QkgsUUFBdkIsQ0FEQSxJQUVBLEtBQUksQ0FBQ3pDLE1BQUwsS0FBZ0IsSUFIbEIsRUFJRTtFQUNBLFlBQUEsS0FBSSxDQUFDOEIsWUFBTCxDQUFrQlcsUUFBbEI7RUFDRDtFQUNGLFNBZFMsRUFjUCxDQWRPLENBQVY7RUFlRCxPQTFCRCxNQTBCTyxJQUFJLEtBQUsxQyxPQUFMLENBQWFrQix1QkFBakIsRUFBMEM7RUFDL0MsYUFBS2MsSUFBTDtFQUNEO0VBQ0Y7RUFFRDs7Ozs7O3dDQUdrQjtFQUNoQixXQUFLN0IsUUFBTCxHQUFnQnZCLFFBQVEsQ0FBQ0UsYUFBVCxDQUF1QixLQUF2QixDQUFoQjtFQUNBLFdBQUtxQixRQUFMLENBQWMyQyxZQUFkLENBQTJCLGFBQTNCLEVBQTBDLE1BQTFDO0VBQ0EsV0FBSzNDLFFBQUwsQ0FBYzRDLFNBQWQsQ0FBd0JDLEdBQXhCLENBQTRCLEtBQUtoRCxPQUFMLENBQWFVLEtBQXpDO0VBRUF1QyxNQUFBQSxNQUFNLENBQUNDLE1BQVAsQ0FBYyxLQUFLL0MsUUFBTCxDQUFjcEIsS0FBNUIsRUFBbUM7RUFDakNvRSxRQUFBQSxRQUFRLEVBQUUsVUFEdUI7RUFFakNyQyxRQUFBQSxNQUFNLEVBQUUsS0FBS2QsT0FBTCxDQUFhYyxNQUZZO0VBR2pDc0MsUUFBQUEsYUFBYSxFQUFFO0VBSGtCLE9BQW5DO0VBTUEsV0FBS2xELFFBQUwsQ0FBY21ELHFCQUFkLENBQW9DLFdBQXBDLEVBQWlELEtBQUtsRCxRQUF0RDtFQUNEO0VBRUQ7Ozs7Ozs7aUNBSVc7RUFDVDtFQUNBLFVBQUksS0FBS0UsVUFBTCxJQUFtQixJQUF2QixFQUE2QjtFQUMzQixhQUFLRCxjQUFMLEdBQXNCLEtBQUtDLFVBQTNCO0VBQ0EsYUFBS0QsY0FBTCxDQUFvQjJDLFNBQXBCLENBQThCTyxNQUE5QixDQUFxQyxLQUFLdEQsT0FBTCxDQUFhYSxXQUFsRDtFQUNBLGFBQUtULGNBQUwsQ0FBb0JtRCxtQkFBcEIsQ0FDRSxLQUFLL0MsZUFEUCxFQUVFLEtBQUt1QixZQUZQO0VBSUQ7RUFDRjtFQUVEOzs7Ozs7O3FDQUllTSxHQUFHO0VBQ2hCLFVBQU1tQixTQUFTLEdBQUduQixDQUFDLENBQUNyRSxNQUFwQjs7RUFFQSxXQUFLeUYsUUFBTCxHQUhnQjs7O0VBTWhCLFVBQUksS0FBS3ZELFFBQUwsQ0FBYzJDLFFBQWQsQ0FBdUJXLFNBQXZCLENBQUosRUFBdUM7RUFDckM7RUFDQSxZQUFNRSxTQUFTLEdBQUcsS0FBS3JELFVBQXZCO0VBRUEsYUFBS0UsT0FBTCxHQUFlLElBQWYsQ0FKcUM7O0VBT3JDLFlBQUlpRCxTQUFTLENBQUNHLFlBQVYsQ0FBdUIsWUFBdkIsTUFBeUMsSUFBN0MsRUFBbUQ7RUFDakQsY0FBTUMsYUFBYSxHQUFHSixTQUFTLENBQUNHLFlBQVYsQ0FBdUIsWUFBdkIsQ0FBdEI7RUFFQSxlQUFLdEQsVUFBTCxHQUFrQnpCLFFBQVEsQ0FBQytDLGFBQVQsd0JBQ0FpQyxhQURBLFFBQWxCLENBSGlEO0VBUWxELFNBUkQsTUFRTyxJQUFJSixTQUFTLENBQUNHLFlBQVYsQ0FBdUIsa0JBQXZCLE1BQStDLElBQW5ELEVBQXlEO0VBQzlELGNBQUlFLFlBQVksR0FBR2pGLFFBQVEsQ0FBQytDLGFBQVQsaUJBQWdDNkIsU0FBUyxDQUFDTSxFQUExQyxRQUFuQixDQUQ4RDs7RUFJOUQsY0FBSUQsWUFBWSxLQUFLLElBQXJCLEVBQTJCO0VBQ3pCQSxZQUFBQSxZQUFZLEdBQUdMLFNBQVMsQ0FBQ2xHLE9BQVYsQ0FBa0IsT0FBbEIsQ0FBZjtFQUNEOztFQUVELGVBQUsrQyxVQUFMLEdBQWtCd0QsWUFBbEIsQ0FSOEQ7RUFXL0QsU0FYTSxNQVdBLElBQUlMLFNBQVMsQ0FBQ0csWUFBVixDQUF1QixtQkFBdkIsTUFBZ0QsSUFBcEQsRUFBMEQ7RUFDL0QsaUJBRCtEO0VBSWhFLFNBSk0sTUFJQTtFQUNMLGVBQUt0RCxVQUFMLEdBQWtCbUQsU0FBbEI7RUFDRDtFQUVEOzs7Ozs7RUFJQU8sUUFBQUEsWUFBWSxDQUFDLEtBQUt6RCxPQUFOLENBQVo7RUFFQTs7Ozs7O0VBS0EsWUFBSSxLQUFLRSxlQUFMLElBQXdCLEtBQUtSLE9BQUwsQ0FBYXFCLGtCQUF6QyxFQUE2RDtFQUMzRCxlQUFLaEIsVUFBTCxDQUFnQjhCLGdCQUFoQixDQUNFLEtBQUszQixlQURQLEVBRUUsS0FBS3VCLFlBRlA7RUFJRDs7RUFFRCxhQUFLL0IsT0FBTCxDQUFhdUIsWUFBYixDQUEwQm1DLFNBQTFCLEVBQXFDLEtBQUtyRCxVQUExQyxFQUFzRCxJQUF0RDtFQUNBLGFBQUswQixZQUFMLENBQWtCLEtBQUsxQixVQUF2QixFQXJEcUM7RUF3RHRDLE9BeERELE1Bd0RPLElBQUksS0FBS0wsT0FBTCxDQUFhb0IsWUFBakIsRUFBK0I7RUFDcEMsYUFBS2IsT0FBTCxHQUFlLEtBQWYsQ0FEb0M7RUFJckMsT0FKTSxNQUlBO0VBQ0wsYUFBS0EsT0FBTCxHQUFlLEtBQWY7RUFDQSxhQUFLeUIsSUFBTDtFQUNEO0VBQ0Y7RUFFRDs7Ozs7OzZCQUdPO0VBQ0wsV0FBSy9CLE1BQUwsR0FBYyxLQUFkO0VBQ0FpQyxNQUFBQSxNQUFNLENBQUNxQixtQkFBUCxDQUEyQixTQUEzQixFQUFzQyxLQUFLekIsY0FBM0MsRUFBMkQsSUFBM0Q7O0VBQ0EsV0FBSzJCLFFBQUw7O0VBQ0EsV0FBS3RELFFBQUwsQ0FBYzRDLFNBQWQsQ0FBd0JPLE1BQXhCLENBQStCLEtBQUt0RCxPQUFMLENBQWFXLFdBQTVDO0VBQ0Q7RUFFRDs7Ozs7OzttQ0FJYXFELFVBQVU7RUFBQTs7RUFDckI7RUFDQSxVQUFJQSxRQUFRLFlBQVlDLEtBQXhCLEVBQStCRCxRQUFRLEdBQUdwRixRQUFRLENBQUMrRCxhQUFwQixDQUZWOztFQUtyQnFCLE1BQUFBLFFBQVEsQ0FBQ2pCLFNBQVQsQ0FBbUJDLEdBQW5CLENBQXVCLEtBQUtoRCxPQUFMLENBQWFhLFdBQXBDO0VBRUE7Ozs7Ozs7RUFNQSxVQUFJakMsUUFBUSxDQUFDQyxJQUFULENBQWNnRSxRQUFkLENBQXVCbUIsUUFBdkIsS0FBb0NBLFFBQVEsWUFBWS9HLE9BQTVELEVBQXFFO0VBQ25FLFlBQU1pSCxJQUFJLEdBQUc3RixnQkFBZ0IsQ0FBQzJGLFFBQUQsQ0FBN0I7RUFDQSxZQUFNdkYsS0FBSyxhQUFNeUYsSUFBSSxDQUFDekYsS0FBWCxPQUFYO0VBQ0EsWUFBTUMsTUFBTSxhQUFNd0YsSUFBSSxDQUFDeEYsTUFBWCxPQUFaO0VBQ0EsWUFBTUgsSUFBSSxhQUFNMkYsSUFBSSxDQUFDM0YsSUFBWCxPQUFWO0VBQ0EsWUFBTUMsR0FBRyxhQUFNMEYsSUFBSSxDQUFDMUYsR0FBWCxPQUFUO0VBRUEsYUFBSzJCLFFBQUwsQ0FBYzRDLFNBQWQsQ0FBd0JDLEdBQXhCLENBQTRCLEtBQUtoRCxPQUFMLENBQWFZLGNBQXpDO0VBQ0EsYUFBS1QsUUFBTCxDQUFjNEMsU0FBZCxDQUF3QkMsR0FBeEIsQ0FBNEIsS0FBS2hELE9BQUwsQ0FBYVcsV0FBekM7RUFFQXNDLFFBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLEtBQUsvQyxRQUFMLENBQWNwQixLQUE1QixFQUFtQztFQUNqQ04sVUFBQUEsS0FBSyxFQUFMQSxLQURpQztFQUVqQ0MsVUFBQUEsTUFBTSxFQUFOQSxNQUZpQztFQUdqQ0gsVUFBQUEsSUFBSSxFQUFKQSxJQUhpQztFQUlqQ0MsVUFBQUEsR0FBRyxFQUFIQTtFQUppQyxTQUFuQyxFQVZtRTs7RUFrQm5FLGFBQUs4QixPQUFMLEdBQWVtQyxVQUFVLENBQUMsWUFBTTtFQUM5QixVQUFBLE1BQUksQ0FBQ3RDLFFBQUwsQ0FBYzRDLFNBQWQsQ0FBd0JPLE1BQXhCLENBQStCLE1BQUksQ0FBQ3RELE9BQUwsQ0FBYVksY0FBNUM7O0VBRUEsY0FBSSxNQUFJLENBQUNaLE9BQUwsQ0FBYWdCLHFCQUFqQixFQUF3QztFQUN0QyxZQUFBLE1BQUksQ0FBQ2IsUUFBTCxDQUFjNEMsU0FBZCxDQUF3Qk8sTUFBeEIsQ0FBK0IsTUFBSSxDQUFDdEQsT0FBTCxDQUFhVyxXQUE1QztFQUNEOztFQUVELFVBQUEsTUFBSSxDQUFDWCxPQUFMLENBQWF3QixXQUFiLENBQXlCLE1BQUksQ0FBQ3BCLGNBQTlCLEVBQThDNEQsUUFBOUMsRUFBd0QsTUFBeEQ7RUFDRCxTQVJ3QixFQVF0QixLQUFLaEUsT0FBTCxDQUFhZSxRQVJTLENBQXpCO0VBU0QsT0EzQkQsTUEyQk87RUFDTCxhQUFLMEMsUUFBTDtFQUNEO0VBQ0Y7RUFFRDs7Ozs7OztnQ0FJVTtFQUNSO0VBQ0EsV0FBS3RELFFBQUwsQ0FBY3pDLFVBQWQsQ0FBeUJ5RyxXQUF6QixDQUFxQyxLQUFLaEUsUUFBMUMsRUFGUTs7RUFLUixXQUFLQyxjQUFMLElBQXVCLElBQXZCLElBQ0UsS0FBS0EsY0FBTCxDQUFvQjJDLFNBQXBCLENBQThCTyxNQUE5QixDQUFxQyxLQUFLdEQsT0FBTCxDQUFhYSxXQUFsRCxDQURGO0VBRUEsV0FBS1IsVUFBTCxJQUFtQixJQUFuQixJQUNFLEtBQUtBLFVBQUwsQ0FBZ0IwQyxTQUFoQixDQUEwQk8sTUFBMUIsQ0FBaUMsS0FBS3RELE9BQUwsQ0FBYWEsV0FBOUMsQ0FERixDQVBROztFQVdScUIsTUFBQUEsTUFBTSxDQUFDcUIsbUJBQVAsQ0FBMkIsU0FBM0IsRUFBc0MsS0FBS3pCLGNBQTNDLEVBQTJELElBQTNEO0VBQ0FJLE1BQUFBLE1BQU0sQ0FBQ3FCLG1CQUFQLENBQTJCLFNBQTNCLEVBQXNDLEtBQUszQixnQkFBM0MsRUFBNkQsS0FBN0Q7RUFDQU0sTUFBQUEsTUFBTSxDQUFDcUIsbUJBQVAsQ0FBMkIsV0FBM0IsRUFBd0MsS0FBS3ZCLElBQTdDLEVBQW1ELEtBQW5EO0VBRUEsV0FBS2hDLE9BQUwsQ0FBYXlCLFNBQWIsQ0FBdUIsSUFBdkI7RUFDRDs7Ozs7Ozs7Ozs7OyJ9
