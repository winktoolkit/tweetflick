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
tf.geonamesapi = (function() {
	var _getJson = tf.main.getJson,
		_username = "google",
		_times;
	
	var geonamesapi = {};
	
	/**
	 * 
	 */
	geonamesapi.init = function() {
		_times = {};
	};
	
	/**
	 * 
	 */
	geonamesapi.getGeoInfos = function(searches, callback) {
		var loadindex = 0,
			infos = [],
			loadNext = function() {
				if (loadindex >= searches.length) {
					callback(searches, infos);
					return;
				}
				var search = searches[loadindex];
				geonamesapi.getGeoInfo(search, onLoaded);
			},
			onLoaded = function(s, info) {
				infos[loadindex] = info;
				loadindex++;
				loadNext();
			};
		loadNext();
	};
	
	/**
	 * 
	 */
	geonamesapi.getGeoInfo = function(search, callback) {
		if (tf.conf.geonamesPlug) {
			var plugCities = tf.conf.plugCities,
				res = null,
				now = new Date(),
				utc = now.getTime() + (now.getTimezoneOffset() * 60000);
			
			if (search == plugCities[0]) {
				res = {
					lat: 40.71427,
					lng: -74.00597,
					time: new Date(utc + (3600000 * -4)).getTime(),
					timezone: 'America/New_York'
				};
			} else if (search == plugCities[1]) {
				res = {
					lat: 46.0,
					lng: 2.0,
					time: new Date(utc + (3600000 * 2)).getTime(),
					timezone: 'Europe/Paris'
				};
			} else if (search == plugCities[2]) {
				res = {
					lat: 35.61488,
					lng: 139.5813,
					time: new Date(utc + (3600000 * 10)).getTime(),
					timezone: 'Asia/Tokyo'
				};
			}
			callback(search, res);
			tf.main.warn("[WARN] using geonames plug for test");
			return;
		}
		
		if (_times[search]) {
			callback(search, _times[search]);
			return;
		}
		
		_getGeoCoords(search, function(coords) {
			if (!coords) {
				callback(search, null);
				return;
			}
			_getGeoTime(coords.lat, coords.lng, function(geotime) {
				var r = {
					lat: coords.lat,
					lng: coords.lng,
					time: _geoTimeToTimestamp(geotime.time),
					timezone: geotime.timezoneId
				};
				_times[search] = r;
				callback(search, r);
			});
		});
	};
	
	/**
	 * 
	 */
	var _geoTimeToTimestamp = function(time) {
		if (!time) {
			return;
		}
		var m = /([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})[ ]([0-9]{1,2}):([0-9]{1,2})/.exec(time);
		var d = new Date();
		if (m) {
			d.setYear(parseFloat(m[1]));
			d.setMonth(parseFloat(m[2]) - 1);
			d.setDate(parseFloat(m[3]));
			d.setHours(parseFloat(m[4]));
			d.setMinutes(parseFloat(m[5]));
		}
		return d.getTime();
	};
	
	/**
	 * 
	 */
	var _geoCoordsLoaded = function(response, callback) {
		var coords = null;
		if (response) {
			coords = {
				lat: response.lat,
				lng: response.lng
			};
		}
		callback(coords);
	};
	
	/**
	 * 
	 */
	var _getGeoCoords = function(search, callback) {
		var url = 'http://api.geonames.org/search?q=' + encodeURIComponent(search) + '&maxRows=1&type=json&username=' + _username;
		
		tf.main.jsonpRequest(url, "callback", function(json) {
			if (json.status == "error") {
				tf.main.track("error", "_getGeoCoords");
				alert("cannot get geo coords for " + search + ", please try again later");
				return;
			}
			var obj = json.response.geonames;
			if (!obj || !obj[0] || !obj[0].lat || !obj[0].lng) {
				alert("bad geo coords result : expected geonames lat lng");
				return;
			}
			_geoCoordsLoaded(obj[0], callback);
		});
	};
	
	/**
	 * 
	 */
	var _geoTimeLoaded = function(response, callback) {
		var time = null;
		if (response) {
			time = response;
		}
		callback(time);
	};
	
	/**
	 * 
	 */
	var _getGeoTime = function(lat, lng, callback) {
		var url = 'http://api.geonames.org/timezoneJSON?lat=' + lat + '&lng=' + lng + '&username=' + _username;
		
		tf.main.jsonpRequest(url, "callback", function(json) {
			if (json.status == "error") {
				tf.main.track("error", "_getGeoTime");
				alert("cannot get timezone for (" + lat + ", " + lng + "), please try again later");
				return;
			}
			_geoTimeLoaded(json.response, callback);
		});
	};
	
	return geonamesapi;
})();