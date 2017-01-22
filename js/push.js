(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) { return; }

  // *** Utility methods ***

  /* eslint-disable no-unused-vars */

  // Useful to convert non-arrays to arrays in addition to doing basic mapping
  var map = function (collection, callback) {
    var result = [];

    for (var i = 0, length = collection.length; i < length; i++) {
      result[i] = callback ? callback(collection[i], i) : collection[i];
    }

    return result;
  };

  var find = function (collection, callback) {
    var result;

    for (var i = 0, length = collection.length; i < length; i++) {
      result = callback(collection[i], i);
      if (result) { return result; }
    }
  };

  var isArray = function (value) {
    return Array.isArray(value);
  };

  var getKeys = function (obj) {
    var keys = [];

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }

    return keys;
  };

  var $ = function (selector, context) {
    return typeof selector === 'string' ? (context || document).querySelectorAll(selector) : selector;
  };

  var $$ = function (selector, context) {
    return isArray(selector) ? selector : map(typeof selector === 'string' ? $(selector, context) : selector);
  };

  var $one = function (selector, context) {
    return typeof selector === 'string' ? (context || document).querySelector(selector) : selector;
  };

  var ensureValue = function (process, callback, returnResult) {
    return function (value) {
      var args = map(arguments).slice(1);

      value = process(value);
      args.unshift(value);

      var result = callback.apply(this, args);

      return returnResult ? result : value;
    };
  };

  var ensureElement = function (callback, returnResult) {
    return ensureValue($one, callback, returnResult);
  };

  var addText = ensureElement(function (tag, text) {
    (text + '').split('\n').forEach(function (text, index) {
      if (index !== 0) { createChild(tag, 'br'); }
      appendChild(tag, document.createTextNode(text));
    });
  });

  var classRegExp = function (className) {
    return new RegExp('(^|\\s)' + className + '($|\\s)');
  };

  var hasClass = ensureElement(function (elem, className) {
    if (elem.className !== '') {
      return classRegExp(className).test(elem.className);
    }
    return false;
  }, true);

  var removeClass = ensureElement(function (elem, className) {
    if (elem.className !== '') {
      elem.className = elem.className.replace(classRegExp(className), ' ').trim();
    }
  });

  var addClass = ensureElement(function (elem, className) {
    className = [].concat(className);

    if (elem.className === '') {
      elem.className = className.join(' ');
    } else {
      find(className, function (value) {
        if (hasClass(elem, value)) { return; }
        elem.className += ' ' + value;
      });
    }
  });

  var toggleClass = ensureElement(function (elem, className) {
    if (hasClass(elem, className)) {
      removeClass(elem, className);
    } else {
      addClass(elem, className);
    }
  });

  var removeElement = ensureElement(function (elem) {
    elem.parentNode.removeChild(elem);
  });

  var appendChild = ensureElement(function (elem, child) {
    elem.appendChild(child);
  });

  var setAttributes = ensureElement(function (elem, attributes) {
    find(getKeys(attributes), function (attribute) {
      if (attributes[attribute] !== undefined) {
        elem.setAttribute(attribute, attributes[attribute]);
      }
    });
  });

  var createElement = function (tag, className, text) {
    var newElem = document.createElement(tag);

    if (className) {
      if (typeof className === 'object' && !isArray(className)) {
        setAttributes(newElem, className);
      } else {
        addClass(newElem, className);
      }
    }

    if (text) {
      addText(newElem, text);
    }

    return newElem;
  };

  var createChild = function (elem, tag, className, text) {
    var child = createElement(tag, className, text);
    appendChild(elem, child);
    return child;
  };

  var closestByClass = function (elem, className) {
    while (elem.parentNode) {
      elem = elem.parentNode;
      if (hasClass(elem, className)) {
        return elem;
      }
    }
  };

  /* eslint-enable no-unused-vars */

  // *** Actual module ***

  const urlBase64ToUint8Array = function (base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const webpushEndpoint = 'http://127.0.0.1:8080/subscription/main/';
  const applicationServerKey = urlBase64ToUint8Array('BBHAHekwOYKm7GI3Lf0tRHfKyW_xFtrDgaSyFFWd1dDdzo17QbnAjgG2OF-s1TbWXI9cBkvzGWT4eIKhVtED8VI');

  const getSubscriptionData = function (subscription) {
    const rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
    const rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';

    const key = rawKey
      ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey)))
      : '';

    const authSecret = rawAuthSecret
      ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret)))
      : '';

    const endpoint = subscription.endpoint;

    return { endpoint, key, authSecret, subscription };
  };

  const getSubscription = function () {
    return navigator.serviceWorker.ready
      .then(registration => registration.pushManager.getSubscription())
      .then(subscription => subscription ? getSubscriptionData(subscription) : false);
  };

  const saveWebPushData = function () {
    return navigator.serviceWorker.ready
      .then(registration => 
        registration.pushManager.getSubscription()
          .then(subscription => subscription || registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          }))
      )
      .then(subscription => getSubscriptionData(subscription))
      .then(({ endpoint, key, authSecret }) => fetch(webpushEndpoint, {
        method: 'post',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({ endpoint, key, authSecret }),
      }))
      .then(() => syncUI());
  };

  const getWebPushData = function () {
    return getSubscription()
      .then(subscriptionData => {
        if (!subscriptionData) { return false; }

        const { key } = subscriptionData;

        if (!key) { throw new Error('Can not handle key less subscriptions'); }

        return fetch(webpushEndpoint + encodeURIComponent(key))
          .then(res => res.ok ? res.json() : false);
      });
  };

  const removeWebPushData = function () {
    return getSubscription()
      .then(subscriptionData => {
        if (!subscriptionData) { return; }

        const { subscription, key } = subscriptionData;

        return Promise.all([
          subscription.unsubscribe(),
          fetch(webpushEndpoint + encodeURIComponent(key), { method: 'delete' })
        ]);
      })
      .catch(err => { console.error('Encountered an error:', err); })
      .then(() => syncUI());
  };

  const blockWhileSyncing = function (callback) {
    const section = $one('#subscribe-section');

    if (!section || hasClass(section, 'syncing')) { return; }

    addClass(section, 'syncing');

    return callback()
      .catch(err => { console.error('Encountered an error:', err); })
      .then(() => { removeClass(section, 'syncing'); });
  };

  const updateUI = function (webpushData) {
    const pushBlock = createElement('p', { id: 'push-block'});

    createChild(pushBlock, 'button', { type: 'button', class: 'btn' }, webpushData ? 'Update push notifications' : 'Get push notifications')
      .addEventListener('click', () => blockWhileSyncing(() => saveWebPushData()));

    if (webpushData) {
      createChild(pushBlock, 'button', { type: 'button', class: 'btn' }, 'Unsubscribe from push')
        .addEventListener('click', () => blockWhileSyncing(() => removeWebPushData()));
    }

    const existingBlock = $one('#push-block');

    if (existingBlock) { removeElement(existingBlock); }

    appendChild('#subscribe-section', pushBlock);
  };

  let isSyncing;
  let queuedSync;

  const syncUI = function () {
    if (isSyncing && queuedSync) { return isSyncing; }

    const sync = Promise.resolve()
      .then(() => getWebPushData())
      .then(webpushData => updateUI(webpushData))
      .catch(err => { console.error('Encountered an error:', err); })
      .then(() => {
        if (queuedSync) {
          isSyncing = queuedSync;
          queuedSync = false;
          return isSyncing;
        }
        isSyncing = false;
      });

    if (isSyncing) {
      queuedSync = sync;
    } else {
      isSyncing = sync;
    }

    isSyncing = sync;

    return isSyncing;
  };

  syncUI();
}());
