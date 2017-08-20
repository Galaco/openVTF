'use strict'

var constants = require('./parsers/constants.js');
var image = require('./image.js');
var header = require('./header.js');
var texture = require('./texture.js');

/**
 * VtfReader
 * Internal reader for binary data into correct basic constructs.
 *
 * @param {ArrayBuffer}  bufferData
 *
 * @constructor
 */
VtfReader = function(bufferData) {
	this.bufferData = bufferData;
};

VtfReader.prototype = { 
	/** @type {ArrayBuffer} bufferData */
	bufferData: null,

	/** @type {VtfHeader} header */
	header: null,

	/** @type {Number} currentOffset */
	currentOffset: null,

	/**
	 * Read a char(s).
	 *
	 * @param {Number}  offset
	 * @param {Number}  num
	 *
	 * @returns {String}
	 */
	char: function(offset, num) {
		var a = this.read(offset, num, Int8Array);
		var ret = "";
		for (var i=0; i<num; i++) {
			ret += String.fromCharCode(a[i]);
		}
		return ret;
	},
			
	/**
	 * Read raw data.
	 *
	 * @param {Number}  offset
	 * @param {Number}  num
	 *
	 * @returns {Int8Array}
	 */
	raw: function(offset, num) {
		return this.read(offset, num, Int8Array);
	},
			
	/**
	 * Read an integer(s).
	 *
	 * @param {Number}  offset
	 * @param {Number}  num
	 *
	 * @returns {Int32Array}
	 */
	int: function(offset, num) {
		return this.read(offset, num, Int32Array);
	},
			
	/**
	 * Read a short(s).
	 *
	 * @param {Number}  offset
	 * @param {Number}  num
	 *
	 * @returns {Int16Array}
	 */
	short: function(offset, num) {
		return this.read(offset, num, Int16Array);
	},
			
	/**
	 * Read a float(s).
	 *
	 * @param {Number}  offset
	 * @param {Number}  num
	 *
	 * @returns {Float32Array}
	 */
	float: function(offset, num) {
		return this.read(offset, num, Float32Array);
	},		
			
	/**
	 * Internal read function.
	 *
	 * @param {Number}  offset
	 * @param {Number}  num
	 * @param {Object}  type
	 *
	 * @returns {Object}
	 */
	read: function(offset, num, type) {
		if (!num) num = 1;
		var buf = new type(this.bufferData, offset, num);
		if (num == 1) {
			return buf[0];
		} else {
			var ret = [];
			for (var i=0; i<buf.length; i++) {
				ret.push(buf[i]);
			}
			return ret;
		}
	},

	/**
	 * Read a number of bits and return as a single integer (shouldn't really read more than 1 bytes worth
	 *
	 * @param {Number}  offsetBits
	 * @param {Number}  num
	 * @param {ArrayBuffer}  format
	 *
	 * @returns {Number}
	 */
	readBits: function(offsetBits, num, buffer, blockSize) {
		var b = ((buffer != undefined) ? buffer : this.buffer),
			blockSize = (blockSize == undefined) ? 1 : blockSize,
			byte = b[0],
			rightShiftSize = (((b.byteLength/blockSize) * 8) - (offsetBits+num));

		//Shift right to clear right of num
		byte >>>= rightShiftSize;

		//Shift back again
		byte <<= rightShiftSize;

		//Derive and remove total byte value excluding desired bits (removes bits left of num)
		byte -= (byte - (byte >>> (rightShiftSize+offsetBits)));

		return parseInt(byte);
	},

	loadVtf: function() {
		var header = this.loadHeader();

		//Read thumbnail image
		var thumbnail = this.loadImage(header.lowResImageWidth, header.lowResImageHeight, header.depth, header.lowResImageFormat);

		//Read mipmaps
		var mipmaps = [],
			w = 1,
			h = 1;
		for (var i = 0; i < header.mipmapCount; ++i) {
			var image = this.loadImage(w, h, header.depth, header.highResImageFormat);
			mipmaps.push(image);
			w >>= 1;
			h >>= 1;
		}

		//read high resolution image
		var image = this.loadImage(header.width, header.height, header.depth, header.highResImageFormat, offset);

		return new VtfTexture(bufferData, header, thumbnail, image, mipmaps);
	},

	/**
	 * Load a Vtf header from buffer
	 *
	 */
	loadHeader: function() {
		this.header = new header();
		this.header.signature 			= this.char(0, 4),		//File signature char
		this.header.version 			= this.int(4,1)+'.'+this.int(8,1),	//Version[0].version[1] e.g. 7.2 uint
		this.header.headerSize 			= this.int(12,1),		//Size of header (16 byte aligned, currently 80bytes) uint
		this.header.width 				= this.short(16,1),		//Width of largest mipmap (^2) ushort
		this.header.height 				= this.short(18,1),		//Height of largest mipmap (^2) ushort
		this.header.Flags 				= this.int(20,1),		//VTF Flags uint
		this.header.frames				= this.int(24,1),		//Number of frames (if animated) default: 1 ushort
		this.header.firstFrame			= this.short(28,1),		//First frame in animation (0 based) ushort	
		this.header.reflectivity		= this.float(32,3),		//reflectivity vector float	
		this.header.bumpmapScale		= this.float(48,1),		//Bumpmap scale float
		this.header.highResImageFormat	= this.int(52,1)+1,		//High resolution image format uint
		this.header.mipmapCount			= this.raw(56,1),		//Number of mipmaps uchar
		this.header.lowResImageFormat	= new Int32Array(this.raw(57,4))[0]+1,//Low resolution image format (always DXT1 [=14]) uint
		this.header.lowResImageWidth	= this.raw(61,1),		//Low resolution image width uchar
		this.header.lowResImageHeight	= this.raw(62,1),		//Low resolution image height uchar
		this.header.depth 				= new Int16Array(this.raw(63,2))[0]		//Depth of the largest mipmap in pixels (^2) ushort
			
		this.currentOffset += this.header.headerSize;
		return this.header;
	},

	/**
	 * Load an image
	 *
	 * @param {Number}  width
	 * @param {Number}  height
	 * @param {Number}  depth
	 * @param {Number}  format
	 *
	 */
	loadImage: function(width, height, depth, format) {
		var ctx = this,
			bufferLength = this.computeSize(width, height, format),
			//Trim buffer to correct size
			bufferData = this.bufferData.slice(this.currentOffset, bufferLength);

			this.currentOffset += bufferLength;

		this.imageDataParsers.forEach(function(funcContainer, index) {
			funcContainer.formats.forEach(function(key) {
			if (key == format) {
				bufferData = ctx.parseImageData(bufferData, width, height, depth, format);
				return new image(width, height, depth, bufferData, format);
				}
			});
		});
	},

	/**
	 * Compute the size of the data for an image.
	 *
	 * @param {Number}  width
	 * @param {Number}  height
	 * @param {Number}  format
	 */
	computeSize: function(width, height, format) {
		return width * height * constants.sizePerPixel[constants.formatName[format]];
	},

	/**
	 * Big organised function for reading and converting raw to RGBA
	 *
	 * @param {ArrayBuffer}  buffer
	 * @param {Number}  width
	 * @param {Number}  height
	 * @param {Number}  depth
	 * @param {Number}  format
	 */
	parseImageData: function(buffer, width, height, depth, format) {
		//Standard RGB(A)888(8) formats, including BGR variants
		if ([1,2,3,4,10,11,12,13].indexOf(format) != -1) {
			var parser = require('./parsers/rgba.js');
			return parser.parse(buffer, width, height, depth, format);
		}
		//DXT1
		if ([14].indexOf(format) != -1) {
			var parser = require('./parsers/dxt1.js');
			return parser.parse(buffer, width, height, depth, format);
		}
	}
};

module.exports = VtfReader;