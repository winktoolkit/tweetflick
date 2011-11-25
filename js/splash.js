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
tf.splash = (function() {
	
	var splash = {},
		_sp,
		_birdTimer,
		_animated = false,
		_ready = false,
		_position = 0;
	
	/**
	 * 
	 */
	splash.init = function() {
		_sp = new wink.ui.xy.CSpinner({
			size: 24,
			radius: 5,
			thickness: 7,
			count: 15,
			space: 8,
			fromcolor: '#8ec1da',
			tocolor: '#fff',
			stopcolor: 0.1,
			linecolor: 'transparent',
			linewidth: 1,
			refreshRate: 60
		});
		var node = _sp.getDomNode();
		$('splash_spin').appendChild(node);
		
		wink.fx.apply($('bird_splash'), {
			"transition-duration": '1ms'
		});
		
		wink.fx.onTransitionEnd($('bird_splash'), splash.updatePosition, true);
		
		for ( var i=1; i<7; i++ )
		{
			wink.fx.apply($('splash_bar_' + i), {
				"transition-duration": splash.getRandomNumber(800, 2000) + 'ms',
				"transition-timing-function": "ease-in-out"
			});
			
			wink.fx.onTransitionEnd($('splash_bar_' + i), splash.updateBar);
			
			$('splash_bar_' + i).translate(0, splash.getRandomNumber(-250, -40));
		}
	};
	
	/**
	 * 
	 */
	splash.ready = function() {
		tf.main.track("navigation", "ready");
		
		_sp.toggle();
		
		var spin = $('splash_spin'),
			entertext = $('enter_text');
		
		wink.fx.applyTransition(spin, "opacity", "1000ms", "1ms", "default");
		wink.fx.onTransitionEnd(spin, function() {
			spin.style.display = "none";
			_ready = true;
		});
		spin.style.opacity = 0;
		
		wink.fx.applyTransition(entertext, "opacity", "1000ms", "100ms", "default");
		entertext.style.opacity = 1;
		
		splash.updatePosition();
	};
	
	/**
	 * 
	 */
	splash.isReady = function() {
		return _ready;
	};
	
	/**
	 * 
	 */
	splash.setAnimation = function(animated) {
		_animated = animated;
		splash.updatePosition();
	};
	
	/**
	 * 
	 */
	splash.updatePosition = function()
	{
		if (_animated) {
			(_position >= (window.innerWidth-285))?_position=-400:_position+=10;
			_birdTimer = setTimeout(splash.moveBird, 250);
		}
	};
	
	/**
	 * 
	 */
	splash.moveBird = function()
	{
		clearTimeout(_birdTimer);
		$('bird_splash').translate(_position, 0);
	};
	
	/**
	 * 
	 */
	splash.updateBar = function(event)
	{
		$(event.target.id).translate(0, splash.getRandomNumber(-50, 0));
	};
	
	/**
	 * 
	 */
	splash.getRandomNumber = function(from, to)
	{
		return Math.floor(Math.random() * (to - from + 1) + from);
	};
	
	return splash;
})();