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
tf.localStorage = (function() {

var wls = window.localStorage
	supported = wls ? true : false,
	_set = {};	

return {
	get: function(key) {
		if (supported && wink.isUndefined(_set[key])) {
			_set[key] = wls.getItem(key);
		}
		return _set[key];
	},
	set: function(key, value) {
		if (supported) {
			wls.setItem(key, value);
		}
		_set[key] = value;
	},
	remove: function(key) {
		if (supported) {
			wls.removeItem(key);
		}
		_set[key] = undefined;
	},
	reset: function() {
		if (supported) {
			wls.clear();
		}
		_set = {};
	}
};

})();