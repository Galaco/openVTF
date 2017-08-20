/**
	 * VtfHeader
	 * Header for a VTF image. Necessary in order to read any texture data.
	 *
	 * @constructor
	 */
	VtfHeader = function() {

	};

	VtfHeader.prototype = {
		/** @type {String} signature */
		signature: null, 

		/** @type {String} version */
		version: null,

		/** @type {Number} headerSize */
		headerSize: null,

		/** @type {Number} width */
		width: null,

		/** @type {Number} height */
		height: null,

		/** @type {Array(uint)} flags */
		flags: null,

		/** @type {Number} frames */
		frames: null,

		/** @type {Number} firstFrame */
		firstFrame: null,

		/** @type {Array} reflectivity */
		reflectivity: null,

		/** @type {Number} bumpmapScale */
		bumpmapScale: null,

		/** @type {String} highResImageFormat */
		highResImageFormat: null,

		/** @type {Number} mipmapCount */
		mipmapCount: null,

		/** @type {String} lowResImageFormat */
		lowResImageFormat: null,

		/** @type {Number} lowResImageWidth */
		lowResImageWidth: null,

		/** @type {Number} lowResImageHeight */
		lowResImageHeight: null,

		/** @type {Number} depth */
		depth: null,
	};

module.exports = VtfHeader;