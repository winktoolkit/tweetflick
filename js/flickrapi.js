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
tf.flickrapi = (function() {
	var _getJson = tf.main.getJson,
		_itemIndex,
		_pageIndex,
		_items,
		_resultsPerPage,
		_currentSearch,
		_stopRequest;
	
	var flickrapi = {};
	
	/**
	 * 
	 */
	flickrapi.init = function() {
		_resultsPerPage = tf.conf.flickrRpp;
		_itemIndex = -1;
		_pageIndex = 1;
		_items = [];
	};
	
	/**
	 * 
	 */
	flickrapi.getFlickItem = function(search, callback) {
		if (tf.conf.flickrPlug) {
			callback({
				img: "http://farm7.static.flickr.com/6109/6219580221_cd828296de_t.jpg",
				alt: "Colorful Paris By Night"
			});
			tf.main.warn("[WARN] using flickr plug for test");
			return;
		}
		
		if (search != _currentSearch) {
			_currentSearch = search;
			_stopRequest = false;
		}
		
		if (_stopRequest) {
			callback();
			return;
		}
		
		_itemIndex++;
		if (_items.length > _itemIndex) {
			return callback(_items[_itemIndex]);
		} else {
			
			_getFlickrItems(search, _pageIndex, _resultsPerPage, function() {
				_pageIndex++;
				if (_items.length <= _itemIndex) {
					callback();
					return;
				}
				callback(_items[_itemIndex]);
			});
		}
	};
	
	/**
	 * 
	 */
	flickrapi.clear = function() {
		_itemIndex = -1;
		_pageIndex = 1;
		_items = [];
	};
	
	/**
	 * 
	 */
	var _flickrItemsLoaded = function(response, callback) {
		if (response) {
			_itemIndex = 0;
			_items = [];
			
			var results = response.photo;
			if (results.length == 0) {
				_stopRequest = true;
			} else {
				var i, l = results.length;
				for (i = 0; i < l; i++) {
					var r = results[i];
					_items.push(_getImage(r));
				}
			}
		}
		callback();
	};
	
	/**
	 * 
	 */
	var _getFlickrItems = function(search, page, perpage, callback) {
		// method: flickr.photos.search
		// params: api_key, text, page, per_page
		// url :   http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=e27330fed9a8a61a8bd63ef46f0c2575&format=json&nojsoncallback=1&page=1&per_page=10&text=paris
	
		var url = 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + tf.conf.flickrApiKey;
		url += '&format=json&page=' + page + '&per_page=' + perpage + '&text=' + encodeURIComponent(search);
		
		tf.main.jsonpRequest(url, "jsoncallback", function(json) {
			if (json.status == "error") {
				tf.main.track("error", "_getFlickrItems");
				alert("cannot get flickr items for " + search + ", please try again later");
				return;
			}
			// Failure: 
			//   "stat"		: "fail",
			//   "code"		: "xxx",
			//   "message"	: "yyy"
			// success:
			//   "stat": "ok"
			//   "photos": { photo: [] }
			
			var obj = json.response;
			if (!obj || !obj.stat) {
				alert("bad flickr result : expected 'stat'");
				return;
			}
			
			if (obj.stat == "fail") {
				alert("flickr error: " + obj.code + ", " + obj.message);
				return;
			}
			
			_flickrItemsLoaded(obj.photos, callback);
		});
	};
    
    /**
     * 
     */
    var _getImage = function(fi) {
		return {
			img: _getImgUrl(fi, "s"),
			imgm: _getImgUrl(fi, "m"),
			alt: fi.title
		};
	};
	
    /**
     * format : s, t, m, z, b
     */
	var _getImgUrl = function(fi, format) {
		// http://farm{farm-id}.static.flickr.com/{server-id}/{id}_{secret}_[mstzb].jpg
		var parts = [ "http://farm", fi.farm, ".static.flickr.com/", fi.server, "/", fi.id, "_", fi.secret, "_", format, ".jpg" ];
		var url = parts.join("");
		return url;
	};
	
	return flickrapi;
})();