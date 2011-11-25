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
tf.twitterapi = (function() {
	var Xhr = wink.Xhr,
		_getJson = tf.main.getJson,
		_xhr,
		_places,
		_tweetIndex,
		_pageIndex,
		_tweets,
		_resultsPerPage;
	
	var twitterapi = {};
	
	/**
	 * 
	 */
	twitterapi.init = function() {
		_resultsPerPage = tf.conf.twitterRpp;
		_tweetIndex = -1;
		_pageIndex = 1;
		_tweets = [];
	};
	
	/**
	 * 
	 */
	twitterapi.initAvailablePlaces = function(callback) {
		if (tf.conf.availablePlacesPlug) {
			_places = [
				{ name: 'New York', id: 2459115 },
				{ name: 'France', id: 23424819 },
				{ name: 'Tokyo', id: 1118370 }
			];
			_sortPlaces();
			callback();
			tf.main.warn("[WARN] using available Places plug for test");
			return;
		}
		_getPlaces(callback);
	};
	
	/**
	 * 
	 */
	twitterapi.getPlaces = function() {
		return _places;
	};
	
	/**
	 * 
	 */
	twitterapi.getTrends = function(city, callback) {
		var place = _getPlace(city);
		if (!place) {
			tf.main.warn("[WARN] getTrends Error : not referenced place : " + place);
			return;
		}
		
		if (tf.conf.tagsPlug) {
			var plugCities = tf.conf.plugCities;
			if (city == plugCities[0]) {
				callback([
					{ name: "#YouKnowBetter" },
					{ name: "#puttwowordstogethermakeaninsult" },
					{ name: "#BackToTheBronx" },
					{ name: "You The Boss" },
					{ name: "Curtis Granderson" },
					{ name: "God Forgives" },
					{ name: "Game 5" },
					{ name: "Happy Hump Day" },
					{ name: "Good Morning Everyone" },
					{ name: "AJ Burnett" }
				]);
			} else if (city == plugCities[1]) {
				callback([
					{ name: "#steveJobs" },
					{ name: "#ThankYouSteve" },
					{ name: "#iSad" },
					{ name: "Tomas Tranströmer" },
					{ name: "Bill Gates" },
					{ name: "Pixar" },
					{ name: "Fouquet's" },
					{ name: "PMU" },
					{ name: "Roland Dumas" },
					{ name: "Sarah Palin" }
				]);
			} else if (city == plugCities[2]) {
				callback([
					{ name: "#タイトルの一部をニートに変えると悲愴感がヤバい" },
					{ name: "#名前の最初をちにすると皆仲間" },
					{ name: "世界仰天" },
					{ name: "#多分TLで一番ピュア" },
					{ name: "色彩心理" },
					{ name: "正則" },
					{ name: "吉継" },
					{ name: "ハリウッド版" },
					{ name: "全裸結婚式" },
					{ name: "シザーハンズ" }
				]);
			}
			tf.main.warn("[WARN] using tags plug for test");
			return;
		}
		
		_getTrends(place.id, callback);
	};
	
	/**
	 * 
	 */
	twitterapi.getTweet = function(search, callback) {
		if (tf.conf.tweetsPlug) {
			callback({
				text: "Just landed in London! Judas playing on Radio 1 the minute I turn it on! Thank u!! Missed the UK.",
				from_user: "me",
				profile_image_url: "http://a1.twimg.com/profile_images/1575092561/jazy.._normal.png"
			});
			tf.main.warn("[WARN] using tweets plug for test");
			return;
		}
		
		_tweetIndex++;
		if (_tweets.length > _tweetIndex) {
			return callback(_tweets[_tweetIndex]);
		} else {
			_getTweets(search, _pageIndex, _resultsPerPage, function() {
				_pageIndex++;
				if (_tweets.length <= _tweetIndex) {
					callback();
					return;
				}
				callback(_tweets[_tweetIndex]);
			});
		}
	};
	
	/**
	 * 
	 */
	twitterapi.clear = function() {
		_tweetIndex = -1;
		_pageIndex = 1;
		_tweets = [];
	};
	
	/**
	 * 
	 */
	var _getPlace = function(name) {
		var i, l = _places.length;
		for (i = 0; i < l; i++) {
			var place = _places[i];
			if (place.name == name) {
				return place;
			}
		}
		return null;
	};
	
	/**
	 * 
	 */
	var _getTrends = function(woeid, callback) {
		tf.main.jsonpRequest('http://api.twitter.com/1/trends/' + woeid + '.json', "callback", function(json) {
			if (json.status == "error") {
				tf.main.track("error", "_getTrends");
				alert("cannot get last trends, please try again later");
				return;
			}
			var obj = json.response[0];
			if (!obj || !obj.trends) {
				alert("bad trends result: " + obj);
				return;
			}
			callback(obj.trends);
		});
	};
	
	/**
	 * 
	 */
	var _tweetsLoaded = function(response, callback) {
		if (response) {
			_tweetIndex = 0;
			_tweets = [];
			
			var i, results = response.results, l = results.length;
			for (i = 0; i < l; i++) {
				var r = results[i];
				_tweets.push({
					text: r.text,
					profile_image_url: r.profile_image_url,
					source: r.source,
					from_user: r.from_user
				});
			}
		}
		callback();
	};
	
	/**
	 * 
	 */
	var _getTweets = function(q, page, rpp, callback) {
		//q : query (encoded)
		//page : the page number
		//rpp : results per page
		var url = 'http://search.twitter.com/search.json?q=' + encodeURIComponent(q) + "&page=" + page + "&rpp=" + rpp;
		
		tf.main.jsonpRequest(url, "callback", function(json) {
			if (json.status == "error") {
				tf.main.track("error", "_getTweets");
				alert("cannot get tweets for " + q + ", please try again later");
				return;
			}
			_tweetsLoaded(json.response, callback);
		});
	};
	
	/**
	 * 
	 */
	var _placesLoaded = function(response, url, callback) {
		_places = [];
		
		if (response) {
			var i, l = response.length;
			for (i = 0; i < l; i++) {
				var placei = response[i];
				_places.push({
					name: placei.name,
					id: placei.woeid
				});
			}
		}
		_sortPlaces();
		callback();
	};
	
	/**
	 * 
	 */
	var _sortPlaces = function() {
		_places.sort(function(a, b) {
			var nameA = a.name.toLowerCase(),
				nameB = b.name.toLowerCase();
			if (nameA < nameB) {
				return -1;
			}
			if (nameA > nameB) {
				return 1;
			}
			return 0;
		});
	};
	
	/**
	 * 
	 */
	var _getPlaces = function(callback) {
		if (!_xhr) {
			_xhr = new Xhr();
		}
		var url = './server/available.json';
		var xhrctx = {
			s: _getPlacesSuccess,
			f: _getPlacesRequestError
		};
		var sd = _xhr.sendData(
			url,
			null,
			'GET',
			{ context: xhrctx, method: 's', arguments: [ url, callback ] },
			{ context: xhrctx, method: 'f', arguments: [ "Bad response status", url, callback ] },
			null
		);
		if (sd == false) {
			_getPlacesRequestError(_xhr, "bad sendData() parameters", url, callback);
		}
	};
	
	/**
	 * 
	 */
	var _getPlacesSuccess = function(xhr, url, callback) {
		var response = xhr.xhrObject.responseText;
		
		var r = _getJson(xhr);
		if (r.error) {
			_getPlacesRequestError(xhr, r.error, url, callback);
			return;
		}
		
		_placesLoaded(r.json, url, callback);
		_xhr = null;
	};
	
	/**
	 * 
	 */
	var _getPlacesRequestError = function(xhr, error, identifier, callback) {
		alert("Xhr Error: " + error + ", " + identifier);
		_placesLoaded(null, null, callback);
	};
	
	return twitterapi;
})();