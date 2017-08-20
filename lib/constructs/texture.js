'use strict'

var header = require('./header.js');
var image = require('./image.js');
	


/**
 * VtfTexture
 * Complete representation of a VTF file.
 *
 * @param {ArrayBuffer} buffer
 * @param {header}   header
 * @param {image}    thumbnail
 * @param {image}    image
 * @param {Array}       mipmaps
 *
 * @constructor
 */
VtfTexture = function(bufferData, header, thumbnail, image, mipmaps) {
	this.bufferData	= bufferData;
	this.header 	= header;
	this.thumbnail 	= thumbnail;
	this.image 		= image;
	this.mipmaps  	= mipmaps;
};

VtfTexture.prototype = {	
	/** @type {ArrayBuffer} bufferData */
	bufferData: null,

	/** @type {header} header */
	header: null,
		
	/** @type {Array} mipmaps */
	mipmaps: [],
		
	/** @type {image} thumbnail */
	thumbnail: null,
		
	/** @type {image} image */
	image: null,
};

module.exports = VtfTexture;