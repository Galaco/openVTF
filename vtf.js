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
		'format': {
			'RGBA8888' 			: [0,1,2,3],
			'ABGR8888' 			: [3,2,1,0],
			'RGB888'   			: [0,1,2],
			'BGR888'   			: [2,1,0],
			'RGB888_BLUESCREEN' : [0,1,2],
			'BGR888_BLUESCREEN' : [2,1,0],
			'ARGB8888' 		    : [3,0,1,2],
			'BGRA8888' 			: [2,1,0,3],
			'DXT1'	   			: 3,			//Unsupported
			'DXT3'     			: 3,			//Unsupported
			'DXT5'     			: 3,			//Unsupported
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

		/**
		 * Construct header from buffer
		 *
		 * @returns {VtfHeader}
		 */
		fromBuffer: function(bufferData) {
			var reader = new VtfReader(bufferData);
			var header = new VtfHeader();
			header.signature 		  = reader.char(0, 4),		//File signature char
			header.version 			  = reader.int(4,1)+'.'+reader.int(8,1),	//Version[0].version[1] e.g. 7.2 uint
			header.headerSize 		  = reader.int(12,1),		//Size of header (16 byte aligned, currently 80bytes) uint
			header.width 			  = reader.short(16,1),		//Width of largest mipmap (^2) ushort
			header.height 			  = reader.short(18,1),		//Height of largest mipmap (^2) ushort
			header.flags 			  = reader.int(20,1),		//VTF Flags uint
			header.frames 			  = reader.int(24,1),		//Number of frames (if animated) default: 1 ushort
			header.firstFrame 		  = reader.short(28,1),		//First frame in animation (0 based) ushort	
			header.reflectivity 	  = reader.float(32,3),		//reflectivity vector float	
			header.bumpmapScale 	  = reader.float(48,1),		//Bumpmap scale float
			header.highResImageFormat = reader.int(52,1)+1,		//High resolution image format uint
			header.mipmapCount 		  = reader.raw(56,1),		//Number of mipmaps uchar
			header.lowResImageFormat  = new Int32Array(reader.raw(57,4))[0]+1,//Low resolution image format (always DXT1 [=14]) uint
			header.lowResImageWidth   = reader.raw(61,1),		//Low resolution image width uchar
			header.lowResImageHeight  = reader.raw(62,1),		//Low resolution image height uchar
			header.depth 			  = new Int16Array(reader.raw(63,2))[0]		//Depth of the largest mipmap in pixels (^2) ushort
			
			return header;
		}
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
	VtfImage = function(width, height, depth, bufferData) {
		console.log(bufferData);
		this.width 	 	  = width;
		this.height 	  = height;
		this.depth 		  = depth;
		this.bufferData   = bufferData;
		this.bufferSize   = this.bufferData.byteLength;
		this.alphaChannel = (this.depth == 4);
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
		
		/** @type {Number} bufferSize */
		bufferSize: null,
		
		/** @type {Number} alphaChannel */
		hasAlphaChannel: false,

		/**
		 * Get size of image data (bytes)
		 *
		 * @returns {Number}
		 */
		getSizeInBytes: function() {
			return this.bufferData.byteLength;
		},

		/**
		 * Get image dimensions (either array or object).
		 *
		 * @param {Bool}  asObject
		 *
		 * @returns {Object|Array}
		 */
		getDimensions: function(asObject) {
			if (asObject == true) {
				return {x: this.width, y: this.height};
			}
			return [this.width, this.height];
		},

		/**
		 * Get data buffer (either array or object).
		 *
		 * @param {Bool}  asObject
		 *
		 * @returns {Object|Array}
		 */
		getBufferData: function(forceAlphaChannel) {
			if (forceAlphaChannel == true && this.hasAlphaChannel == false) {
				var tData = new Uint8Array(this.bufferData.byteLength + (this.bufferData.byteLength/3)),
					offset = 0;
				for (var i=0; i<this.bufferData.byteLength; i++) {
					tData[offset] = this.bufferData[i];
					offset++;
					if ((i+1) % 3 == 0) {
						tData[offset] = 255;
						offset++;
					}
				}
				return tData;
			}
			return this.bufferData;
		},

		/**
		 * Create a VtfImage from a buffer.
		 *
		 * @param {Number}  	 width
		 * @param {Number}  	 height
		 * @param {Number}  	 depth
		 * @param {String}  	 format
		 * @param {ArrayBuffer}  bufferData
		 *
		 * @returns {VtfImage}
		 */
		fromBuffer: function(width, height, depth, format, bufferData){
			var reader = new VtfReader(bufferData);	
			return new VtfImage(width, height, depth, reader.getTextureData(width, height, depth, format));
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
		this.bufferData    = bufferData;
		this.header    = header;
		this.thumbnail = thumbnail;
		this.image 	   = image;
		this.mipmaps   = mipmaps;
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

		/**
		 * Fetch texture data, will determine the parser from the format.
		 *
		 * @param {Number}  sizeInBytes
		 * @param {Number}  format
		 *
		 * @returns {Uint8Array}
		 */
		getTextureData: function(width, height, depth, format) {
			var func = null,
				ctx = this
				output = [];

			this.parserFuncs.forEach(function(funcContainer, index) {
				funcContainer.formats.forEach(function(key) {
					if (key == format) {
						output = ctx.parserFuncs[index].func.call(ctx, format, width, height, depth);
					}
				});
			});
			return output;
		},

		/**
		 * Container list of functions to parse different data formats
		 */
		parserFuncs: [
			//Standard RGB(A) formats, in any order
			{
				'formats': [1,2,3,4,10,11,12,13],
				'func' : function(format, width, height, depth) {
					var rgbaOrder = VtfDefinitions.format[VtfDefinitions.formatName[format]],
					tempData = [],
					depth = rgbaOrder.length,
					offset = 0,
					dataSize = width*height*depth;

					//Reorder rgb(a) data from stored format to rgb format
					for (var pixel=0; pixel<dataSize; pixel+=depth) {
						for(var i=0; i<depth; i++) {
							tempData[offset] = this.bufferData[pixel+rgbaOrder[i]];
							offset++;
						}
					}

					return new Uint8Array(tempData);
				},
			},
			//@TODO DXT formats
			{
				'formats': [14],
				'func': function(format, width, height, depth) {
					//DXT1
					//4x4blocks 
					//Each block stores 2 colours in 5.6.5 format
					//for each pixel,2bit value to interpolate between color1 and color2
					var output           = [],
						blockSize        = 4,
						blockSizeInBytes = 8,
						pixelMaxLerpSize = 4,
						depth            = 3,
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
						blockOffset = (depth * blocksPerRow) * (((blocksPerRow*blockHeight)*Math.floor(i / (width/blocksPerRow))) + (i % blocksPerRow));

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
		]
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
			var header = VtfHeader.prototype.fromBuffer(bufferData),
				offset = header.headerSize;

			//Read thumbnail image
			var thumbnail = VtfImage.prototype.fromBuffer(
				header.lowResImageWidth, 
				header.lowResImageHeight, 
				header.depth, 
				header.lowResImageFormat, 
				bufferData.slice(offset)
			);
			//Thumbnail size compute (its always DXT1)
			offset += ((header.lowResImageWidth*header.lowResImageHeight)/4) * 8;

			//Read mipmaps
			var mipmaps = [],
				w = 1,
				h = 1;
			for (var i = 0; i < header.mipmapCount; ++i) {
				var image = VtfImage.prototype.fromBuffer(w, h, header.depth, header.highResImageFormat, bufferData.slice(offset));
				mipmaps.push(image);
				w >>= 1;
				h >>= 1;
				offset += image.getSizeInBytes();
			}

			//read high resolution image
			var image = VtfImage.prototype.fromBuffer(
				header.width, 
				header.height, 
				header.depth, 
				header.highResImageFormat, 
				bufferData.slice(offset)
			);

			return new VtfTexture(bufferData, header, thumbnail, image, mipmaps);
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