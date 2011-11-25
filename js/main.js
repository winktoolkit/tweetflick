/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * Main namespace
 * 
 * @author:
 * 	--> Sylvain LALANDE
 * 
 */
var tf = {
	conf: {
		gtracking: true,			// active google analytics
		proxy: 'server/proxy.php',	// url to use a proxy for request
		maxTrends: 10,				// trends in tag clouds (max = 10)
		tagsPlug: false, 			// plug to test
		tweetsPlug: false,			// plug to test
		flickrPlug: false,			// plug to test
		geonamesPlug: false,		// plug to test
		availablePlacesPlug: false,	// plug to test
		refreshInterval: 1000, 		// time between request to new items
		flickrApiKey: 'e27330fed9a8a61a8bd63ef46f0c2575',
		twitterRpp: 20,				// request result per page
		flickrRpp: 20,				// request result per page
		warnings: true,				// display warning messages
		trendsExpire: 6,			// expiration of saved trends in hours
		
		defaultCities : [ 'New York', 'France', 'Tokyo' ],
		cities: [ 'New York', 'France', 'Tokyo' ],
		plugCities: [ 'New York', 'France', 'Tokyo' ],
		defaultColors : [ '#c0deed', '#0062dc', '#f8188f' ],
		colors: [ '#c0deed', '#0062dc', '#f8188f' ],
		defaultBirdAnimated: true,
		birdAnimated: true
	}
};

/**
 * 
 */
window.onload = function() {
	tf.main.extendComponents();
	tf.main.init();
};

/**
 * 
 */
tf.main = (function() {
	var _headNode,
		_views,
		_slidingPanels,
		_tagClouds,
		_cities,
		_geotimes,
		_clipAreas,
		_tagCloudColors,
		_hidden_tags,
		_trendsline;
	
	var main = {};
	
	/**
	 * 
	 */
	main.init = function() {
		wink.error.logLevel = (tf.conf.warnings ? 1 : 0);
		_headNode = document.getElementsByTagName('head')[0];
		
		_hidden_tags = $('hidden_tags');
		_trendsline = $('trends_line1');
		
		tf.splash.init();
		_initPanels();
		tf.twitterapi.init();
		tf.flickrapi.init();
		tf.geonamesapi.init();
		
		wink.subscribe('/window/events/orientationchange', { context: _orientHandler, method: 'change' });
		
		tf.twitterapi.initAvailablePlaces(function() {
			tf.trends.init();
			tf.updates.init();
			_initListeners();
			tf.confpanel.init();
			
			tf.trends.retrieveTrends(function(trds) {
				_initTagClouds(trds.list);
				tf.splash.ready();
			});
		});
	};
	
	/**
	 * 
	 */
	main.extendComponents = function() {
		// extends TagCloud
		var _tgp = wink.ui.xyz.TagCloud.prototype;
		_tgp.clean = function(t) {
			if (this._movementtracker) {
				this._movementtracker.destroy();
			}
		};
		_tgp.setTarget = function(t) {
			if (this._movementtracker) {
				this._movementtracker.destroy();
				this._movementtracker = new wink.ux.MovementTracker({ target: t });
			}
		};
		
		// extends ColorPicker
		var _cpp = wink.ui.xy.ColorPicker.prototype;
		_cpp.changeColors = function(indexes, colors) {
			var i, l = indexes.length;
			for (i = 0; i < l; i++) {
				this._colors[indexes[i]] = colors[i];
			}
			this._template = "";
			this._createTemplate();
			this._domNode.innerHTML = this._template;
		};
		_cpp._selectColor = function(color) {
			this.hide();
			wink.publish('/colorpicker/events/pickcolor',
			{
				'color': color
			});
		};
		_cpp.hide = function()
		{
			wink.layer.hide();
			this._domNode.style.display = 'none';
			wink.publish('/colorpicker/events/close');
		};
	};
	
	/**
	 * 
	 */
	main.warn = function(s) {
		wink.error.log(s);
	};
	
	/**
	 * 
	 */
	main.track = function(category, action) {
		if (!tf.conf.gtracking) {
			return;
		}
		
		if (_gaq) {
			_gaq.push(['_trackEvent', category, action]);
		}
	};
	
	/**
	 * 
	 */
	main.enter = function() {
		if (!tf.splash.isReady()) {
			return;
		}
		tf.main.track("navigation", "enter");
		
		var splashnode = $('splash'),
			mainnode = $('main');
		
		wink.fx.applyTransition(splashnode, "opacity", "1000ms", "1ms", "default");
		wink.fx.onTransitionEnd(splashnode, function() {
			splashnode.style.display = "none";
		});
		splashnode.style.opacity = 0;
		
		wink.fx.applyTransition(mainnode, "opacity", "1000ms", "100ms", "default");
		mainnode.style.opacity = 1;
		
		tf.trends.updatePosition();
	};
	
	/**
	 * 
	 */
	main.updateLayer = function(color, opacity, zIndex) {
		var layer = wink.layer;
		layer.color = color;
		layer.opacity = opacity;
		if (zIndex) {
			layer.zIndex = zIndex;
		}
		layer.update();
	};
	
	/**
	 * 
	 */
	main.trendSelected = function(param) {
		_slidingPanels.slideTo("view_updates");
		tf.main.track("navigation", "view_updates");
		tf.updates.setSearch(param.tag.trend);
	};
	
	/**
	 * 
	 */
	main.backToTrends = function() {
		_slidingPanels.slideBack();
		tf.main.track("navigation", "view_trends");
		tf.trends.updatePosition();
	};
	
	/**
	 * 
	 */
	main.updateTagCloud = function(index, oldplace, newplace) {
		tf.trends.replace(oldplace, newplace, function(trends) {
			_setTagCloud(index, trends.city, trends.trends.slice(0, tf.conf.maxTrends), trends.geoinfo);
		});
	};
	
	/**
	 * 
	 */
	main.setTagCloudsColor = function(color, scolor, bgcolor, linecolor) {
		_tagCloudColors = [ color, scolor, bgcolor, linecolor ];
		
		if (!_tagClouds) {
			return;
		}
		var i, l = _tagClouds.length;
		for (i = 0; i < l; i++) {
			var tg = _tagClouds[i];
			tg.setTextColor(color, scolor);
			_setClipArea(i, bgcolor, linecolor);
		}
	};
	
	/**
	 * 
	 */
	main.jsonpRequest = function(url, callbackparam, callback) {
		var id = "request_" + wink.getUId();
		main[id] = function(response, error) {
			delete main[id];
			callback({
				status: error ? "error" : "success",
				response: error ? error : response
			});
		};
		var _sep = (url.indexOf("?") != -1) ? "&" : "?",
			_url = url + _sep + callbackparam + "=tf.main." + id;
		
		_loadJs(_url, function() {
			main[id](null, "bad response for url [" + url + "]");
		});
	};
	
	/**
	 * 
	 */
	main.getJson = function(xhr) {
		return _getJson(xhr);
	};
	
	/**
	 * 
	 */
	var _initListeners = function() {
		wink.subscribe('/tagcloud/events/selection', { context: main, method: 'trendSelected' });
		
		$('back_btn').addEventListener('click', wink.bind(main.backToTrends, this), false);
		$('enter_btn').addEventListener('click', wink.bind(main.enter, this), false);
		
		$('conf_btn').addEventListener('click', function() {
			tf.confpanel.show();
		}, false);
		
		tf.updates.initListeners();
	};
	
	/**
	 * 
	 */
	var _orientHandler = {
		change: function() {
			var landscapeView = $('landscape_view');
			if (wink.ux.window.orientation == "horizontal") {
				wink.removeClass(landscapeView, "hidden");
			} else {
				wink.addClass(landscapeView, "hidden");
			}
		}
	};
	
	/**
	 * 
	 */
	var _initPanels = function() {
		_views = [
	  		'view_trends',
	  		'view_updates'
	  	];
	  	
	  	_slidingPanels = new wink.ui.layout.SlidingPanels({
	  		'duration': 300,
	  		'transitionType': 'default',
	  		'pages': _views
	  	});
	  	$('main').appendChild(_slidingPanels.getDomNode());
	};
	
	/**
	 * 
	 */
	var _initTagClouds = function(alltrends) {
		_tagClouds = [];
		_geotimes = [];
		_cities = [];
		_clipAreas = [];
		
		var i, l = alltrends.length;
		for (i = 0; i < l && i < 3; i++) {
			var trendi = alltrends[i];
			_setTagCloud(i, trendi.city, trendi.trends.slice(0, tf.conf.maxTrends), trendi.geoinfo);
			
			
			var _degToRad = wink.math.degToRad,
        		_radToDeg = wink.math.radToDeg,
        		_asDeg = function(angleDeg) {
	        		return (angleDeg - 90);
	        	},
	        	idx = (i + 1),
				geoc = $('geo_' + idx),
				timec = $('time_' + idx),
				container = $('tag_c_' + idx),
				coffx = container.offsetWidth / 2,
				coffy = container.offsetHeight / 2,
				radius = container.offsetHeight / 2 + 4,
				tcx = coffx - timec.offsetWidth / 2,
				tcy = coffy - timec.offsetHeight / 2,
				tx = tcx + (radius * Math.cos(_degToRad(_asDeg(45)))),
				ty = tcy + (radius * Math.sin(_degToRad(_asDeg(45)))),
				gcx = coffx - geoc.offsetWidth / 2,
				gcy = coffy - geoc.offsetHeight / 2,
				gx = gcx + (radius * Math.cos(_degToRad(_asDeg(315)))),
				gy = gcy + (radius * Math.sin(_degToRad(_asDeg(315))));
	        	
	        timec.translate(tx, ty);
			timec.rotate(45);
			
			geoc.translate(gx, gy);
			geoc.rotate(-45);
		}
		
		var _refreshint = 1000;
		setInterval(function() {
			var i, l = _geotimes.length;
			for (i = 0; i < l; i++) {
				var d = _geotimes[i];
				d += _refreshint;
				_geotimes[i] = d;
				_setGeoInfo(i);
			}
		}, _refreshint);
	};
	
	/**
	 * 
	 */
	var _setTagCloud = function(index, city, names, geoinfo) {
		_geotimes[index] = geoinfo.time;
		_cities[index] = city;
		
		var tagCloudContainer = $('tag_c_' + (index + 1));
		
		if (_tagClouds[index]) {
			_tagClouds[index].clean();
			tagCloudContainer.removeChild(_tagClouds[index].getDomNode());
		}
		
		var size;
		if (index == 0)
		{
			size = 390;
		}
		if (index == 1)
		{
			size = 260;
		}
		if (index == 2)
		{
			size = 320;
		}
		var tagcloudSize = Math.floor(size / 3),
			_h = (size - 10) + "px",
			_w = (size - 10) + "px";
			
		wink.fx.apply($('conf_c'), {
			height: "310px",
			width: "310px"
		});
		
		var tagNodes = document.createElement('div');
		_hidden_tags.appendChild(tagNodes);
		var tags = [];
		
		var i, l = names.length;
		for (i = 0; i < l; i++) {
			var name = names[i];
			
			var id = "tag_" + wink.getUId();
			var tagNode = document.createElement('div');
			tagNode.id = id;
			tagNode.innerHTML = name;
			tagNodes.appendChild(tagNode);
			
			tags.push({ id: id, rating: 100, trend: name });
		}
		
		var tagcloud = new wink.ui.xyz.TagCloud({
			tags: tags,
			size: tagcloudSize,
			textColor: _tagCloudColors[0],
			selectedTextColor: _tagCloudColors[1],
			scaleFactors : {
				ratioDepth: 0.8, 
				ratioRating: 0.5
			},
			canMove: true,
			canSelect: true,
			axis: "xy"
		});
		wink.fx.apply(tagCloudContainer, {
			height: _h,
			width: _w
		});
		tagCloudContainer.appendChild(tagcloud.getDomNode());
		
		wink.fx.apply(tagcloud.getDomNode(), {
			"margin-top": (size / 10) + "px"
		});
		_tagClouds[index] = tagcloud;
		_setClipArea(index, _tagCloudColors[2], _tagCloudColors[3]);
		_setGeoInfo(index);
	};
	
	/**
	 * 
	 */
	var _setGeoInfo = function(index) {
		if (!_cities[index]) {
			return;
		}
		var idx = (index + 1),
			geoc = $('geo_' + idx),
			timec = $('time_' + idx),
			d = _geotimes[index];
		
		geoc.innerHTML = _cities[index];
		timec.innerHTML = _getCurrentTime(d);
	};
	
	/**
	 * 
	 */
	var _getCurrentTime = function(date) {
		var d = new Date();
		d.setTime(date);
		
		var s,
			h = "" + d.getHours(),
			m = "" + d.getMinutes(),
			s = "" + d.getSeconds();
		
		if (h.length == 1) {
			h = "0" + h;
		}
		if (m.length == 1) {
			m = "0" + m;
		}
		if (s.length == 1) {
			s = "0" + s;
		}
		s = h + ":" + m + ":" + s;
		return s;
	};
	
	/**
	 * 
	 */
	var _setClipArea = function(index, bgcolor, linecolor) {
		var tagCloudContainer = $('tag_c_' + (index + 1));
		if (_clipAreas[index]) {
			tagCloudContainer.removeChild(_clipAreas[index]);
		}
		var canvas = _getClipArea(tagCloudContainer, tagCloudContainer.offsetHeight / 2, bgcolor, linecolor);
		tagCloudContainer.appendChild(canvas);
		_tagClouds[index].setTarget(canvas);
		_clipAreas[index] = canvas;
	};
	
	/**
	 * 
	 */
	var _getClipArea = function(parent, radius, bgColor, lineColor) {
		var canvas = document.createElement("canvas"),
    		ctx = canvas.getContext("2d"),
    		w = parent.offsetWidth,
        	h = parent.offsetHeight,
        	cx = w / 2,
            cy = h / 2,
            r = radius - 6;
    	
        canvas.width = w;
        canvas.height = h;
        
        var _degToRad = wink.math.degToRad,
        	_radToDeg = wink.math.radToDeg,
        	_asDeg = function(angleDeg) {
        		return (angleDeg - 90);
        	};
        
        var a = -45,
        	r2 = r / 2,
        	r3 = r / 1.4,
        	dx2 = (r3 * Math.cos(_degToRad(_asDeg(a)))),
        	dy2 = (r3 * Math.sin(_degToRad(_asDeg(a)))),
        	cx2 = cx + dx2,
        	cy2 = cy + dy2,
        	grd = ctx.createLinearGradient(0, dy2, 0, -dy2),
        	rgrd = ctx.createRadialGradient(cx, cy, r, cx, cy, 0);
        
        grd.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        grd.addColorStop(0.3, "rgba(255, 255, 255, 0.5)");
        grd.addColorStop(1, "rgba(255, 255, 255, 0.0)");
        
        rgrd.addColorStop(0, "rgba(255, 255, 255, 0.7)");
        rgrd.addColorStop(0.05, "rgba(255, 255, 255, 0.3)");
        rgrd.addColorStop(1, "rgba(255, 255, 255, 0.0)");
        
        wink.fx.apply(canvas, {
        	position: "absolute",
        	top: 0,
        	"z-index": 2
        });
        
        ctx.clearRect(0, 0, w, h);
        
        ctx.save();
        
        ctx.globalCompositeOperation = "source-out";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
        ctx.fill();

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
        
        ctx.restore();
        
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = rgrd;//"rgba(255, 255, 255, 0.2)";
        ctx.fill();
        
        ctx.translate(cx2, cy2);
        ctx.rotate(_degToRad(-45));
        ctx.scale(1, 0.5);
        
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(0, 0, r2, 0, 2 * Math.PI, false);
        ctx.fillStyle = grd;
        ctx.fill();
        
        ctx.restore();
        
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1;
        ctx.strokeStyle = lineColor;
        ctx.stroke();
        
        return canvas;
	};
	
	/**
	 * 
	 */
	var _loadJs = function(url, onerror) {
		var s = document.createElement('script');
		s.type = 'text/javascript';
		
		s.onload = function() {
			s.onload = s.onerror = null;
			_headNode.removeChild(s);
		};
		s.onerror = function() {
			s.onload = s.onerror = null;
			_headNode.removeChild(s);
			onerror();
		};
		s.src = url;
		_headNode.appendChild(s);
	};
	
	/**
	 * 
	 */
	var _getJson = function(xhr) {
		var r = {
			error: false,
			json: null
		};
		var result = xhr.xhrObject.responseText;
		if (!result) {
			r.error = "bad result : content not set";
		}
		
		r.json = wink.json.parse(result);
		
		if (!r.json) {
			r.error = "bad result : json parse error";
		} else if (r.json.result && r.json.result.error) {
			r.error = r.json.result.error;
		}
		return r;
	};
	
	return main;
})();