'use strict'


/**
 * VtfImage
 * Represents a single Vtf image (thumbnail, mipmap or high-res tex)
 *
 * @param {Number} width
 * @param {Number} height
 * @param {Number} depth
 * @param {ArrayBuffer} bufferData
 */
VtfImage = function(width, height, depth, bufferData, rawFormat) {
	this.width 	 	  = width;
	this.height 	  = height;
	this.depth 		  = depth;
	this.bufferData   = bufferData;
	this.bufferSize   = this.bufferData.byteLength;
	this.alphaChannel = (this.depth == 4);
	this.rawFormat    = rawFormat;
};

VtfImage.prototype = {
	/** @type {Number} width */
	width: null,

	/** @type {Number} height */
	height: null,
	
	/** @type {Number} depth */
	depth: null,
		
	/** @type {Array} format */
	format: null,
		
	/** @type {ArrayBuffer} bufferData */
	bufferData: null,
		
	/** @type {Number} rawFormat */
	rawFormat: null,
		
	/** @type {Number} bufferSize */
	bufferSize: null,
		
	/** @type {Number} alphaChannel */
	hasAlphaChannel: false,

	/**
	 * Get image dimensions [x,y].
	 *
	 * @returns {Array}
	 */
	getDimensions: function() {
		return [this.width, this.height];
	},

	/**
	 * Get data buffer (either array or object).
	 *
	 * @param {Bool}  asObject
	 *
	 * @returns {Object|Array}
	 */
	getDataAsRGBA: function() {
		return this.bufferData;
	}
};


module.exports = VtfImage;