'use strict';

require('core-js/modules/es6.object.assign');
require('core-js/modules/es7.array.includes');
require('core-js/modules/es6.string.includes');
require('core-js/modules/es6.function.name');

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

module.exports = FocusOverlay;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXNvdmVybGF5LmNqcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3BvbHlmaWxscy9jbG9zZXN0LmpzIiwiLi4vc3JjL3V0aWxzL2V4dGVuZC5qcyIsIi4uL3NyYy91dGlscy9hYnNvbHV0ZVBvc2l0aW9uLmpzIiwiLi4vc3JjL3V0aWxzL3doaWNoVHJhbnNpdGlvbkV2ZW50LmpzIiwiLi4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2Nsb3Nlc3QjUG9seWZpbGxcbmV4cG9ydCBkZWZhdWx0IChmdW5jdGlvbigpIHtcbiAgaWYgKCFFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzKSB7XG4gICAgRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcyA9XG4gICAgICBFbGVtZW50LnByb3RvdHlwZS5tc01hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgRWxlbWVudC5wcm90b3R5cGUud2Via2l0TWF0Y2hlc1NlbGVjdG9yO1xuICB9XG5cbiAgaWYgKCFFbGVtZW50LnByb3RvdHlwZS5jbG9zZXN0KSB7XG4gICAgRWxlbWVudC5wcm90b3R5cGUuY2xvc2VzdCA9IGZ1bmN0aW9uKHMpIHtcbiAgICAgIHZhciBlbCA9IHRoaXM7XG5cbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKGVsLm1hdGNoZXMocykpIHJldHVybiBlbDtcbiAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50IHx8IGVsLnBhcmVudE5vZGU7XG4gICAgICB9IHdoaWxlIChlbCAhPT0gbnVsbCAmJiBlbC5ub2RlVHlwZSA9PT0gMSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICB9XG59KSgpO1xuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXh0ZW5kKCkge1xuICB2YXIgb2JqLFxuICAgIG5hbWUsXG4gICAgY29weSxcbiAgICB0YXJnZXQgPSBhcmd1bWVudHNbMF0gfHwge30sXG4gICAgaSA9IDEsXG4gICAgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcblxuICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChvYmogPSBhcmd1bWVudHNbaV0pICE9PSBudWxsKSB7XG4gICAgICBmb3IgKG5hbWUgaW4gb2JqKSB7XG4gICAgICAgIGNvcHkgPSBvYmpbbmFtZV07XG5cbiAgICAgICAgaWYgKHRhcmdldCA9PT0gY29weSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGNvcHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGNvcHk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn1cbiIsIi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zMjYyMzgzMi84ODYyMDA1XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBhYnNvbHV0ZVBvc2l0aW9uKGVsKSB7XG4gIHZhciBmb3VuZCxcbiAgICBsZWZ0ID0gMCxcbiAgICB0b3AgPSAwLFxuICAgIHdpZHRoID0gMCxcbiAgICBoZWlnaHQgPSAwLFxuICAgIG9mZnNldEJhc2UgPSBhYnNvbHV0ZVBvc2l0aW9uLm9mZnNldEJhc2U7XG4gIGlmICghb2Zmc2V0QmFzZSAmJiBkb2N1bWVudC5ib2R5KSB7XG4gICAgb2Zmc2V0QmFzZSA9IGFic29sdXRlUG9zaXRpb24ub2Zmc2V0QmFzZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG9mZnNldEJhc2Uuc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7dG9wOjAnO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob2Zmc2V0QmFzZSk7XG4gIH1cbiAgaWYgKFxuICAgIGVsICYmXG4gICAgZWwub3duZXJEb2N1bWVudCA9PT0gZG9jdW1lbnQgJiZcbiAgICAnZ2V0Qm91bmRpbmdDbGllbnRSZWN0JyBpbiBlbCAmJlxuICAgIG9mZnNldEJhc2VcbiAgKSB7XG4gICAgdmFyIGJvdW5kaW5nUmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBiYXNlUmVjdCA9IG9mZnNldEJhc2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgZm91bmQgPSB0cnVlO1xuICAgIGxlZnQgPSBib3VuZGluZ1JlY3QubGVmdCAtIGJhc2VSZWN0LmxlZnQ7XG4gICAgdG9wID0gYm91bmRpbmdSZWN0LnRvcCAtIGJhc2VSZWN0LnRvcDtcbiAgICB3aWR0aCA9IGJvdW5kaW5nUmVjdC5yaWdodCAtIGJvdW5kaW5nUmVjdC5sZWZ0O1xuICAgIGhlaWdodCA9IGJvdW5kaW5nUmVjdC5ib3R0b20gLSBib3VuZGluZ1JlY3QudG9wO1xuICB9XG4gIHJldHVybiB7XG4gICAgZm91bmQ6IGZvdW5kLFxuICAgIGxlZnQ6IGxlZnQsXG4gICAgdG9wOiB0b3AsXG4gICAgd2lkdGg6IHdpZHRoLFxuICAgIGhlaWdodDogaGVpZ2h0LFxuICAgIHJpZ2h0OiBsZWZ0ICsgd2lkdGgsXG4gICAgYm90dG9tOiB0b3AgKyBoZWlnaHRcbiAgfTtcbn1cbiIsIi8qKlxuICogQ3Jvc3MgYnJvd3NlciB0cmFuc2l0aW9uRW5kIGV2ZW50XG4gKiBodHRwczovL2Rhdmlkd2Fsc2gubmFtZS9jc3MtYW5pbWF0aW9uLWNhbGxiYWNrXG4gKiBAcmV0dXJuIHtTdHJpbmd9IEJyb3dzZXIncyBzdXBwb3J0ZWQgdHJhbnNpdGlvbmVuZCB0eXBlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zha2VlbGVtZW50Jyk7XG4gIGNvbnN0IHRyYW5zaXRpb25zID0ge1xuICAgIHRyYW5zaXRpb246ICd0cmFuc2l0aW9uZW5kJyxcbiAgICBPVHJhbnNpdGlvbjogJ29UcmFuc2l0aW9uRW5kJyxcbiAgICBNb3pUcmFuc2l0aW9uOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgV2Via2l0VHJhbnNpdGlvbjogJ3dlYmtpdFRyYW5zaXRpb25FbmQnXG4gIH07XG5cbiAgZm9yIChsZXQgdCBpbiB0cmFuc2l0aW9ucykge1xuICAgIGlmIChlbC5zdHlsZVt0XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbnNbdF07XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgJy4vc3R5bGVzLmNzcyc7XG5pbXBvcnQgJy4vcG9seWZpbGxzL2Nsb3Nlc3QnO1xuaW1wb3J0IGV4dGVuZCBmcm9tICcuL3V0aWxzL2V4dGVuZCc7XG5pbXBvcnQgYWJzb2x1dGVQb3NpdGlvbiBmcm9tICcuL3V0aWxzL2Fic29sdXRlUG9zaXRpb24nO1xuaW1wb3J0IHdoaWNoVHJhbnNpdGlvbkV2ZW50IGZyb20gJy4vdXRpbHMvd2hpY2hUcmFuc2l0aW9uRXZlbnQnO1xuXG4vKipcbiAqIFRoZSBwbHVnaW4gY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7RWxlbWVudHxTdHJpbmd9IGVsZW1lbnQgVGhlIERPTSBlbGVtZW50IHdoZXJlIHBsdWdpbiBpcyBhcHBsaWVkXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3JcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRm9jdXNPdmVybGF5IHtcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgdGhpcy5zY29wZWRFbDtcbiAgICB0aGlzLmZvY3VzQm94O1xuICAgIHRoaXMucHJldmlvdXNUYXJnZXQ7XG4gICAgdGhpcy5uZXh0VGFyZ2V0O1xuICAgIHRoaXMudGltZW91dCA9IDA7XG4gICAgdGhpcy5pblNjb3BlID0gZmFsc2U7XG4gICAgdGhpcy50cmFuc2l0aW9uRXZlbnQgPSB3aGljaFRyYW5zaXRpb25FdmVudCgpO1xuICAgIHRoaXMub3B0aW9ucyA9IGV4dGVuZChcbiAgICAgIHtcbiAgICAgICAgLy8gQ2xhc3MgYWRkZWQgdG8gdGhlIGZvY3VzIGJveFxuICAgICAgICBjbGFzczogJ2ZvY3VzLW92ZXJsYXknLFxuICAgICAgICAvLyBDbGFzcyBhZGRlZCB3aGlsZSB0aGUgZm9jdXMgYm94IGlzIGFjdGl2ZVxuICAgICAgICBhY3RpdmVDbGFzczogJ2ZvY3VzLW92ZXJsYXktYWN0aXZlJyxcbiAgICAgICAgLy8gQ2xhc3MgYWRkZWQgd2hpbGUgdGhlIGZvY3VzIGJveCBpcyBhbmltYXRpbmdcbiAgICAgICAgYW5pbWF0aW5nQ2xhc3M6ICdmb2N1cy1vdmVybGF5LWFuaW1hdGluZycsXG4gICAgICAgIC8vIENsYXNzIGFkZGVkIHRvIHRoZSB0YXJnZXQgZWxlbWVudFxuICAgICAgICB0YXJnZXRDbGFzczogJ2ZvY3VzLW92ZXJsYXktdGFyZ2V0JyxcbiAgICAgICAgLy8gei1pbmRleCBvZiBmb2N1cyBib3hcbiAgICAgICAgekluZGV4OiA5MDAxLFxuICAgICAgICAvLyBEdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW5nQ2xhc3MgKG1pbGxpc2Vjb25kcylcbiAgICAgICAgZHVyYXRpb246IDUwMCxcbiAgICAgICAgLy8gUmVtb3ZlcyBhY3RpdmVDbGFzcyBhZnRlciBkdXJhdGlvblxuICAgICAgICBpbmFjdGl2ZUFmdGVyRHVyYXRpb246IGZhbHNlLFxuICAgICAgICAvLyBUYWIsIEFycm93IEtleXMsIEVudGVyLCBTcGFjZSwgU2hpZnQsIEN0cmwsIEFsdCwgRVNDXG4gICAgICAgIHRyaWdnZXJLZXlzOiBbOSwgMzYsIDM3LCAzOCwgMzksIDQwLCAxMywgMzIsIDE2LCAxNywgMTgsIDI3XSxcbiAgICAgICAgLy8gTWFrZSBmb2N1cyBib3ggaW5hY3RpdmUgd2hlbiBhIG5vbiBzcGVjaWZpZWQga2V5IGlzIHByZXNzZWRcbiAgICAgICAgaW5hY3RpdmVPbk5vblRyaWdnZXJLZXk6IHRydWUsXG4gICAgICAgIC8vIE1ha2UgZm9jdXMgYm94IGluYWN0aXZlIHdoZW4gYSB1c2VyIGNsaWNrc1xuICAgICAgICBpbmFjdGl2ZU9uQ2xpY2s6IHRydWUsXG4gICAgICAgIC8vIEZvcmNlIHRoZSBib3ggdG8gYWx3YXlzIHN0YXkgYWN0aXZlLiBPdmVycmlkZXMgZXZlcnl0aGluZ1xuICAgICAgICBhbHdheXNBY3RpdmU6IGZhbHNlLFxuICAgICAgICAvLyBSZXBvc2l0aW9uIGZvY3VzIGJveCBvbiB0cmFuc2l0aW9uRW5kIGZvciBmb2N1c2VkIGVsZW1lbnRzXG4gICAgICAgIHdhdGNoVHJhbnNpdGlvbkVuZDogdHJ1ZSxcbiAgICAgICAgLy8gSW5pdGlhbGl6YXRpb24gZXZlbnRcbiAgICAgICAgb25Jbml0OiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAvLyBCZWZvcmUgZm9jdXMgYm94IG1vdmVcbiAgICAgICAgb25CZWZvcmVNb3ZlOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAvLyBBZnRlciBmb2N1cyBib3ggbW92ZVxuICAgICAgICBvbkFmdGVyTW92ZTogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgLy8gQWZ0ZXIgRm9jdXNPdmVybGF5IGlzIGRlc3Ryb3llZFxuICAgICAgICBvbkRlc3Ryb3k6IGZ1bmN0aW9uKCkge31cbiAgICAgIH0sXG4gICAgICBvcHRpb25zIHx8IHt9XG4gICAgKTtcblxuICAgIC8qKlxuICAgICAqIFNldHVwIG1haW4gc2NvcGVkIGVsZW1lbnQuIEZpcnN0IGV4cGVjdCBhIERPTSBlbGVtZW50LCB0aGVuXG4gICAgICogZmFsbGJhY2sgdG8gYSBzdHJpbmcgcXVlcnlTZWxlY3RvciwgYW5kIGZpbmFsbHkgZmFsbGJhY2sgdG8gPGJvZHk+XG4gICAgICovXG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICB0aGlzLnNjb3BlZEVsID0gZWxlbWVudDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJyB8fCBlbGVtZW50IGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICB0aGlzLnNjb3BlZEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zY29wZWRFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcbiAgICB9XG5cbiAgICAvLyBCaW5kaW5nXG4gICAgdGhpcy5vbktleURvd25IYW5kbGVyID0gdGhpcy5vbktleURvd25IYW5kbGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkZvY3VzSGFuZGxlciA9IHRoaXMub25Gb2N1c0hhbmRsZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLm1vdmVGb2N1c0JveCA9IHRoaXMubW92ZUZvY3VzQm94LmJpbmQodGhpcyk7XG4gICAgdGhpcy5zdG9wID0gdGhpcy5zdG9wLmJpbmQodGhpcyk7XG5cbiAgICAvLyBJbml0aWFsaXplXG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgcGx1Z2luIGluc3RhbmNlLiBBZGQgZXZlbnQgbGlzdGVuZXJzXG4gICAqIHRvIHRoZSB3aW5kb3cgZGVwZW5kaW5nIG9uIHdoaWNoIG9wdGlvbnMgYXJlIGVuYWJsZWQuXG4gICAqL1xuICBpbml0KCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYWx3YXlzQWN0aXZlKSB7XG4gICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXNpbicsIHRoaXMub25Gb2N1c0hhbmRsZXIsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duSGFuZGxlciwgZmFsc2UpO1xuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmluYWN0aXZlT25DbGljaykge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5zdG9wLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fY3JlYXRlRm9jdXNCb3goKTtcbiAgICB0aGlzLm9wdGlvbnMub25Jbml0KHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXIgbWV0aG9kIGZvciB0aGUga2V5ZG93biBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50fVxuICAgKi9cbiAgb25LZXlEb3duSGFuZGxlcihlKSB7XG4gICAgY29uc3QgY29kZSA9IGUud2hpY2g7XG5cbiAgICAvLyBDaGVja3MgaWYgdGhlIGtleSBwcmVzc2VkIGlzIGluIHRoZSB0cmlnZ2VyS2V5cyBhcnJheVxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJpZ2dlcktleXMuaW5jbHVkZXMoY29kZSkpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXNpbicsIHRoaXMub25Gb2N1c0hhbmRsZXIsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIElmcmFtZXMgZG9uJ3QgdHJpZ2dlciBhIGZvY3VzIGV2ZW50IHNvIEkgaGFja2VkIHRoaXMgY2hlY2sgaW4gdGhlcmUuXG4gICAgICAgKiBTbGlnaHQgZGVsYXkgb24gdGhlIHNldFRpbWVvdXQgZm9yIGNyb3NzIGJyb3dzZXIgcmVhc29ucy5cbiAgICAgICAqIFNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjg5MzIyMjAvODg2MjAwNVxuICAgICAgICovXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc3QgYWN0aXZlRWwgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayBpZiB0aGUgYWN0aXZlIGVsZW1lbnQgaXMgYW4gaWZyYW1lLCBpcyBwYXJ0IG9mXG4gICAgICAgICAqIHRoZSBzY29wZSwgYW5kIHRoYXQgZm9jdXNPdmVybGF5IGlzIGN1cnJlbnRseSBhY3RpdmUuXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoXG4gICAgICAgICAgYWN0aXZlRWwgaW5zdGFuY2VvZiBIVE1MSUZyYW1lRWxlbWVudCAmJlxuICAgICAgICAgIHRoaXMuc2NvcGVkRWwuY29udGFpbnMoYWN0aXZlRWwpICYmXG4gICAgICAgICAgdGhpcy5hY3RpdmUgPT09IHRydWVcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5tb3ZlRm9jdXNCb3goYWN0aXZlRWwpO1xuICAgICAgICB9XG4gICAgICB9LCA1KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5pbmFjdGl2ZU9uTm9uVHJpZ2dlcktleSkge1xuICAgICAgdGhpcy5zdG9wKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGZvY3VzQm94IERJViBlbGVtZW50IGFuZCBhcHBlbmRzIGl0c2VsZiB0byB0aGUgRE9NXG4gICAqL1xuICBfY3JlYXRlRm9jdXNCb3goKSB7XG4gICAgdGhpcy5mb2N1c0JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZm9jdXNCb3guc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgdGhpcy5mb2N1c0JveC5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5jbGFzcyk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMuZm9jdXNCb3guc3R5bGUsIHtcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgekluZGV4OiB0aGlzLm9wdGlvbnMuekluZGV4LFxuICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnXG4gICAgfSk7XG5cbiAgICB0aGlzLnNjb3BlZEVsLmluc2VydEFkamFjZW50RWxlbWVudCgnYmVmb3JlZW5kJywgdGhpcy5mb2N1c0JveCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW51cCBtZXRob2QgdGhhdCBydW5zIHdoZW5ldmVyIHZhcmlhYmxlcyxcbiAgICogbWV0aG9kcywgZXRjLiBuZWVkcyB0byBiZSByZWZyZXNoZWQuXG4gICAqL1xuICBfY2xlYW51cCgpIHtcbiAgICAvLyBSZW1vdmUgcHJldmlvdXMgdGFyZ2V0J3MgY2xhc3NlcyBhbmQgZXZlbnQgbGlzdGVuZXJzXG4gICAgaWYgKHRoaXMubmV4dFRhcmdldCAhPSBudWxsKSB7XG4gICAgICB0aGlzLnByZXZpb3VzVGFyZ2V0ID0gdGhpcy5uZXh0VGFyZ2V0O1xuICAgICAgdGhpcy5wcmV2aW91c1RhcmdldC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMub3B0aW9ucy50YXJnZXRDbGFzcyk7XG4gICAgICB0aGlzLnByZXZpb3VzVGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAgIHRoaXMudHJhbnNpdGlvbkV2ZW50LFxuICAgICAgICB0aGlzLm1vdmVGb2N1c0JveFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlciBtZXRob2QgZm9yIHRoZSBmb2N1cyBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50fVxuICAgKi9cbiAgb25Gb2N1c0hhbmRsZXIoZSkge1xuICAgIGNvbnN0IGZvY3VzZWRFbCA9IGUudGFyZ2V0O1xuXG4gICAgdGhpcy5fY2xlYW51cCgpO1xuXG4gICAgLy8gSWYgdGhlIGZvY3VzZWQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIHRoZSBtYWluIGVsZW1lbnRcbiAgICBpZiAodGhpcy5zY29wZWRFbC5jb250YWlucyhmb2N1c2VkRWwpKSB7XG4gICAgICAvLyBWYXJpYWJsZSB0byBiZSBhZGRlZCB0byBvbkJlZm9yZU1vdmUgZXZlbnQgbGF0ZXJcbiAgICAgIGNvbnN0IGN1cnJlbnRFbCA9IHRoaXMubmV4dFRhcmdldDtcblxuICAgICAgdGhpcy5pblNjb3BlID0gdHJ1ZTtcblxuICAgICAgLy8gSWYgdGhlIGZvY3VzZWQgZWxlbWVudCBoYXMgZGF0YS1mb2N1cyB0aGVuIGFzc2lnbiBhIG5ldyAkdGFyZ2V0XG4gICAgICBpZiAoZm9jdXNlZEVsLmdldEF0dHJpYnV0ZSgnZGF0YS1mb2N1cycpICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGZvY3VzU2VsZWN0b3IgPSBmb2N1c2VkRWwuZ2V0QXR0cmlidXRlKCdkYXRhLWZvY3VzJyk7XG5cbiAgICAgICAgdGhpcy5uZXh0VGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICBgW2RhdGEtZm9jdXM9JyR7Zm9jdXNTZWxlY3Rvcn0nXWBcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBJZiB0aGUgZm9jdXNlZCBlbGVtZW50IGhhcyBkYXRhLWZvY3VzLWxhYmVsIHRoZW4gZm9jdXMgdGhlIGFzc29jaWF0ZWQgbGFiZWxcbiAgICAgIH0gZWxzZSBpZiAoZm9jdXNlZEVsLmdldEF0dHJpYnV0ZSgnZGF0YS1mb2N1cy1sYWJlbCcpICE9PSBudWxsKSB7XG4gICAgICAgIGxldCBhc3NvY2lhdGVkRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZm9yPScke2ZvY3VzZWRFbC5pZH0nXWApO1xuXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIGxhYmVsIHBvaW50aW5nIGRpcmVjdGx5IHRvIHRoZSBmb2N1c2VkIGVsZW1lbnQsIHRoZW4gcG9pbnQgdG8gdGhlIHdyYXBwaW5nIGxhYmVsXG4gICAgICAgIGlmIChhc3NvY2lhdGVkRWwgPT09IG51bGwpIHtcbiAgICAgICAgICBhc3NvY2lhdGVkRWwgPSBmb2N1c2VkRWwuY2xvc2VzdCgnbGFiZWwnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubmV4dFRhcmdldCA9IGFzc29jaWF0ZWRFbDtcblxuICAgICAgICAvLyBJZiB0aGUgZm9jdXNlZCBlbGVtZW50IGhhcyBkYXRhLWlnbm9yZSB0aGVuIHN0b3BcbiAgICAgIH0gZWxzZSBpZiAoZm9jdXNlZEVsLmdldEF0dHJpYnV0ZSgnZGF0YS1mb2N1cy1pZ25vcmUnKSAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG5cbiAgICAgICAgLy8gSWYgbm9uZSBvZiB0aGUgYWJvdmUgaXMgdHJ1ZSB0aGVuIHNldCB0aGUgdGFyZ2V0IGFzIHRoZSBjdXJyZW50bHkgZm9jdXNlZCBlbGVtZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm5leHRUYXJnZXQgPSBmb2N1c2VkRWw7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogQ2xlYXIgdGhlIHRpbWVvdXQgb2YgdGhlIGR1cmF0aW9uIGp1c3QgaW4gY2FzZSBpZiB0aGVcbiAgICAgICAqIHVzZXIgZm9jdXNlcyBhIG5ldyBlbGVtZW50IGJlZm9yZSB0aGUgdGltZXIgcnVucyBvdXQuXG4gICAgICAgKi9cbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuXG4gICAgICAvKipcbiAgICAgICAqIElmIHRyYW5zaXRpb25FbmQgaXMgc3VwcG9ydGVkIGFuZCB3YXRjaFRyYW5zaXRpb25FbmQgaXMgZW5hYmxlZFxuICAgICAgICogYWRkIGEgY2hlY2sgdG8gbWFrZSB0aGUgZm9jdXNCb3ggcmVjYWxjdWxhdGUgaXRzIHBvc2l0aW9uXG4gICAgICAgKiBpZiB0aGUgZm9jdXNlZCBlbGVtZW50IGhhcyBhIGxvbmcgdHJhbnNpdGlvbiBvbiBmb2N1cy5cbiAgICAgICAqL1xuICAgICAgaWYgKHRoaXMudHJhbnNpdGlvbkV2ZW50ICYmIHRoaXMub3B0aW9ucy53YXRjaFRyYW5zaXRpb25FbmQpIHtcbiAgICAgICAgdGhpcy5uZXh0VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgdGhpcy50cmFuc2l0aW9uRXZlbnQsXG4gICAgICAgICAgdGhpcy5tb3ZlRm9jdXNCb3hcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vcHRpb25zLm9uQmVmb3JlTW92ZShjdXJyZW50RWwsIHRoaXMubmV4dFRhcmdldCwgdGhpcyk7XG4gICAgICB0aGlzLm1vdmVGb2N1c0JveCh0aGlzLm5leHRUYXJnZXQpO1xuXG4gICAgICAvLyBJZiB0aGUgZm9jdXNlZCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgdGhlIG1haW4gZWxlbWVudCBidXQgYWx3YXlzQWN0aXZlIGRvIG5vdGhpbmdcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5hbHdheXNBY3RpdmUpIHtcbiAgICAgIHRoaXMuaW5TY29wZSA9IGZhbHNlO1xuXG4gICAgICAvLyBJZiB0aGUgZWxlbWVudCBmb2N1c2VkIGlzIG5vdCBhIGNoaWxkIG9mIHRoZSBtYWluIGVsZW1lbnQgc3RvcCBiZWluZyBhY3RpdmVcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pblNjb3BlID0gZmFsc2U7XG4gICAgICB0aGlzLnN0b3AoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5kcyB0aGUgYWN0aXZlIHN0YXRlIG9mIHRoZSBmb2N1c0JveFxuICAgKi9cbiAgc3RvcCgpIHtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1c2luJywgdGhpcy5vbkZvY3VzSGFuZGxlciwgdHJ1ZSk7XG4gICAgdGhpcy5fY2xlYW51cCgpO1xuICAgIHRoaXMuZm9jdXNCb3guY2xhc3NMaXN0LnJlbW92ZSh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmVzIHRoZSBmb2N1c0JveCB0byBhIHRhcmdldCBlbGVtZW50XG4gICAqIEBwYXJhbSB7RWxlbWVudHxFdmVudH0gdGFyZ2V0RWxcbiAgICovXG4gIG1vdmVGb2N1c0JveCh0YXJnZXRFbCkge1xuICAgIC8vIFdoZW4gcGFzc2VkIGFzIGEgaGFuZGxlciB3ZSdsbCBnZXQgdGhlIGV2ZW50IHRhcmdldFxuICAgIGlmICh0YXJnZXRFbCBpbnN0YW5jZW9mIEV2ZW50KSB0YXJnZXRFbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAvLyBNYXJraW5nIGN1cnJlbnQgZWxlbWVudCBhcyBiZWluZyB0YXJnZXRlZFxuICAgIHRhcmdldEVsLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLnRhcmdldENsYXNzKTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRvIHNlZSBpZiB3aGF0IHdlJ3JlIHRhcmdldGluZyBpcyBhY3R1YWxseSBzdGlsbCB0aGVyZS5cbiAgICAgKiBUaGVuIGNoZWNrIHRvIHNlZSBpZiB3ZSdyZSB0YXJnZXRpbmcgYSBET00gZWxlbWVudC4gVGhlcmUgd2FzXG4gICAgICogYW4gSUUgaXNzdWUgd2l0aCB0aGUgZG9jdW1lbnQgYW5kIHdpbmRvdyBzb21ldGltZXMgYmVpbmcgdGFyZ2V0ZWRcbiAgICAgKiBhbmQgdGhyb3dpbmcgZXJyb3JzIHNpbmNlIHlvdSBjYW4ndCBnZXQgdGhlIHBvc2l0aW9uIHZhbHVlcyBvZiB0aG9zZS5cbiAgICAgKi9cbiAgICBpZiAoZG9jdW1lbnQuYm9keS5jb250YWlucyh0YXJnZXRFbCkgJiYgdGFyZ2V0RWwgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICBjb25zdCByZWN0ID0gYWJzb2x1dGVQb3NpdGlvbih0YXJnZXRFbCk7XG4gICAgICBjb25zdCB3aWR0aCA9IGAke3JlY3Qud2lkdGh9cHhgO1xuICAgICAgY29uc3QgaGVpZ2h0ID0gYCR7cmVjdC5oZWlnaHR9cHhgO1xuICAgICAgY29uc3QgbGVmdCA9IGAke3JlY3QubGVmdH1weGA7XG4gICAgICBjb25zdCB0b3AgPSBgJHtyZWN0LnRvcH1weGA7XG5cbiAgICAgIHRoaXMuZm9jdXNCb3guY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuYW5pbWF0aW5nQ2xhc3MpO1xuICAgICAgdGhpcy5mb2N1c0JveC5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG5cbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5mb2N1c0JveC5zdHlsZSwge1xuICAgICAgICB3aWR0aCxcbiAgICAgICAgaGVpZ2h0LFxuICAgICAgICBsZWZ0LFxuICAgICAgICB0b3BcbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZW1vdmUgYW5pbWF0aW5nL2FjdGl2ZSBjbGFzcyBhZnRlciB0aGUgZHVyYXRpb24gZW5kcy5cbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmZvY3VzQm94LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5vcHRpb25zLmFuaW1hdGluZ0NsYXNzKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmluYWN0aXZlQWZ0ZXJEdXJhdGlvbikge1xuICAgICAgICAgIHRoaXMuZm9jdXNCb3guY2xhc3NMaXN0LnJlbW92ZSh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcHRpb25zLm9uQWZ0ZXJNb3ZlKHRoaXMucHJldmlvdXNUYXJnZXQsIHRhcmdldEVsLCB0aGlzKTtcbiAgICAgIH0sIHRoaXMub3B0aW9ucy5kdXJhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NsZWFudXAoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIGRlc3Ryb3kgbWV0aG9kIHRvIGZyZWUgcmVzb3VyY2VzIHVzZWQgYnkgdGhlIHBsdWdpbjpcbiAgICogUmVmZXJlbmNlcywgdW5yZWdpc3RlciBsaXN0ZW5lcnMsIGV0Yy5cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgLy8gUmVtb3ZlIGZvY3VzQm94XG4gICAgdGhpcy5mb2N1c0JveC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZm9jdXNCb3gpO1xuXG4gICAgLy8gUmVtb3ZlIGFueSBleHRyYSBjbGFzc2VzIGdpdmVuIHRvIG90aGVyIGVsZW1lbnRzIGlmIHRoZXkgZXhpc3RcbiAgICB0aGlzLnByZXZpb3VzVGFyZ2V0ICE9IG51bGwgJiZcbiAgICAgIHRoaXMucHJldmlvdXNUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLm9wdGlvbnMudGFyZ2V0Q2xhc3MpO1xuICAgIHRoaXMubmV4dFRhcmdldCAhPSBudWxsICYmXG4gICAgICB0aGlzLm5leHRUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLm9wdGlvbnMudGFyZ2V0Q2xhc3MpO1xuXG4gICAgLy8gUmVtb3ZlIGV2ZW50IGxpc3RlbmVyc1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1c2luJywgdGhpcy5vbkZvY3VzSGFuZGxlciwgdHJ1ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5RG93bkhhbmRsZXIsIGZhbHNlKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5zdG9wLCBmYWxzZSk7XG5cbiAgICB0aGlzLm9wdGlvbnMub25EZXN0cm95KHRoaXMpO1xuICB9XG59XG4iXSwibmFtZXMiOlsiRWxlbWVudCIsInByb3RvdHlwZSIsIm1hdGNoZXMiLCJtc01hdGNoZXNTZWxlY3RvciIsIndlYmtpdE1hdGNoZXNTZWxlY3RvciIsImNsb3Nlc3QiLCJzIiwiZWwiLCJwYXJlbnRFbGVtZW50IiwicGFyZW50Tm9kZSIsIm5vZGVUeXBlIiwiZXh0ZW5kIiwib2JqIiwibmFtZSIsImNvcHkiLCJ0YXJnZXQiLCJhcmd1bWVudHMiLCJpIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwiYWJzb2x1dGVQb3NpdGlvbiIsImZvdW5kIiwibGVmdCIsInRvcCIsIndpZHRoIiwiaGVpZ2h0Iiwib2Zmc2V0QmFzZSIsImRvY3VtZW50IiwiYm9keSIsImNyZWF0ZUVsZW1lbnQiLCJzdHlsZSIsImNzc1RleHQiLCJhcHBlbmRDaGlsZCIsIm93bmVyRG9jdW1lbnQiLCJib3VuZGluZ1JlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJiYXNlUmVjdCIsInJpZ2h0IiwiYm90dG9tIiwidHJhbnNpdGlvbnMiLCJ0cmFuc2l0aW9uIiwiT1RyYW5zaXRpb24iLCJNb3pUcmFuc2l0aW9uIiwiV2Via2l0VHJhbnNpdGlvbiIsInQiLCJGb2N1c092ZXJsYXkiLCJlbGVtZW50Iiwib3B0aW9ucyIsImFjdGl2ZSIsInNjb3BlZEVsIiwiZm9jdXNCb3giLCJwcmV2aW91c1RhcmdldCIsIm5leHRUYXJnZXQiLCJ0aW1lb3V0IiwiaW5TY29wZSIsInRyYW5zaXRpb25FdmVudCIsIndoaWNoVHJhbnNpdGlvbkV2ZW50IiwiY2xhc3MiLCJhY3RpdmVDbGFzcyIsImFuaW1hdGluZ0NsYXNzIiwidGFyZ2V0Q2xhc3MiLCJ6SW5kZXgiLCJkdXJhdGlvbiIsImluYWN0aXZlQWZ0ZXJEdXJhdGlvbiIsInRyaWdnZXJLZXlzIiwiaW5hY3RpdmVPbk5vblRyaWdnZXJLZXkiLCJpbmFjdGl2ZU9uQ2xpY2siLCJhbHdheXNBY3RpdmUiLCJ3YXRjaFRyYW5zaXRpb25FbmQiLCJvbkluaXQiLCJvbkJlZm9yZU1vdmUiLCJvbkFmdGVyTW92ZSIsIm9uRGVzdHJveSIsIlN0cmluZyIsInF1ZXJ5U2VsZWN0b3IiLCJvbktleURvd25IYW5kbGVyIiwiYmluZCIsIm9uRm9jdXNIYW5kbGVyIiwibW92ZUZvY3VzQm94Iiwic3RvcCIsImluaXQiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwiX2NyZWF0ZUZvY3VzQm94IiwiZSIsImNvZGUiLCJ3aGljaCIsImluY2x1ZGVzIiwic2V0VGltZW91dCIsImFjdGl2ZUVsIiwiYWN0aXZlRWxlbWVudCIsIkhUTUxJRnJhbWVFbGVtZW50IiwiY29udGFpbnMiLCJzZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3QiLCJhZGQiLCJPYmplY3QiLCJhc3NpZ24iLCJwb3NpdGlvbiIsInBvaW50ZXJFdmVudHMiLCJpbnNlcnRBZGphY2VudEVsZW1lbnQiLCJyZW1vdmUiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZm9jdXNlZEVsIiwiX2NsZWFudXAiLCJjdXJyZW50RWwiLCJnZXRBdHRyaWJ1dGUiLCJmb2N1c1NlbGVjdG9yIiwiYXNzb2NpYXRlZEVsIiwiaWQiLCJjbGVhclRpbWVvdXQiLCJ0YXJnZXRFbCIsIkV2ZW50IiwicmVjdCIsInJlbW92ZUNoaWxkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0EsQ0FBZSxDQUFDLFlBQVc7TUFDckIsQ0FBQ0EsT0FBTyxDQUFDQyxT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
