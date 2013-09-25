(function(window, undefined){
	'use strict';

	function applyNoise(canvas, cb){
		var
			ctx = canvas.getContext('2d'),
			imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
		;
		if(Uint8ClampedArray && Uint32Array){
			var
				buf = new ArrayBuffer(imageData.data.length),
				buf8 = new Uint8ClampedArray(buf),
				data = new Uint32Array(buf),
				isLittleEndian = true
			;

			// Determine whether Uint32 is little- or big-endian.
			data[1] = 0x0a0b0c0d;

			if (buf[4] === 0x0a && buf[5] === 0x0b && buf[6] === 0x0c &&
				buf[7] === 0x0d) {
				isLittleEndian = false;
			}

			if (isLittleEndian) {
				for (var y = 0; y < canvas.height; ++y) {
					for (var x = 0; x < canvas.width; ++x) {
						var value = (cb(x, y, canvas.width, canvas.height) * 255) & 0xff;

						data[y * canvas.width + x] =
							(255   << 24) |    // alpha
							(value << 16) |    // blue
							(value <<  8) |    // green
							 value;            // red
					}
				}
			} else {
				for (y = 0; y < canvas.height; ++y) {
					for (x = 0; x < canvas.width; ++x) {
						value = (cb(x, y, canvas.width, canvas.height) * 255) & 0xff;

						data[y * canvas.width + x] =
							(value << 24) |    // red
							(value << 16) |    // green
							(value <<  8) |    // blue
							 255;              // alpha
					}
				}
			}

			imageData.data.set(buf8);

		}else{
			for(var x=0;x<canvas.width;++x){
				for(var y=0;y<canvas.height;++y){
					var
						i = (y * canvas.width + x) * 4
					;
					imageData.data[i] =
					imageData.data[i + 1] =
					imageData.data[i + 2] = (cb(x, y, canvas.width, canvas.height) * 255) & 0xff;
					imageData.data[i + 3] = 255;
				}
			}
		}
		ctx.putImageData(imageData, 0, 0);
	}

	var
		document = window['document'],
		Object   = window['Object'],
		Math     = window['Math'],
		PI       = Math['PI'],
		TAU      = PI + PI,
		isNaN = window['isNaN'],
		isFinite = window['isFinite'],
		hasOwn = function(a,b){
			return a ? a['hasOwnProperty'](b) : false;
		},
		extend = function(a,b){
			a.prototype = new b;
			a.prototype['constructor'] = a;
		},
		range    = function(min, max, val){
			return Math['max'](min,
				Math['min'](max,
					((isNaN(val) || !isFinite(val)) ? min : val)
				)
			);
		},
		rangeHasOwn = function(obj, prop, min, max){
			return range(
				min,
				max,
				hasOwn(obj, prop) ? parseFloat(obj[prop]) : min
			);
		},
		toothy = function(options){
			if(options == undefined){
				return;
			}
			this['options'](options);
			this.cache = {}
		}
	;
	toothy.prototype['options'] = function(newOpts){
		this.opts = this.opts || {};
		var
			opts   = this.opts,
			radius = (opts.radius && !hasOwn(newOpts, 'radius'))
				? opts.radius
				: rangeHasOwn(newOpts, 'radius', 10|0, 65536|0),
			C = PI * (radius * radius),
			teeth  = (opts.teeth && !hasOwn(newOpts, 'teeth'))
				? range(1|0, C|0, opts.teeth)|0
				: ( hasOwn(newOpts, 'teeth')
					? rangeHasOwn(newOpts, 'teeth', 1|0, C|0)|0
					: range(1|0, C|0, C / 16)|0
				),
			toothWidth = (opts.toothWidth && !hasOwn(newOpts, 'toothWidth'))
				? range(1|0, C / teeth, opts.toothWidth)
				: ( hasOwn(newOpts, 'toothWidth')
					? rangeHasOwn(newOpts, 'toothWidth', 1|0, C / teeth)
					: range(1|0, radius / teeth, (C / teeth)|0)|0
				),
			toothHeight = (opts.toothHeight && !hasOwn(newOpts, 'toothHeight'))
				? range(-radius, 65536|0, opts.toothHeight)
				: ( hasOwn(newOpts, 'toothHeight')
					? rangeHasOwn(newOpts, 'toothHeight', -radius, 65536|0)
					: range(10, radius, radius / 4)|0
				)
		;
		opts.radius        = radius;
		opts.circumference = C;
		opts.teeth         = teeth;
		opts.toothWidth    = toothWidth;
		opts.toothHeight   = toothHeight;
	}
	toothy.prototype['draw'] = toothy.prototype.draw = function(force){
		throw new Error('Not implemented!');
	}

	var
		rectangle = function(options){
			toothy['call'](this, options);
		},
		outline = function(options){
			toothy['call'](this, options);
		},
		paddedOutline = function(options){
			outline['call'](this, options);
		},
		filled = function(options){
			outline['call'](this, options);
		},
		paddedFilled = function(options){
			paddedOutline['call'](this, options);
		}
	;
	[
		outline
	].forEach(function(e){
		extend(e, toothy);
	});
	[
		paddedOutline,
		filled
	].forEach(function(e){
		extend(e, outline);
	});
	[
		paddedFilled
	].forEach(function(e){
		extend(e, paddedOutline);
	});

	outline.prototype['draw'] = outline.prototype.draw = function(force){
		force = force || this.cache.draw == undefined;
		if(force){
			var
				opts     = this.opts,
				render   = (
					this.cache.draw
					|| document['createElement']('canvas')
				),
				diameter = opts.radius + opts.radius,
				dim    = ((
					(opts.toothHeight < 0)
						? diameter
						: (diameter + opts.toothHeight + opts.toothHeight)
					)
					+ (Math['max'](0,
						(opts.toothHeight < 0
							? -opts.padding
							: opts.padding) * +2
					)) + +4
				),
				dimH   = dim / 2|0,
				angle  = (360 / opts.teeth) * (PI/180),
				ctx
			;
			render['width'] = render['height'] = dim;
			ctx = render['getContext']('2d');
			ctx['save']();
			ctx['translate'](dimH, dimH);
			ctx['rotate'](PI / -2);
			for(var i=0;i<opts.teeth;++i){
				ctx['beginPath']();
				ctx['arc'](0, 0, opts.radius, angle / -2, angle / -4);
				ctx['arc'](0, 0,
					opts.radius + opts.toothHeight,
					angle / -4, angle / 4
				);
				ctx['arc'](0, 0, opts.radius, angle / 4, angle / 2);
				ctx['stroke']();
				ctx['closePath']();
				ctx['rotate'](angle);
			}
			ctx['restore']();
			this.cache.draw = render;
		}
		return this.cache.draw;
	}

	outline.prototype['options'] = function(newOpts){
		toothy.prototype['options']['call'](this, newOpts);
		this.opts.padding = 4|0;
	}

	paddedOutline.prototype['options'] = function(newOpts){
		var
			padding = this.opts ? this.opts.padding : undefined
		;
		outline.prototype['options']['call'](this, newOpts);
		var
			opts    = this.opts,
			padding = (padding && !hasOwn(newOpts, 'padding'))
				? range((opts.radius / -2), 65536|0, padding)|0
				: ( hasOwn(newOpts, 'padding')
					? -rangeHasOwn(
						newOpts,
						'padding',
						(opts.radius / -2),
						65536|0
					)|0
					: range(
						(opts.radius / -2),
						65536|0,
						opts.toothHeight / 4
					)|0
				)
		;
		opts.padding = padding;
	}

	paddedOutline.prototype['draw'] =
	paddedOutline.prototype.draw = function(force){
		force = force || this.cache.draw == undefined;
		if(force){
			var
				opts   = this.opts,
				render = outline.prototype.draw['call'](this, true),
				dimH   = render['width'] / +2,
				ctx    = render['getContext']('2d')
			;
			ctx['translate'](dimH, dimH);
			ctx['beginPath']();
			ctx['arc'](
				0, 0,
				opts.radius + (
					opts.padding < -opts.radius
						? 0
						: (
							opts.toothHeight < 0
							? -opts.padding
							: opts.padding
						)
				), 0, TAU
			);
			ctx['stroke']();
			ctx['closePath']();
			this.cache.draw = render;
		}
		return this.cache.draw;
	}

	filled.prototype['options'] = function(options){
		outline.prototype['options']['call'](this, options);
		if(hasOwn(options, 'noiseCallback')){
			this.opts.noiseCallback = options['noiseCallback'];
		}
	}
	filled.prototype['draw'] = filled.prototype.draw = function(force){
		force = force || this.cache.draw == undefined;
		if(force){
			var
				opts     = this.opts,
				render   = (
					this.cache.draw
					|| document['createElement']('canvas')
				),
				diameter = opts.radius + opts.radius,
				dim    = ((
					(opts.toothHeight < 0)
						? diameter
						: (diameter + opts.toothHeight + opts.toothHeight)
					)
					+ (Math['max'](0,
						(opts.toothHeight < 0
							? -opts.padding
							: opts.padding) * +2
					)) + +4
				),
				dimH   = dim / 2|0,
				angle  = (360 / opts.teeth) * (PI/180),
				ctx
			;
			render['width'] = render['height'] = dim;
			ctx = render['getContext']('2d');
			ctx['save']();
			ctx['translate'](dimH, dimH);
			ctx['rotate'](PI / -2);
			ctx['beginPath']();
			for(var i=0;i<opts.teeth;++i){
				ctx['arc'](0, 0, opts.radius, angle / -2, angle / -4);
				ctx['arc'](0, 0,
					opts.radius + opts.toothHeight,
					angle / -4, angle / 4
				);
				ctx['arc'](0, 0, opts.radius, angle / 4, angle / 2);
				ctx['stroke']();
				ctx['rotate'](angle);
			}
			ctx['fillStyle'] = opts.noiseCallback ? (function(){
				var
					noiseCanvas = document.createElement('canvas')
				;
				noiseCanvas.width = noiseCanvas.height = dim;
				applyNoise(noiseCanvas, opts.noiseCallback);
				return ctx['createPattern'](noiseCanvas, 'repeat');
			})() : '#000';
			console.log(ctx.fillStyle);
			ctx['fill']();
			ctx['closePath']();
			ctx['restore']();
			this.cache.draw = render;
		}
		return this.cache.draw;
	}

	paddedFilled.prototype['options'] = function(options){
		paddedOutline.prototype['options']['call'](this, options);
		if(hasOwn(options, 'noiseCallback')){
			this.opts.noiseCallback = options['noiseCallback'];
		}
	}

	paddedFilled.prototype['draw'] =
	paddedFilled.prototype.draw = function(force){
		force = force || this.cache.draw == undefined;
		if(force){
			var
				opts     = this.opts,
				render   = (
					this.cache.draw
					|| document['createElement']('canvas')
				),
				diameter = opts.radius + opts.radius,
				dim    = ((
					(opts.toothHeight < 0)
						? diameter
						: (diameter + opts.toothHeight + opts.toothHeight)
					)
					+ (Math['max'](0,
						(opts.toothHeight < 0
							? -opts.padding
							: opts.padding) * +2
					)) + +4
				),
				dimH   = dim / 2|0,
				angle  = (360 / opts.teeth) * (PI/180),
				ctx
			;
			render['width'] = render['height'] = dim;
			ctx = render['getContext']('2d');
			ctx['save']();
			ctx['translate'](dimH, dimH);
			ctx['rotate'](PI / -2);
			ctx['beginPath']();
			ctx['arc'](
				0, 0,
				opts.radius + (
					opts.padding < -opts.radius
						? 0
						: (
							opts.toothHeight < 0
							? -opts.padding
							: opts.padding
						)
				), 0, TAU
			);
			ctx['closePath']();
			for(var i=0;i<opts.teeth;++i){
				ctx['arc'](0, 0, opts.radius, angle / -2, angle / -4);
				ctx['arc'](0, 0,
					opts.radius + opts.toothHeight,
					angle / -4, angle / 4
				);
				ctx['arc'](0, 0, opts.radius, angle / 4, angle / 2);
				ctx['rotate'](angle);
			}
			ctx['closePath']();
			ctx['fillStyle'] = opts.noiseCallback ? (function(){
				var
					noiseCanvas = document.createElement('canvas')
				;
				noiseCanvas.width = noiseCanvas.height = dim;
				applyNoise(noiseCanvas, opts.noiseCallback);
				return ctx['createPattern'](noiseCanvas, 'repeat');
			})() : '#000';
			ctx['fill']();
			ctx['fillStyle'] = '#000';
			ctx['globalCompositeOperation'] = 'destination-out';
			ctx['beginPath']();
			if(opts.toothHeight > 0){
				ctx['arc'](
					0, 0,
					opts.radius + (
						opts.padding < -opts.radius
							? 0
							: (
								opts.toothHeight < 0
								? -opts.padding
								: opts.padding
							)
					), 0, TAU
				);
			}else{
				for(var i=0;i<opts.teeth;++i){
					ctx['arc'](0, 0, opts.radius, angle / -2, angle / -4);
					ctx['arc'](0, 0,
						opts.radius + opts.toothHeight,
						angle / -4, angle / 4
					);
					ctx['arc'](0, 0, opts.radius, angle / 4, angle / 2);
					ctx['rotate'](angle);
				}
			}
			ctx['closePath']();
			ctx['fill']();
			ctx['restore']();
			this.cache.draw = render;
		}
		return this.cache.draw;
	}

	toothy['preset'] = {
		'paddedFilled'  : paddedFilled,
		'outline'       : outline,
		'paddedOutline' : paddedOutline,
		'filled'        : filled
	}
	window['toothy'] = toothy;
})(window);
