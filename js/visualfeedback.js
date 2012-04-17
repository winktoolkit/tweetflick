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

tf.VisualFeedback = (function() {
	var VisualFeedback = function(properties)
	{
		this.uId             = wink.getUId();
		
		this._domNode        = null;
			
		wink.mixin(this, properties);
			
		if (this._validateProperties() === false)return;
		
		this._initProperties();
		this._initDom();
	};
	
	VisualFeedback.prototype = 
	{
		/**
		 * Returns the main DOM node of the Spinner
		 */
		getDomNode: function()
		{
			return this._domNode;
		},
		
		/**
		 * 
		 */
		setColor: function(c) {
			this.color = c;
			this._rgb = _getRGB(c);
		},
		
		/**
		 * 
		 */
		show: function()
		{
			if (!this._underway)
			{
				this._underway = true;
				this._circles.push({
					r: 0
				});
				this._startRendering();
			}
		},
		
		/**
		 * 
		 */
		hide: function(onEnd)
		{
			if (this._underway)
			{
				if (onEnd) {
					this.onEnd = onEnd;
				}
				this._underway = false;
			}
		},
		
		/**
		 * Starts the rendering process
		 */
		_startRendering: function()
		{
			var _this = this;
			if (_this._timer)
			{
				return;
			}
			this._domNode.style.display = "";
			_this._timer = wink.setInterval(_this, '_render', _this.refreshRate);
		},
		
		/**
		 * Stops the rendering process
		 */
		_stopRendering: function()
		{
			clearInterval(this._timer);
			this._timer = null;
			this._domNode.style.display = "none";
			if (this.onEnd) {
				this.onEnd();
			}
		},
		
		/**
		 * 
		 */
		_render: function()
		{
			var _this = this;
			_this._ctx.clearRect(0, 0, _this.size, _this.size);
			
			var i, circles = _this._circles;
			
			for (i = 0; i < circles.length; i++) {
				var circle = circles[i],
					ri = circle.r,
					ri2 = ri + 1;
				
				if (_this._underway && ri < _this._space && ri2 >= _this._space) {
					circles.push({
						r: 0
					});
				}
				circles[i].r = ri2;
				
				if (ri2 > (_this.size / 2)) {
					circles.splice(i, 1);
					i--;
				}
			}
			
			if (circles.length == 0) {
				this._stopRendering();
				return;
			}
			
			var i, circles = _this._circles, l = circles.length;
			for (i = 0; i < l; i++) {
				var circle = circles[i],
					ri = circle.r,
					rgb = _this._rgb,
					alpha = wink.math.round(1 - (ri / (_this.size / 2)), 2),
					ci = "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + (rgb.a * alpha) + ")";
				_drawArc(_this._ctx, _this._cx, _this._cy, ri, ci, _this.linewidth);
			}
		},
		
		/**
		 * Validate the spinner properties
		 */
		_validateProperties: function()
		{
			return true;
		},
		
		/**
		 * Initialize the Spinner DOM node
		 */
		_initDom: function()
		{
			var _this = this,
				dn = _this._domNode = document.createElement('canvas');
			
			wink.fx.translate(dn, 0, 0);
			
			_this._ctx = dn.getContext('2d');
			
			dn.width = _this.size;
			dn.height = _this.size;
			
			if (_this._underway) {
				_this._circles.push({
					r: 0
				});
				_this._render();
				_this._startRendering();
			}
		},
		
		/**
		 * Initialize the lyrics properties
		 */
		_initProperties: function()
		{
			var _this = this,
				_assign = function(p, defaultValue) {
					if (_this[p] === false) {
						_this[p] = false;
						return;
					}
					if (_this[p] === 0) {
						_this[p] = 0;
						return;
					}
					_this[p] = _this[p] || defaultValue;
				};
			
			_assign('size', 200);
			_assign('refreshRate', 50);
			_assign('color', '#000');
			_assign('linewidth', 1);
			_assign('count', 5);
			_assign('underway', true);
			
			_this._cx = _this.size / 2;
			_this._cy = _this.size / 2;
			_this._rgb = _getRGB(_this.color);
			
			_this._space = Math.floor((_this.size / 2) / _this.count);
			_this._circles = [];
			_this._underway = _this.underway;
		}
	};
	
	/**
	 * 
	 */
	var _drawArc = function(ctx, x, y, r, linecolor, linewidth)
	{
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.lineWidth = linewidth;
		ctx.strokeStyle = linecolor || 'transparent';
		ctx.stroke();
	};
	
	/**
	 * 
	 */
	var _getRGB = function(colorS)
	{
		var mt = null,
			rgb = null;
		
		if (!mt) {
			mt = (/^#?([a-fA-F0-9]{1,2})([a-fA-F0-9]{1,2})([a-fA-F0-9]{1,2})$/).exec(colorS);
			if (mt) {
				for (var i = 1; i < 4; i++) {
					mt[i] = mt[i].length == 1 ? mt[i] + mt[i] : mt[i];
				}
				rgb = { r: parseInt(mt[1], 16), g: parseInt(mt[2], 16), b: parseInt(mt[3], 16), a: 1.0 };
			}
		}
		if (!mt) {
			mt = (/[^0-9]*([0-9\.]+)[^0-9]*([0-9\.]+)[^0-9]*([0-9\.]+)[^0-9]*([0-9\.]+)?/).exec(colorS);
			if (mt) {
				rgb = { r: mt[1], g: mt[2], b: mt[3], a: mt[4] || 1.0 };
			}
		}
		return rgb;
	};
	
	return VisualFeedback;
})();