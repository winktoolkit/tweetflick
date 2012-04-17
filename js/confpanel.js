/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * @author:
 * 	--> Sylvain LALANDE
 */
tf.confpanel = (function() {
	var confpanel = {},
		_panel,
		_city1,
		_city2,
		_city3,
		_confTmp,
		_colorMarkers,
		_colorpicker,
		_toggleBtn,
		_togglePos,
		_togglectx = {},
		_cpctx = {},
		_displayed = false;
	
	/**
	 * 
	 */
	confpanel.init = function() {
		_colorpicker = new wink.ui.xy.ColorPicker();
		_colorpicker.changeColors([25, 26, 27], tf.conf.colors);
		
		_initStorage();
		_resetConf();
		tf.splash.setAnimation(tf.conf.birdAnimated);
		tf.trends.setAnimation(tf.conf.birdAnimated);
		
		_togglePos = _saveTogglePos();
		_toggleBtn = new wink.ui.xy.ToggleButton({ cssClass:"onoff1", position: _togglePos });
		wink.byId('cfp_tagcloud_toggle').appendChild(_toggleBtn.getDomNode());
		wink.subscribe('/togglebutton/events/switch', { context: _togglectx, method: '_onSwitch' });
		wink.subscribe('/colorpicker/events/close', { context: _cpctx, method: '_onColorPickerClose' });
		
		_resetConfValues();

		_panel = wink.byId('conf_panel');
		_city1 = wink.byId('city_1');
		_city2 = wink.byId('city_2');
		_city3 = wink.byId('city_3');
		
		_panel.style.opacity = 0;
		wink.fx.applyTransition(_panel, 'opacity', '500ms', '1ms', 'default');
		
		wink.byId('reset_btn').addEventListener('click', function() {
			_resetToDefaults();
		}, false);
		wink.byId('cfp_save_btn').addEventListener('click', function() {
			_save();
			confpanel.hide();
		}, false);
		wink.byId('cfp_cancel_btn').addEventListener('click', function() {
			_resetConf();
			_resetConfValues();
			confpanel.hide();
		}, false);
		tf.main.updateLayer('#000', 0.5, 9);
		
		_initPlaces();
		_initColors();
	};
	
	/**
	 * 
	 */
	confpanel.show = function() {
		if (_displayed) {
			return;
		}
		tf.main.track("navigation", "configuration");
		
		wink.fx.onTransitionEnd(_panel, function() {
			_displayed = true;
		});
		wink.layer.show();
		wink.removeClass(_panel, 'hidden');
		wink.fx.apply(_panel, {
			opacity: 1
		});
	};
	
	/**
	 * 
	 */
	confpanel.hide = function() {
		if (!_displayed) {
			return;
		}
		wink.fx.onTransitionEnd(_panel, function() {
			_displayed = false;
			wink.addClass(_panel, 'hidden');
			wink.layer.hide();
		});
		_panel.style.opacity = 0;
	};
	
	/**
	 * 
	 */
	var _saveTogglePos = function() {
		return _confTmp.birdAnimated ? 'right' : 'left';
	};
	
	/**
	 * 
	 */
	var _initPlaces = function() {
		_city1.index = 0;
		_city2.index = 1;
		_city3.index = 2;
		
		var places = tf.twitterapi.getPlaces(), i, l = places.length, defaultPlaces = tf.conf.cities;
		for (i = 0; i < l; i++) {
			var place = places[i],
				name = place.name;
			
			var option1 = document.createElement("option"),
				option2 = document.createElement("option"),
				option3 = document.createElement("option");
			
			option1.text = name;
			option2.text = name;
			option3.text = name;
			
			_city1.add(option1, null);
			_city2.add(option2, null);
			_city3.add(option3, null);
		}

		_city1.addEventListener('change', _onCityChanged, false);
		_city2.addEventListener('change', _onCityChanged, false);
		_city3.addEventListener('change', _onCityChanged, false);
		
		_setCitiesSelectIndex();
	};
	
	/**
	 * 
	 */
	var _initColors = function() {
		var cfp_colors_group = wink.byId('cfp_colors_group');
		
		var i, colors = tf.conf.colors, l = colors.length;
		for (i = 0; i < l; i++) {
			var c = document.createElement('div');
			c.id = 'cfp_color_' + (i + 1);
			c.index = i;
			wink.addClass(c, 'cfp_color');
			wink.fx.apply(c, {
				"background-color": colors[i]
			});
			cfp_colors_group.appendChild(c);
			c.addEventListener('click', _onColorClicked, false);
		}
	};
	
	/**
	 * 
	 */
	var _onCityChanged = function(e) {
		_confTmp.cities[e.target.index] = e.target.value;
	};
	
	/**
	 * 
	 */
	var _onColorClicked = function(e) {
		tf.main.updateLayer('#000', 0.5, 11);
		_colorpicker.show();
		wink.subscribe("/colorpicker/events/pickcolor", { context: colorpickctx, method: '_onColorSelected', arguments: [ e.target.index ] });
		_colorMarkers = new Array().concat(_confTmp.colors);
	};
	
	/**
	 * 
	 */
	var colorpickctx = {
		_onColorSelected: function(params, index) {
			tf.main.updateLayer('#000', 0.5, 9);
			wink.layer.show();
			wink.unsubscribe("/colorpicker/events/pickcolor", { context: colorpickctx, method: '_onColorSelected' });
			_colorMarkers[index] = params.color;
			_applyColorChanges();
		}
	};
	
	/**
	 * 
	 */
	var _applyCityChanges = function() {
		if (_confTmp.cities.join('') == tf.conf.cities.join('')) {
			return;
		}
		
		var i, conf = tf.conf, l = conf.cities.length;
		for (i = 0; i < l; i++) {
			if (conf.cities[i] != _confTmp.cities[i]) {
				tf.main.updateTagCloud(i, conf.cities[i], _confTmp.cities[i]);
			}
		}
	};
	
	/**
	 * 
	 */
	var _setCitiesSelectIndex = function() {
		if (!_city1) {
			return;
		}
		var places = tf.twitterapi.getPlaces(), i, l = places.length, defaultPlaces = _confTmp.cities;
		for (i = 0; i < l; i++) {
			var place = places[i],
				name = place.name;
			
			if (name == defaultPlaces[_city1.index]) {
				_city1.selectedIndex = i;
			} else if (name == defaultPlaces[_city2.index]) {
				_city2.selectedIndex = i;
			} else if (name == defaultPlaces[_city3.index]) {
				_city3.selectedIndex = i;
			}
		}
	};
	
	/**
	 * 
	 */
	var _applyColorChanges = function(force) {
		if ((force !== true) 
		 && _confTmp.colors.join('') == tf.conf.colors.join('')
		 && (_colorMarkers != null && _confTmp.colors.join('') == _colorMarkers.join(''))) {
			return;
		}
		
		var cs = _confTmp.colors,
			csCompare = tf.conf.colors;
		
		if (_colorMarkers) {
			cs = _colorMarkers;
			csCompare = _confTmp.colors;
		}
		
		var c1changed = force || (cs[0] != csCompare[0]),
			c2changed = force || (cs[1] != csCompare[1]),
			c3changed = force || (cs[2] != csCompare[2]);
		
		var h2d = function(h) {
				return parseInt(h, 16);
			},
			toRgb = function(c) {
				var p1, p2, p3;
				if (c.length > 4) {
					p1 = c.substring(1, 3);
					p2 = c.substring(3, 5);
					p3 = c.substring(5, 7);
				} else {
					p1 = c.substring(1, 2);
					p2 = c.substring(2, 3);
					p3 = c.substring(3, 4);
					p1 += p1;
					p2 += p2;
					p3 += p3;
				}
				return { r: h2d(p1), g: h2d(p2), b: h2d(p3) };
			},
			apply = function(n, p, v) {
				var s = {};
				s[p] = v;
				wink.fx.apply(n, s);
			},
			bgcolor = function(n, c) {
				apply(n, "background-color", c);
			},
			color = function(n, c) {
				apply(n, "color", c);
			},
			border = function(n, c) {
				apply(n, "border-color", c);
			},
			applyOnClass = function(f, classname, color) {
				var nodes = document.getElementsByClassName(classname);
				var i, l = nodes.length;
				for (i = 0; i < l; i++) {
					f(nodes[i], color);
				}
			},
			c1 = cs[0], c2 = cs[1], c3 = cs[2],
			rgb1 = toRgb(c1), rgb2 = toRgb(c2), rgb3 = toRgb(c3);
		
		if (c1changed) {
			applyOnClass(bgcolor, 'bgcolor', c1);
		}
		
		if (c3changed) {
			applyOnClass(color, 'textcolor1', c3);
			applyOnClass(border, 'cfp_section', c3);
			applyOnClass(border, 'onoff1', c3);
			applyOnClass(border, 'bordercolor', c3);
			
			applyOnClass(color, 'geo_time', c3);
			
			tf.updates.setColor(c3);
			
			var nodes = wink.byId('cfp_cities').getElementsByTagName('select');
			var i, l = nodes.length;
			for (i = 0; i < l; i++) {
				bgcolor(nodes[i], c3);
			}
		}
		
		tf.main.setTagCloudsColor(rgb2, rgb3, c1, c3);
		
		for (var i = 0; i < 3; i++) {
			var cfpc = wink.byId('cfp_color_' + (i + 1));
			if (!cfpc) {
				break;
			}
			cfpc.style.backgroundColor = cs[i];
		}
		
		if (_colorMarkers) {
			_confTmp.colors = new Array().concat(_colorMarkers);
		}
	};
	
	/**
	 * 
	 */
	var _resetColorChanges = function(force) {
		_applyColorChanges(true);
	};
	
	/**
	 * 
	 */
	var _applyToggleChanges = function() {
		var tpos = _saveTogglePos();
		if (tpos != _togglePos) {
			_toggleBtn._onSwitch();
			_togglePos = tpos;
		}
	};
	
	/**
	 * 
	 */
	_togglectx._onSwitch = function(param) {
		_togglePos = param.position;
		if (param.position == 'right') {
			_confTmp.birdAnimated = true;
		} else {
			_confTmp.birdAnimated = false;
		}
	};
	
	/**
	 * 
	 */
	_cpctx._onColorPickerClose = function() {
		tf.main.updateLayer('#000', 0.5, 9);
		wink.layer.show();
	};
	
	/**
	 * 
	 */
	var _applyAnimationChanges = function() {
		if (_confTmp.birdAnimated == tf.conf.birdAnimated) {
			return;
		}
		tf.splash.setAnimation(_confTmp.birdAnimated);
		tf.trends.setAnimation(_confTmp.birdAnimated);
	};
	
	/**
	 * 
	 */
	var _save = function() {
		var conf = tf.conf;
		
		_applyCityChanges();
		_applyColorChanges();
		_applyAnimationChanges();
		
		conf.cities = new Array().concat(_confTmp.cities);
		conf.colors = new Array().concat(_confTmp.colors);
		conf.birdAnimated = _confTmp.birdAnimated;
		
		_toStorage();
		
		_colorMarkers = null;
	};
	
	/**
	 * 
	 */
	var _resetConf = function() {
		var conf = tf.conf;
		
		_confTmp = {};
		_confTmp.cities = new Array().concat(conf.cities);
		_confTmp.colors = new Array().concat(conf.colors);
		_confTmp.birdAnimated = conf.birdAnimated;
		
		_colorMarkers = null;
	};
	
	/**
	 * 
	 */
	var _resetToDefaults = function() {
		var conf = tf.conf;
		_confTmp.cities = new Array().concat(conf.defaultCities);
		_confTmp.colors = new Array().concat(conf.defaultColors);
		_confTmp.birdAnimated = conf.defaultBirdAnimated;
		
		_colorMarkers = null;
		_resetConfValues();
	};
	
	/**
	 * 
	 */
	var _resetConfValues = function() {
		_resetColorChanges();
		_setCitiesSelectIndex();
		_applyToggleChanges();
	};
	
	/**
	 * 
	 */
	var _initStorage = function() {
		var storage = tf.localStorage,
			cities = storage.get('cities');
		
		if (!cities) {
			_toStorage();
		} else {
			_fromStorage();
			if (tf.conf.tagsPlug) {
				tf.conf.cities = tf.conf.plugCities;
			}
		}
	};
	
	/**
	 * 
	 */
	var _toStorage = function() {
		var conf = tf.conf,
			storage = tf.localStorage;
		storage.set('cities', conf.cities.join(","));
		storage.set('colors', conf.colors.join(","));
		storage.set('birdAnimated', "" + conf.birdAnimated);
	};
	
	/**
	 * 
	 */
	var _fromStorage = function() {
		var conf = tf.conf,
			storage = tf.localStorage;
		
		conf.cities = new Array().concat(storage.get('cities').split(","));
		conf.colors = new Array().concat(storage.get('colors').split(","));
		conf.birdAnimated = (storage.get('birdAnimated') == "true");
	};
	
	return confpanel;
})();