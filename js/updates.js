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
tf.updates = (function() {
	
	var updates = {},
		_currentSearch,
		_updateBtn,
		_flickrContent,
		_twitterContent,
		_scrollerFlickr,
		_scrollerTwitter,
		_currentFb,
		_track,
		_size = 140,
		_daemon,
		_color = "rgb(248, 24, 143)",
		_daemonInterval,
		_loading = false;
	
	/**
	 * 
	 */
	updates.init = function() {
		_daemonInterval = tf.conf.refreshInterval;
		_updateBtn = wink.byId('get_updates_btn');
		_flickrContent = wink.byId('flickr_content');
		_twitterContent = wink.byId('twitter_content');
		
		var scrollbars = {
			backgroundColor: 'rgba(0, 98, 220, 0.6)',
			borderColor: 'rgba(255, 255, 255, 1.0)'
		};
		
		_scrollerFlickr = new wink.ui.layout.Scroller({
			target: "flickr_content",
			direction: "y",
			scrollbars: scrollbars
		});
		_scrollerTwitter = new wink.ui.layout.Scroller({
			target: "twitter_content",
			direction: "y",
			scrollbars: scrollbars
		});
		_scrollerFlickr.autoRefresh({ active: true });
		_scrollerTwitter.autoRefresh({ active: true });
	};
	
	/**
	 * 
	 */
	updates.initListeners = function() {
		wink.ux.touch.addListener(_updateBtn, "start", { context: updates, method: "_start" }, { tracking: false, preventDefault: true });
		wink.ux.touch.addListener(document.body, "move", { context: updates, method: "_move" }, { preventDefault: true });
		wink.ux.touch.addListener(document.body, "end", { context: updates, method: "_end" });
	};
	
	/**
	 * 
	 */
	updates.setSearch = function(search) {
		if (_currentSearch != search) {
			_clearResults();
			_currentSearch = search;
			wink.byId('updates_trend').innerHTML = search;
		}
	};
	
	/**
	 * 
	 */
	updates.setColor = function(c) {
		_color = c;
	};
	
	/**
	 * 
	 */
	var _clearResults = function() {
		_flickrContent.innerHTML = "";
		_twitterContent.innerHTML = "";
		tf.twitterapi.clear();
		tf.flickrapi.clear();
	};
	
	/**
	 * 
	 */
	var _onLoadMore = function() {
		if (_loading || !_currentSearch) {
			return;
		}
		_loading = true
		
		var flickrItem = document.createElement('div');
		var twitterItem = document.createElement('div');
		
		var onFlick = function(item) {
			if (item) {
				wink.addClass(flickrItem, "flickr_item");
				var flickrImg = document.createElement('img');
				flickrItem.appendChild(flickrImg);
				flickrImg.src = item.img;
			}
			_sync.onFlick(item);
		};

		var onTweet = function(tweet) {
			if (tweet) {
				var photo = document.createElement('div'),
				user_text = document.createElement('div'),
				user = document.createElement('div'),
				text = document.createElement('div'),
				img = document.createElement('img');
			
				wink.addClass(twitterItem, "twitter_item");
				wink.addClass(photo, "photo");
				wink.addClass(user_text, "user_text");
				wink.addClass(user, "user");
				wink.addClass(text, "text");
				
				user.innerHTML = tweet.from_user;
				text.innerHTML = tweet.text;
				img.src = tweet.profile_image_url;
				
				photo.appendChild(img);
				user_text.appendChild(user);
				user_text.appendChild(text);
				twitterItem.appendChild(photo);
				twitterItem.appendChild(user_text);
			}
			_sync.onTweet(tweet);
		};
		
		_sync.sync(function(tweet, flickritem) {
			if (tweet) {
				_twitterContent.appendChild(twitterItem);
				_scrollerTwitter.updateViewportSize();
			}
			
			if (flickritem) {
				_flickrContent.appendChild(flickrItem);
				_scrollerFlickr.updateViewportSize();
			}
			
			_loading = false;
		});
		
		tf.flickrapi.getFlickItem(_currentSearch, onFlick);
		tf.twitterapi.getTweet(_currentSearch, onTweet);
	};
	
	var _sync = {
		sync: function(callback) {
			this.flick_s = false;
			this.tweet_s = false;
			this.tweetItem = null;
			this.flickItem = null;
			this.callback = callback;
		},
		onFlick: function(item) {
			this.flick_s = true;
			this.flickItem = item;
			this.onSync();
		},
		onTweet: function(item) {
			this.tweet_s = true;
			this.tweetItem = item;
			this.onSync(item);
		},
		onSync: function() {
			if (this.flick_s && this.tweet_s) {
				this.callback(this.tweetItem, this.flickItem);
			}
		}
	};
	
	/**
	 * 
	 */
	updates._start = function(uxEvent) {
		_currentFb = _getVisualFeedback(uxEvent.x, uxEvent.y);
		document.body.appendChild(_currentFb.obj.getDomNode());
		_currentFb.obj.show();
		wink.fx.translate(_currentFb.obj.getDomNode(), _currentFb.x - (_size / 2), _currentFb.y - (_size / 2));
		
		_track = true;
		_daemon = setInterval(_onLoadMore, _daemonInterval);
	};
	
	/**
	 * 
	 */
	updates._move = function(uxEvent) {
		if (!_track) {
			return;
		}
		var dx = _currentFb.x - uxEvent.x,
			dy = _currentFb.y - uxEvent.y,
			d = Math.sqrt(dx * dx + dy * dy);
		
		if (d > 20) {
			_onStop();
		}
	};
	
	/**
	 * 
	 */
	updates._end = function() {
		if (!_track) {
			return;
		}
		_onStop();
	};
	
	/**
	 * 
	 */
	var _onStop = function() {
		clearInterval(_daemon);
		_currentFb.obj.hide();
		_currentFb = null;
		_track = false;
	};
	
	/**
	 * 
	 */
	var _getVisualFeedback = function(x, y) {
		var vfb = new tf.VisualFeedback({
			refreshRate: 15,
			count: 4,
			size: _size,
			color: _color,
			underway: false,
			onEnd: function() {
				document.body.appendChild(vfb.getDomNode());
			}
		});
		wink.fx.apply(vfb.getDomNode(), {
			position: "absolute",
			top: 0
		});

		var fb = {
			uid: wink.getUId(),
			obj: vfb,
			x: x,
			y: y
		};
		return fb;
	};
	
	return updates;
})();