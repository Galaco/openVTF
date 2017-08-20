//****************************************************//
// VTF can contain image data in many, many formats   //
// Some formats are not currently supported.          //
// Some formats will NEVER be supported.              //
//****************************************************//
(function(root){
	/**
	 * Objects containing constants and types used by the VTF format
	 */
	VtfDefinitions = {
		'formatName': {
			0  : 'NONE',
			1  : 'RGBA8888',
			2  : 'ABGR8888',
			3  : 'RGB888',
			4  : 'BGR888',
			5  : 'RGB565',				//Will never support
			6  : 'I8',					//Will never support
			7  : 'IA88',				//Will never support
			8  : 'P8',					//Will never support
			9  : 'A8',					//Will never support
			10 : 'RGB888_BLUESCREEN',
			11 : 'BGR888_BLUESCREEN',
			12 : 'ARGB8888',
			13 : 'BGRA8888',
			14 : 'DXT1',				//Very early support
			15 : 'DXT3',				//Unsupported
			16 : 'DXT5',				//Unsupported
			17 : 'BGRX8888',			//Will never support
			18 : 'BGR565',				//Will never support
			19 : 'BGRX5551',			//Will never support
			20 : 'BGRA4444',			//Will never support
			21 : 'DXT1_ONEBITALPHA',	//Will never support
			22 : 'BGRA5551',			//Will never support
			23 : 'UV88',				//Will never support
			24 : 'UVWQ8888',			//Will never support
			25 : 'RGBA16161616F',		//Will never support
			26 : 'RGBA16161616',		//Will never support
			27 : 'UVLX8888'				//Will never support
		},
		//Order (or size in bytes per pixel if compressed)
		'format': {
			'RGBA8888' 			: [0,1,2,3],
			'ABGR8888' 			: [3,2,1,0],
			'RGB888'   			: [0,1,2],
			'BGR888'   			: [2,1,0],
			'RGB888_BLUESCREEN' : [0,1,2],
			'BGR888_BLUESCREEN' : [2,1,0],
			'ARGB8888' 		    : [3,0,1,2],
			'BGRA8888' 			: [2,1,0,3],
			'DXT1'	   			: 0,			//Very early support
			'DXT3'     			: 0,			//Unsupported
			'DXT5'     			: 0,			//Unsupported
		},
		//Size of a single pixel in bytes (e.g RGB888 = 3)
		'sizePerPixel': {
			'RGBA8888' 			: 4,
			'ABGR8888' 			: 4,
			'RGB888'   			: 3,
			'BGR888'   			: 3,
			'RGB888_BLUESCREEN' : 3,
			'BGR888_BLUESCREEN' : 3,
			'ARGB8888' 		    : 4,
			'BGRA8888' 			: 4,
			'DXT1'	   			: 0.5,			//Very early support
			'DXT3'     			: 0,			//Unsupported
			'DXT5'     			: 0,			//Unsupported
		}
	};


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


	/**
	 * VtfTexture
	 * Complete representation of a VTF file.
	 *
	 * @param {ArrayBuffer} buffer
	 * @param {VtfHeader}   header
	 * @param {VtfImage}    thumbnail
	 * @param {VtfImage}    image
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

		/** @type {VtfHeader} header */
		header: null,
		
		/** @type {Array} mipmaps */
		mipmaps: [],
		
		/** @type {VtfImage} thumbnail */
		thumbnail: null,
		
		/** @type {VtfImage} image */
		image: null,
	};


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
			this.header = new VtfHeader();
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
						return new VtfImage(width, height, depth, bufferData, format);
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
			return width * height * VtfDefinitions.sizePerPixel[VtfDefinitions.formatName[format]];
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
				var rgbaOrder = VtfDefinitions.format[VtfDefinitions.formatName[format]],
					tempData = [],
					depth = rgbaOrder.length,
					reorderOffset = 0,
					dataSize = width*height*depth;

				//Reorder rgb(a) data from stored format to rgb format
				for (var pixel=0; pixel<dataSize; pixel+=depth) {
					for(var i=0; i<depth; i++) {
						tempData[reorderOffset] = this.bufferData[pixel+rgbaOrder[i]];
						reorderOffset++;
					}
					//Quietly force an alpha channel into our sorted data
					if (depth == 3) {
						tempData[reorderOffset] = 255;
						reorderOffset++;
					}
				}

				return new Uint8Array(tempData);
			}

			//DXT1
			if ([14].indexOf(format) != -1) {
				//DXT1
				//4x4blocks 
				//Each block stores 2 colours in 5.6.5 format
				//for each pixel,2bit value to interpolate between color1 and color2
				var output           = [],
					blockSize        = 4,
					blockSizeInBytes = 8,
					pixelMaxLerpSize = 4,
					depth            = 3, //this needs to be changed to 4 when code works to get rgba data correctly onto canvas
					blockWidth       = width/blockSize,
					blockHeight      = height/blockSize,
					blocksPerRow     = width/blockWidth,
					totalBlocks      = blockWidth * blockHeight;
				//Iterate 4x4 8byte blocks
				for (var i=0; i<totalBlocks; i++) {
					//Read 4x4 block
					var block = new Uint16Array(this.bufferData, i*blockSizeInBytes, blockSize); //confirm this is correct
					//read colour1 and 2
					var min = [
						parseInt(255 * (this.readBits(0,5, block, blockSize) / 32)),
						parseInt(255 * (this.readBits(5,6, block, blockSize) / 64)),
						parseInt(255 * (this.readBits(11,5, block, blockSize) / 32))
					];
					var max = [
						parseInt(255 * (this.readBits(0,5, block.slice(1,2), blockSize) / 32)),
						parseInt(255 * (this.readBits(5,6, block.slice(1,2), blockSize) / 64)),
						parseInt(255 * (this.readBits(11,5, block.slice(1,2), blockSize) / 32))
					];

					//Determine difference between colours
					var minmaxVariance = [
						Math.abs(min[0] - max[0]), 
						Math.abs(min[1] - max[1]), 
						Math.abs(min[2] - max[2])
					];

					//Determine correct block start offset
					//(entire block row size) * ((Current block row) + (offset from first of block in row))
					var blockOffset = (depth * blocksPerRow) * (((blocksPerRow*blockHeight)*Math.floor(i / (width/blocksPerRow))) + (i % blocksPerRow));

					for(var j=0; j<16; ++j) {
						//(entire row size) * (current vertical row) + (offset from first of block row)
						var pixelOffset = (width*depth)*(Math.floor(j / blockWidth))+((j%blockWidth)*depth);
						var offset = blockOffset + pixelOffset;

						for (var k=0; k<depth; k++) {
							//read the bits and interpolate, and store the interpolated r/g/b value
							output[offset+k] = parseInt(min[k] + ((((this.readBits(k*2,2,block.slice(2+parseInt(k/8),3+parseInt(k/8))) + 1) / pixelMaxLerpSize) / 100) * minmaxVariance[k])); //Need to fix this
						}
					}
				}
				return new Uint8Array(output);
			}
		}
	};


	/**
	 * Vtf
	 * All the exposed functionality to go to and from VTF data.
	 *
	 * @constructor
	 */
	Vtf = function() {

	};

	Vtf.prototype = {
		/**
		 * Get a VtfTexture structure from Vtf buffer data.
		 *
		 * @param {ArrayBuffer}  bufferData
		 *
		 * @returns {VtfTexture}
		 */
		fromVTF: function(bufferData) {
			//Read header
			var reader = new VtfReader(bufferData);
			return reader.fromVtf();
		}
	};

// Require.js
if (typeof define !== 'undefined' && define.amd) {
	define(function () {
		return {
			Vtf:        Vtf,
			VtfTexture: VtfTexture,
			VtfImage:   VtfImage,
			VtfHeader:  VtfHeader
		};
	});
}
// Node.js
else if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		Vtf:        Vtf,
		VtfTexture: VtfTexture,
		VtfImage:   VtfImage,
		VtfHeader:  VtfHeader
	};
}
}(this));