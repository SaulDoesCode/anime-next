/*
 * Anime v1.1.0 - ES6 version
 * http://anime-js.com
 * JavaScript animation engine
 * Copyright (c) 2016 Julian Garnier
 * http://juliangarnier.com
 * Released under the MIT license
 */
(function(root, factory) { // AMD. Register as an anonymous module.
  if (typeof define === 'function' && define.amd) define([], factory); // Node. Does not work with strict CommonJS, but
  // only CommonJS-like environments that support module.exports,
  // like Node.
  else if (typeof module === 'object' && module.exports) module.exports = factory(); // Browser globals (root is window)
  else root.anime = factory();
})(this, function() { // Defaults
  var undef = undefined,
    validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skewX', 'skewY'],
    defaultSettings = {
      duration: 1000,
      delay: 0,
      loop: false,
      autoplay: true,
      direction: 'normal',
      easing: 'easeOutElastic',
      reversed: false,
      elasticity: 400,
      round: false
    }; // Utils
  function includes(arr, searchElement) {
    if (arr.includes) return arr.includes(searchElement);
    if (!is.array(arr)) arr = Array.prototype.slice.call(arr);
    return arr.length === 0 ? false : arr.some(function(item) {
      return item === searchitem;
    });
  }
  var is = function() {
    return {
      array: Array.isArray,
      object: function(a) {
        return includes(Object.prototype.toString.call(a), 'Object');
      },
      html: function(a) {
        return a instanceof NodeList || a instanceof HTMLCollection;
      },
      node: function(a) {
        return a.nodeType;
      },
      bool: function(a) {
        return typeof a === 'boolean';
      },
      svg: function(a) {
        return a instanceof SVGElement;
      },
      number: function(a) {
        return !isNaN(parseInt(a));
      },
      string: function(a) {
        return typeof a === 'string';
      },
      func: function(a) {
        return typeof a === 'function';
      },
      undef: function(a) {
        return typeof a === 'undefined';
      },
      null: function(a) {
        return typeof a === 'null';
      },
      hex: function(a) {
        return (/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a));
      },
      rgb: function(a) {
        return (/^rgb/.test(a));
      },
      rgba: function(a) {
        return (/^rgba/.test(a));
      },
      hsl: function(a) {
        return (/^hsl/.test(a));
      },
      color: function(a) {
        return is.hex(a) || is.rgb(a) || is.rgba(a) || is.hsl(a);
      }
    };
  }();

  function eventemitter(obj) {
    var options = {
      evtlisteners: new Set(),
      __stop: false,
      on: function(type, func) {
        if (!is.func(func)) throw new TypeError('.on(' + type + ',func) : func is not a function');
        func.etype = type;
        func.ehandle = {
          on: function() {
            func.etype = type;
            options.evtlisteners.add(func);
            return options;
          },
          off: function() {
            return options.off(func);
          }
        };
        options.evtlisteners.add(func);
        return func.ehandle;
      },
      once: function(type, func) {
        function funcwrapper() {
          func.apply(obj, arguments);
          options.off(funcwrapper);
        }
        options.on(type, funcwrapper);
        return options;
      },
      off: function(func) {
        if (options.evtlisteners.has(func)) options.evtlisteners.delete(func);
        return options;
      },
      emit: function(type) {
        var _arguments = arguments;
        if (!options.stop) {
          (function() {
            var args = Array.prototype.slice.call(_arguments, 1);
            options.evtlisteners.forEach(function(ln) {
              if (ln.etype == type && !options.__stop) ln.apply(obj, args.concat(ln.ehandle));
            });
          })();
        }
        return options;
      },
      stopall: function(stop) {
        options.__stop = is.bool(stop) ? stop : true;
      }
    };
    Object.keys(options).forEach(function(key) {
      Object.defineProperty(obj, key, {
        value: options[key],
        enumerable: false,
        writable: false
      });
    });
    return obj;
  } // Easings functions adapted from http://jqueryui.com/
  var easings = function() {
      var eases = {},
        functions = {
          Sine: function(t) {
            return 1 - Math.cos(t * Math.PI / 2);
          },
          Circ: function(t) {
            return 1 - Math.sqrt(1 - t * t);
          },
          Elastic: function(t, m) {
            if (t === 0 || t === 1) return t;
            var p = 1 - Math.min(m, 998) / 1000,
              st = t / 1,
              st1 = st - 1,
              s = p / (2 * Math.PI) * Math.asin(1);
            return -(Math.pow(2, 10 * st1) * Math.sin((st1 - s) * (2 * Math.PI) / p));
          },
          Back: function(t) {
            return t * t * (3 * t - 2);
          },
          Bounce: function(t) {
            var pow2 = void 0,
              bounce = 4;
            while (t < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
            return 1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - t, 2);
          }
        };
      ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'].forEach(function(name, i) {
        functions[name] = function(t) {
          return Math.pow(t, i + 2);
        };
      });
      Object.keys(functions).forEach(function(name) {
        var easeIn = functions[name];
        eases['easeIn' + name] = easeIn;
        eases['easeOut' + name] = function(t, m) {
          return 1 - easeIn(1 - t, m);
        };
        eases['easeInOut' + name] = function(t, m) {
          return t < 0.5 ? easeIn(t * 2, m) / 2 : 1 - easeIn(t * -2 + 2, m) / 2;
        };
      });
      eases.linear = function(t) {
        return t;
      };
      return eases;
    }(),
    numberToString = function(val) {
      return is.string(val) ? val : '' + val;
    },
    stringToHyphens = function(str) {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    },
    selectString = function(str) {
      if (is.color(str)) return false;
      try {
        return document.querySelectorAll(str);
      } catch (e) {
        return false;
      }
    }, // Numbers
    random = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }, // Arrays
    toArray = function(o) {
      if (is.array(o)) return o;
      if (is.string(o)) o = selectString(o) || o;
      if (is.html(o)) return [].slice.call(o);
      return [o];
    },
    flattenArr = function(arr) {
      return Array.prototype.reduce.call(arr, function(a, b) {
        return a.concat(is.array(b) ? flattenArr(b) : b);
      }, []);
    },
    groupArrayByProps = function(arr, propsArr) {
      var groups = {};
      arr.forEach(function(o) {
        var group = JSON.stringify(propsArr.map(function(p) {
          return o[p];
        }));
        groups[group] = groups[group] || [];
        groups[group].push(o);
      });
      return Object.keys(groups).map(function(group) {
        return groups[group];
      });
    },
    removeArrDupes = function(arr) {
      return arr.filter(function(item, pos, context) {
        return context.indexOf(item) === pos;
      });
    }, // Objects
    dupeObj = function(o) {
      var newObject = {};
      for (var p in o) {
        newObject[p] = o[p];
      }
      return newObject;
    },
    mergeObjs = function(o1, o2) {
      for (var p in o2) {
        o1[p] = !is.undef(o1[p]) ? o1[p] : o2[p];
      }
      return o1;
    }, // Colors
    hexToRgb = function(hex) {
      hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, function(m, r, g, b) {
        return r + r + g + g + b + b;
      });
      var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex),
        r = parseInt(rgb[1], 16),
        g = parseInt(rgb[2], 16),
        b = parseInt(rgb[3], 16);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    },
    hue2rgb = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    },
    hslToRgb = function(hsl) {
      hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hsl);
      var h = parseInt(hsl[1]) / 360,
        s = parseInt(hsl[2]) / 100,
        l = parseInt(hsl[3]) / 100,
        r = void 0,
        g = void 0,
        b = void 0;
      if (s === 0) r = g = b = l;
      else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s,
          p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return 'rgb(' + r * 255 + ',' + g * 255 + ',' + b * 255 + ')';
    },
    colorToRgb = function(val) {
      return is.rgb(val) || is.rgba(val) ? val : is.hex(val) ? hexToRgb(val) : is.hsl(val) ? hslToRgb(val) : undef;
    }, // Units
    getUnit = function(val) {
      return (/([\+\-]?[0-9|auto\.]+)(%|px|pt|em|rem|in|cm|mm|ex|pc|vw|vh|deg)?/.exec(val)[2]);
    },
    addDefaultTransformUnit = function(prop, val, intialVal) {
      return getUnit(val) ? val : includes(prop, 'translate') ? getUnit(intialVal) ? val + getUnit(intialVal) : val + 'px' : includes(prop, 'rotate') || includes(prop, 'skew') ? val + 'deg' : val;
    }, // Values
    getAnimationType = function(el, prop) {
      if ((is.node(el) || is.svg(el)) && includes(validTransforms, prop)) return 'transform';
      if ((is.node(el) || is.svg(el)) && prop !== 'transform' && getCSSValue(el, prop)) return 'css';
      if ((is.node(el) || is.svg(el)) && (el.getAttribute(prop) || is.svg(el) && el[prop])) return 'attribute';
      if (!is.null(el[prop]) && !is.undef(el[prop])) return 'object';
    },
    getCSSValue = function(el, prop) { // Then return the property value or fallback to '0' when getPropertyValue fails
      if (prop in el.style) return getComputedStyle(el).getPropertyValue(stringToHyphens(prop)) || '0';
    },
    getTransformValue = function(el, prop) {
      var defaultVal = includes(prop, 'scale') ? 1 : 0,
        str = el.style.transform;
      if (!str) return defaultVal;
      var rgx = /(\w+)\((.+?)\)/g,
        match = [],
        props = [],
        values = [];
      while (match = rgx.exec(str)) {
        props.push(match[1]);
        values.push(match[2]);
      }
      var val = values.filter(function(f, i) {
        return props[i] === prop;
      });
      return val.length ? val[0] : defaultVal;
    },
    getInitialTargetValue = function(target, prop) {
      var animtype = getAnimationType(target, prop);
      return animtype === 'transform' ? getTransformValue(target, prop) : animtype === 'css' ? getCSSValue(target, prop) : animtype === 'attribute' ? target.getAttribute(prop) : target[prop] || 0;
    },
    getValidValue = function(values, val, originalCSS) {
      if (is.color(val)) return colorToRgb(val);
      if (getUnit(val)) return val;
      var unit = getUnit(values.to) ? getUnit(values.to) : getUnit(values.from);
      if (!unit && originalCSS) unit = getUnit(originalCSS);
      return unit ? val + unit : val;
    },
    decomposeValue = function(val) {
      var rgx = /-?\d*\.?\d+/g;
      return {
        original: val,
        numbers: numberToString(val).match(rgx) ? numberToString(val).match(rgx).map(Number) : [0],
        strings: numberToString(val).split(rgx)
      };
    },
    recomposeValue = function(numbers, strings, initialStrings) {
      return strings.reduce(function(a, b, i) {
        return a + numbers[i - 1] + (b ? b : initialStrings[i - 1]);
      });
    }, // Animatables
    getAnimatables = function(targets) {
      return (targets ? flattenArr(is.array(targets) ? targets.map(toArray) : toArray(targets)) : []).map(function(t, i) {
        return {
          target: t,
          id: i
        };
      });
    }, // Properties
    getProperties = function(params, settings) {
      var props = [];
      for (var p in params) {
        if (!defaultSettings.hasOwnProperty(p) && p !== 'targets') {
          var prop = is.object(params[p]) ? dupeObj(params[p]) : {
            value: params[p]
          };
          prop.name = p;
          props.push(mergeObjs(prop, settings));
        }
      }
      return props;
    },
    getPropertiesValues = function(target, prop, value, i) {
      var values = toArray(is.func(value) ? value(target, i) : value);
      return {
        from: values.length > 1 ? values[0] : getInitialTargetValue(target, prop),
        to: values.length > 1 ? values[1] : values[0]
      };
    },
    getTweenValues = function(prop, values, type, target) {
      var valid = {};
      if (type === 'transform') {
        valid.from = prop + ('(' + addDefaultTransformUnit(prop, values.from, values.to) + ')');
        valid.to = prop + ('(' + addDefaultTransformUnit(prop, values.to) + ')');
      } else {
        var originalCSS = type === 'css' ? getCSSValue(target, prop) : undef;
        valid.from = getValidValue(values, values.from, originalCSS);
        valid.to = getValidValue(values, values.to, originalCSS);
      }
      return {
        from: decomposeValue(valid.from),
        to: decomposeValue(valid.to)
      };
    },
    getTweensProps = function(animatables, props) {
      var tweensProps = [];
      animatables.forEach(function(animatable, i) {
        var target = animatable.target;
        return props.forEach(function(prop) {
          var animType = getAnimationType(target, prop.name);
          if (animType) {
            var values = getPropertiesValues(target, prop.name, prop.value, i),
              tween = dupeObj(prop);
            tween.animatables = animatable;
            tween.type = animType;
            tween.from = getTweenValues(prop.name, values, tween.type, target).from;
            tween.to = getTweenValues(prop.name, values, tween.type, target).to;
            tween.round = is.color(values.from) || tween.round ? 1 : 0;
            tween.delay = (is.func(tween.delay) ? tween.delay(target, i, animatables.length) : tween.delay) / animation.speed;
            tween.duration = (is.func(tween.duration) ? tween.duration(target, i, animatables.length) : tween.duration) / animation.speed;
            tweensProps.push(tween);
          }
        });
      });
      return tweensProps;
    }, // Tweens
    getTweens = function(animatables, props) {
      var tweensProps = getTweensProps(animatables, props),
        splittedProps = groupArrayByProps(tweensProps, ['name', 'from', 'to', 'delay', 'duration']);
      return splittedProps.map(function(tweenProps) {
        var tween = dupeObj(tweenProps[0]);
        tween.animatables = tweenProps.map(function(p) {
          return p.animatables;
        });
        tween.totalDuration = tween.delay + tween.duration;
        return tween;
      });
    },
    reverseTweens = function(anim, delays) {
      anim.tweens.forEach(function(tween) {
        var toVal = tween.to,
          fromVal = tween.from,
          delayVal = anim.duration - (tween.delay + tween.duration);
        tween.from = toVal;
        tween.to = fromVal;
        if (delays) tween.delay = delayVal;
      });
      anim.reversed = !!anim.reversed;
    }, // will-change
    getWillChange = function(anim) {
      var props = [],
        els = [];
      anim.tweens.forEach(function(tween) {
        if (tween.type === 'css' || tween.type === 'transform') {
          props.push(tween.type === 'css' ? stringToHyphens(tween.name) : 'transform');
          tween.animatables.forEach(function(animatable) {
            return els.push(animatable.target);
          });
        }
      });
      return {
        properties: removeArrDupes(props).join(', '),
        elements: removeArrDupes(els)
      };
    },
    setWillChange = function(anim) {
      var willChange = getWillChange(anim);
      willChange.elements.forEach(function(element) {
        return element.style.willChange = willChange.properties;
      });
    },
    removeWillChange = function(anim) {
      getWillChange(anim).elements.forEach(function(element) {
        return element.style.removeProperty('will-change');
      });
    },
    /* Svg path */ getPathProps = function(path) {
      var el = is.string(path) ? selectString(path)[0] : path;
      return {
        path: el,
        value: el.getTotalLength()
      };
    },
    snapProgressToPath = function(tween, progress) {
      var pathEl = tween.path,
        pathProgress = tween.value * progress,
        point = function(offset) {
          return pathEl.getPointAtLength(progress > 1 ? tween.value + (offset || 0) : pathProgress + (offset || 0));
        },
        p = point(),
        p0 = point(-1),
        p1 = point(+1),
        twnm = tween.name;
      return twnm === 'translateX' ? p.x : twnm === 'translateY' ? p.y : twnm === 'rotate' ? Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI : undef;
    }, // Progress
    getTweenProgress = function(tween, time) {
      var elapsed = Math.min(Math.max(time - tween.delay, 0), tween.duration),
        percent = elapsed / tween.duration,
        progress = tween.to.numbers.map(function(number, p) {
          var start = tween.from.numbers[p],
            eased = easings[tween.easing](percent, tween.elasticity),
            val = tween.path ? snapProgressToPath(tween, eased) : start + eased * (number - start);
          return tween.round ? Math.round(val * tween.round) / tween.round : val;
        });
      return recomposeValue(progress, tween.to.strings, tween.from.strings);
    },
    setAnimationProgress = function(anim, time) {
      var transforms = void 0;
      anim.time = Math.min(time, anim.duration);
      anim.progress = anim.time / anim.duration * 100;
      anim.tweens.forEach(function(tween) {
        tween.currentValue = getTweenProgress(tween, time);
        var progress = tween.currentValue;
        tween.animatables.forEach(function(animatable) {
          var id = animatable.id;
          switch (tween.type) {
            case 'css':
              animatable.target.style[tween.name] = progress;
              break;
            case 'attribute':
              animatable.target.setAttribute(tween.name, progress);
              break;
            case 'object':
              animatable.target[tween.name] = progress;
              break;
            case 'transform':
              if (!transforms) transforms = {};
              if (!transforms[id]) transforms[id] = [];
              transforms[id].push(progress);
              break;
          }
        });
      });
      if (transforms)
        for (var t in transforms) {
          anim.animatables[t].target.style.transform = transforms[t].join(' ');
        }
      anim.emit('update', anim);
      return anim;
    }, // Animation
    createAnimation = function(params) {
      var anim = {
        animatables: getAnimatables(params.targets),
        settings: mergeObjs(params, defaultSettings),
        time: 0,
        progress: 0,
        running: false,
        started: false,
        ended: false
      };
      anim.properties = getProperties(params, anim.settings);
      anim.tweens = getTweens(anim.animatables, anim.properties);
      anim.duration = anim.tweens.length ? Math.max.apply(Math, anim.tweens.map(function(tween) {
        return tween.totalDuration;
      })) : params.duration / animation.speed;
      return eventemitter(anim);
    },
    animations = [],
    engine = {
      raf: 0,
      play: function() {
        engine.raf = requestAnimationFrame(engine.step);
      },
      pause: function() {
        cancelAnimationFrame(engine.raf);
        engine.raf = 0;
      },
      step: function(time) {
        for (var i = 0; i < animations.length; i++) {
          animations[i].tick(time);
        }
        engine.play();
      }
    },
    animation = function(params) {
      var time = {},
        anim = createAnimation(params);
      ['complete', 'begin', 'update'].forEach(function(type) {
        if (is.func(anim.settings[type])) anim.once(type, anim.settings.complete);
      });
      anim.tick = function(now) {
        if (anim.running) {
          anim.ended = false;
          time.current = time.last + now - time.start;
          var s = anim.settings;
          if (time.current >= s.delay) {
            if (!anim.started) anim.emit('begin', anim);
            anim.started = true;
          }
          setAnimationProgress(anim, time.current);
          if (time.current >= anim.duration) {
            if (s.loop) {
              time.start = now;
              if (s.direction === 'alternate') reverseTweens(anim, true);
              if (is.number(s.loop)) s.loop--;
            } else {
              anim.ended = true;
              anim.pause();
              anim.started = false;
              anim.emit('complete', anim);
            }
          }
          time.last = 0;
        }
      };
      anim.seek = function(progress) {
        return setAnimationProgress(anim, progress / 100 * anim.duration);
      };
      anim.pause = function() {
        anim.running = false;
        anim.emit('paused', anim);
        removeWillChange(anim);
        var i = animations.indexOf(anim);
        if (i > -1) animations.splice(i, 1);
        if (!animations.length) engine.pause();
        return anim;
      };
      anim.play = function(params) {
        if (params) anim = mergeObjs(createAnimation(mergeObjs(params, anim.settings)), anim);
        anim.pause();
        anim.running = true;
        time.start = typeof performance != "undefined" ? performance.now() : +Date.now();
        time.last = anim.ended ? 0 : anim.time;
        var s = anim.settings;
        if (s.direction === 'reverse') reverseTweens(anim);
        if (s.direction === 'alternate' && !s.loop) s.loop = 1;
        setWillChange(anim);
        animations.push(anim);
        if (engine.raf == 0) engine.play();
        return anim;
      };
      anim.restart = function() {
        if (anim.reversed) reverseTweens(anim);
        anim.emit('restart', anim);
        anim.pause();
        anim.seek(0);
        return anim.play();
      };
      if (typeof Promise != "undefined") {
        var promise = function(type) {
          Object.defineProperty(anim, type, {
            get: function() {
              return new Promise(function(pass) {
                anim.once(type, pass);
              });
            }
          });
        };
        promise('complete');
        promise('begin');
      } else console.warn("anime : Your browser doesn't support promises.");
      if (anim.settings.autoplay) anim.play();
      return anim;
    }, // Remove on one or multiple targets from all active animations.
    remove = function(elements) {
      var targets = flattenArr(is.array(elements) ? elements.map(toArray) : toArray(elements));
      for (var _animation, i = animations.length - 1; i >= 0; i--) {
        _animation = animations[i];
        for (var tween, t = _animation.tweens.length - 1; t >= 0; t--) {
          tween = _animation.tweens[t];
          for (var a = tween.animatables.length - 1; a >= 0; a--) {
            if (includes(targets, tween.animatables[a].target)) {
              tween.animatables.splice(a, 1);
              if (!tween.animatables.length) _animation.tweens.splice(t, 1);
              if (!_animation.tweens.length) _animation.pause();
            }
          }
        }
      }
    }; // Strings
  // Public
  if (typeof Promise !== "undefined") {
    animation.alldone = function() {
      var anims = flattenArr(arguments);
      return new Promise(function(pass) {
        var i = 1;
        anims.forEach(function(anim) {
          anim.once('complete', function() {
            if (i++ === anims.length) pass(anims);
          });
        });
      });
    };
  }
  animation.speed = 1;
  animation.list = animations;
  animation.remove = remove;
  animation.easings = easings;
  animation.getValue = getInitialTargetValue;
  animation.path = getPathProps;
  animation.random = random;
  animation.includes = includes;
  animation.dupeObj = dupeObj;
  animation.mergeObjs = mergeObjs;
  animation.flattenArr = flattenArr;
  animation.removeArrDupes = removeArrDupes;
  animation.eventemitter = eventemitter;
  animation.play = engine.play;
  animation.pause = engine.pause;
  return animation;
});