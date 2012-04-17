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
tf.trends = (function() {
	var trends = {},
		loadindex,
		cities,
		alltrends,
		onTrendsLoaded,
		_birdTimer,
		_animated = false,
		_position = 0;
	
	/**
	 * 
	 */
	trends.init = function() {
		wink.fx.apply(wink.byId('bird_trends'), {
			"transition-duration": '1ms'
		});
		
		wink.fx.onTransitionEnd(wink.byId('bird_trends'), trends.updatePosition, true);
	};
	
	/**
	 * 
	 */
	trends.retrieveTrends = function(trendCallback) {
		var storage = tf.localStorage,
			hasPlug = tf.conf.tagsPlug && tf.conf.geonamesPlug,
			savedTrends = hasPlug ? null : storage.get("trends"),
			parsedTrends,
			fromStorage = false,
			ct = new Date().getTime();
			
		if (savedTrends) {
			parsedTrends = wink.json.parse(savedTrends);
			
			var trendsDate = parsedTrends.date,
				deltams = (ct - trendsDate),
				delta = Math.floor(deltams / 3600000);
			
			if (delta < tf.conf.trendsExpire) {
				var i, list = parsedTrends.list, l = list.length, cities = [];
				for (i = 0; i < l && i < 3; i++) {
					var trendi = list[i];
					cities[i] = trendi.city;
				}
				var sortAlpha = function(a, b) {
					var nameA = a.toLowerCase(),
						nameB = b.toLowerCase();
					if (nameA < nameB) {
						return -1;
					}
					if (nameA > nameB) {
						return 1;
					}
					return 0;
				};
				
				cities.sort(sortAlpha);
				var confCities = new Array().concat(tf.conf.cities);
				confCities.sort(sortAlpha);
				
				if (cities.join("") == confCities.join("")) {
					fromStorage = true;
				}
			}
			
			if (fromStorage) {
				var i, list = parsedTrends.list, l = list.length;
				for (i = 0; i < l && i < 3; i++) {
					var trendi = list[i],
						geoinfo = trendi.geoinfo;
					geoinfo.time += deltams;
				}
				
				alltrends = parsedTrends.list;
				trendCallback(parsedTrends);
			}
		}
			
		if (!fromStorage) {
			_loadPool(function(alltrends) {
				var trds = {
					date: ct,
					list: alltrends
				};
				storage.set("trends", wink.json.stringify(trds));
				trendCallback(trds);
			});
		}
	};
	
	/**
	 * 
	 */
	trends.replace = function(oldplace, newplace, callback) {
		var i, index, l = alltrends.length;
		for (i = 0; i < l; i++) {
			var trends = alltrends[i];
			if (trends.city == oldplace) {
				index = i;
				break;
			}
		}
		tf.twitterapi.getTrends(newplace, function(trends) {
			tf.geonamesapi.getGeoInfo(newplace, function(c, infos) {
				_addTrends(index, newplace, trends, infos);
				_updateTrends(newplace);
				callback(alltrends[index]);
			});
		});
	};
	
	/**
	 * 
	 */
	trends.setAnimation = function(animated) {
		_animated = animated;
		trends.updatePosition();
	};
	
	/**
	 * 
	 */
	trends.updatePosition = function()
	{
		if (_animated == true) {
			(_position >= window.innerWidth)?_position=-113:_position+=10;
			_birdTimer = setTimeout(trends.moveBird, 250);
		}
	};
	
	/**
	 * 
	 */
	trends.moveBird = function()
	{
		clearTimeout(_birdTimer);
		wink.fx.translate(wink.byId('bird_trends'), _position, 20);
	};
	
	/**
	 * 
	 */
	var _updateTrends = function(newplace) {
		var storage = tf.localStorage,
			savedTrends = storage.get("trends"),
			ct = new Date().getTime();
		
		if (savedTrends) {
			parsedTrends = wink.json.parse(savedTrends);
			
			var trendsDate = parsedTrends.date,
				deltams = (ct - trendsDate);

			var i, l = alltrends.length;
			for (i = 0; i < l && i < 3; i++) {
				var trendi = alltrends[i],
					geoinfo = trendi.geoinfo;

				if (trendi.city != newplace) {
					geoinfo.time = parsedTrends.list[i].geoinfo.time + deltams;
				}
			}
			
			var trds = {
				date: ct,
				list: alltrends
			};
			storage.set("trends", wink.json.stringify(trds));
		}
	};
	
	/**
	 * 
	 */
	var _loadPool = function(callback) {
		cities = tf.conf.cities;
		
		if (tf.conf.tagsPlug) {
			cities = tf.conf.plugCities;
		}
		
		loadindex = 0; 
		alltrends = [];
		onTrendsLoaded = callback;
		_loadNext();
	};
	
	/**
	 * 
	 */
	var _loadNext = function() {
		if (loadindex >= cities.length) {
			onTrendsLoaded(alltrends);
			return;
		}
		var city = cities[loadindex];
		
		tf.twitterapi.getTrends(city, function(trends) {
			tf.geonamesapi.getGeoInfo(city, function(c, infos) {
				_onTrendsLoaded(trends, infos);
			});
		});
	};
	
	/**
	 * 
	 */
	var _onTrendsLoaded = function(trends, geoinfo) {
		_addTrends(loadindex, cities[loadindex], trends, geoinfo);
		loadindex++;
		_loadNext();
	};
	
	/**
	 * 
	 */
	var _addTrends = function(index, city, trends, geoinfo) {
		var citytrends = [];
		
		if (trends) {
			var i, l = trends.length;
			for (i = 0; i < l; i++) {
				var trendi = trends[i];
				citytrends.push(trendi.name);
			}
		}
		
		alltrends[index] = {
			city: city,
			trends: citytrends,
			geoinfo: geoinfo
		};
	};
	
	return trends;
})();