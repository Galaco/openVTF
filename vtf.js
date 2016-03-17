//*****************************************************
// VTF can contain image data in the following formats
// Some formats are not currently supported.
// Some formats will NEVER be supported.
//****************************************************/
VTF_IMAGE_FORMATS = {
	0 : 'VTF_FORMAT_NONE',
	1 : 'VTF_FORMAT_RGBA8888',				//Supported
	2 : 'VTF_FORMAT_ABGR8888',				//Supported
	3 : 'VTF_FORMAT_RGB888',				//Supported
	4 : 'VTF_FORMAT_BGR888',				//Supported
	5 : 'VTF_FORMAT_RGB565',
	6 : 'VTF_FORMAT_I8',					//Will never support
	7 : 'VTF_FORMAT_IA88',					//Will never support
	8 : 'VTF_FORMAT_P8',					//Will never support
	9 : 'VTF_FORMAT_A8',					//Will never support
	10 : 'VTF_FORMAT_RGB888_BLUESCREEN',	//Will never support
	11 : 'VTF_FORMAT_BGR888_BLUESCREEN',	//Will never support
	12 : 'VTF_FORMAT_ARGB8888',				//Supported
	13 : 'VTF_FORMAT_BGRA8888',				//Supported
	14 : 'VTF_FORMAT_DXT1',
	15 : 'VTF_FORMAT_DXT3',
	16 : 'VTF_FORMAT_DXT5',
	17 : 'VTF_FORMAT_BGRX8888',				//Will never support
	18 : 'VTF_FORMAT_BGR565',
	19 : 'VTF_FORMAT_BGRX5551',				//Will never support
	20 : 'VTF_FORMAT_BGRA4444',				//Will never support
	21 : 'VTF_FORMAT_DXT1_ONEBITALPHA',		//Will never support
	22 : 'VTF_FORMAT_BGRA5551',				//Will never support
	23 : 'VTF_FORMAT_UV88',					//Will never support
	24 : 'VTF_FORMAT_UVWQ8888',				//Will never support
	25 : 'VTF_FORMAT_RGBA16161616F',		//Will never support
	26 : 'VTF_FORMAT_RGBA16161616',			//Will never support
	27 : 'VTF_FORMAT_UVLX8888'				//Will never support
};

VTF_IMAGE_FORMAT_SIZE = {
	'VTF_FORMAT_RGBA8888' : 4,				//Supported
	'VTF_FORMAT_ABGR8888' : 4,				//Supported
	'VTF_FORMAT_RGB888' : 3,				//Supported
	'VTF_FORMAT_BGR888' : 3,					//Supported
	'VTF_FORMAT_RGB565' : 3,
	'VTF_FORMAT_ARGB8888' : 4,				//Supported
	'VTF_FORMAT_BGRA8888' : 4,				//Supported
	'VTF_FORMAT_DXT1' : 3,
	'VTF_FORMAT_DXT3' : 3,
	'VTF_FORMAT_DXT5' : 3,
	'VTF_FORMAT_BGR565' : 3,
};

//*****************************************************
// GL Image formats 
// Number of channels per format
//****************************************************/
GL_IMAGE_FORMATS = {
	'GL_RGB' : 3,
	'GL_RGBA' : 4,
	'GL_BGR' : 3,
	'GL_BGRA' : 4,
	'GL_RGBA' : 4
};

// VTFReader 
// Small internal binary reader.
// Constructor takes an ArrayBuffer
function VTFReader(buffer) 
{
	this.buffer = buffer,

// @public
	this.Char = function(offset, num) 
	{
		var a = this.Read(offset, num, Int8Array);
			ret = "";
		for (var j = 0; j < num; j++) 
		{
			ret += String.fromCharCode(a[j]);
		}
		return ret;
	},
	
	this.Raw = function(offset, num) 
	{
		return this.Read(offset, num, Int8Array);
	},
	
	this.Int = function(offset, num) 
	{
		return this.Read(offset, num, Int32Array);
	},
	
	this.Short = function(offset, num) 
	{
		return this.Read(offset, num, Int16Array);
	},
	
	this.Float = function(offset, num) 
	{
		return this.Read(offset, num, Float32Array);
	},
	
	this.Read = function(offset, num, type) 
	{
		if (!num) num = 1;
		var a = new type(this.buffer, offset, num);
		return (num == 1) ? a[0] : ToArray(a);
	}
	
// @private	
	var ToArray = function(buf) 
	{
		var ret = [];
		for (var j = 0; j < buf.length; j++) 
		{
			ret.push(buf[j]);
		}
		return ret;
	}
}

// VTFHeader
// Data structure for VTFHeader.
// Constructs itself using VTFReader
function VTFHeader(slice) 
{	
	this.buffer = slice,
	reader = new VTFReader(this.buffer),
	this.signature = reader.Char(0, 4),									//File signature char
	this.version = reader.Int(4,1) + '.' + reader.Int(8,1),				//Version[0].version[1] e.g. 7.2 uint
	this.headerSize = reader.Int(12,1),									//Size of header (16 byte aligned, currently 80bytes) uint
	this.width = reader.Short(16,1),									//Width of largest mipmap (^2) ushort
	this.height = reader.Short(18,1),									//Height of largest mipmap (^2) ushort
	this.flags = reader.Int(20,1),										//VTF Flags uint
	this.frames = reader.Int(24,1),										//Number of frames (if animated) default: 1 ushort
	this.firstFrame = reader.Short(28,1),								//First frame in animation (0 based) ushort	
	this.reflectivity = reader.Float(32,3),								//reflectivity vector float	
	this.bumpmapScale = reader.Float(48,1),								//Bumpmap scale float
	this.highResImageFormat = reader.Int(52,1) + 1,						//High resolution image format uint (probably 4?)	
	this.mipmapCount = reader.Raw(56,1),								//Number of mipmaps uchar
	this.lowResImageFormat = new Int32Array(reader.Raw(57,4))[0] + 1,	//Low resolution image format (always DXT1 [=14]) uint
	this.lowResImageWidth = reader.Raw(61,1),							//Low resolution image width uchar
	this.lowResImageHeight = reader.Raw(62,1),							//Low resolution image height uchar
	this.depth = new Int16Array(reader.Raw(63,2))[0]					//Depth of the largest mipmap in pixels (^2) ushort
}

function VTFImage(width, height, depth, vtfFormat, buffer) 
{
	this.buffer = buffer,
	this.s = width,
	this.t = height,
	this.r = depth,
	//order 0123 = rgba. reorder for differet structures e.g. bgr=210
	this.format = {format: 0, dataType: 0, order: [0,1,2]},
	reader = new VTFReader(this.buffer),
	this.rawData,
	this.rgbaData,
	this.isSupported = false,
	this.sizeInBytes = -1,
	this.hasAlphaChannel = true,
	
	this.__construct = function() 
	{		
		if (this.s > 0 && this.t > 0)
		{
			this.isSupported = CheckImageFormat(vtfFormat, this.format);
			if (!this.isSupported) return;
		} else {
			return;
		}
		
		this._Import();
	},
	
	this.getSizeInBytes = function() 
	{
		if (this.sizeInBytes == -1) 
		{
			this.sizeInBytes = this.s * this.t * this.r * 3; //this.format.format;
		} 
		
		return this.sizeInBytes;
	}
	
	var CheckImageFormat = function(vtfFormat, format)
	{
		var supported = true;

		// Decode the format
		switch (VTF_IMAGE_FORMATS[vtfFormat])
		{
			case 'VTF_FORMAT_RGBA8888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGBA'];
				format.order = [0,1,2,3];
				break;
			case 'VTF_FORMAT_ABGR8888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGBA'];
				format.order = [3,2,1,0];
				break;
			case 'VTF_FORMAT_RGB888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGB'];
				format.order = [0,1,2];
				break;
			case 'VTF_FORMAT_BGR888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGB'];
				format.order = [2,1,0];
				break;
			case 'VTF_FORMAT_ARGB8888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGBA'];
				format.order = [3,0,1,2];
				break;
			case 'VTF_FORMAT_BGRA8888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGBA'];
				format.order = [2,1,0,3];
				break;
			default:
				supported = false;
				break;
		}
		
		format.dataType = Int8Array;
		// Return whether or not the format is supported
		return supported;
	}
	
	this._Import = function() 
	{
		this.rawData = new Uint8Array(reader.Raw(0, this.getSizeInBytes()));
		if (this.format.order.length == 3) {
			this.hasAlphaChannel = false;
		}
		var tempData = new Uint8Array((this.rawData.length/3)*4), 
			offset = 0;
		for (pixel=0; pixel < this.rawData.length; pixel += this.format.order.length)
		{
			for(i=0; i < this.format.order.length; i++) 
			{
				tempData[offset] = this.rawData[pixel + this.format.order[i]];
				offset++;
			}
			//Add an alpha channel if there isn't one.
			if (this.hasAlphaChannel == false) 
			{
				tempData[offset] = 255;
				offset++;
			}
		}
		this.rawData = tempData;
	}

	this.__construct();
}

// VTFImage
// Container for Header and Body.
// Interact with VTF data through this class.
// Under normal usage, VTFImage is the only class that should be used directly.
function VTFTexture(buffer) 
{
	this.buffer = buffer,
	this.header,
	this.thumbnail,
	this.image,
	this.mipmaps = [],
	
	this.__construct = function() {
		this.header = new VTFHeader(this.buffer.slice(0, 80));
		
		this.thumbnail = new VTFImage(
			this.header.lowResImageWidth, 
			this.header.lowResImageHeight, 
			this.header.depth, 
			this.header.lowResImageFormat, 
			this.buffer.slice(this.header.headerSize)
		);
		
		//Calculate offset to hi-res image data
		offset = this.header.headerSize;
		offset += this.thumbnail.getSizeInBytes();
		offset += this._skipMipmaps();
		
		this.image = new VTFImage(
			this.header.width, 
			this.header.height, 
			this.header.depth, 
			this.header.highResImageFormat, 
			new Uint8Array(this.buffer).slice(offset+128)	//128? unsupported 4444 16x16 mipmap? 256/2bytes
		);
	},
	
	this._skipMipmaps = function() {
		var offset = 0,
			w = this.width,
			h = this.height,
			d = this.depth;
					
		if (this.header.mipmapCount > 1) {
			for(k=1; k < this.header.mipmapCount && (width || height || depth); k++) {
				if (w == 0) {
					w = 1;
				}
				if (h == 0) {
					h = 1;
				}
				if (d == 0) {
					d = 1;
				}
						
				// Compute and store the offset into the final image data
				var imgWidthBytes = VTF_IMAGE_FORMAT_SIZE[VTF_IMAGE_FORMAT[this.header.highResImageFormat]];
				offset += depth * height * imgWidthBytes;
				this.mipmaps[k-1] = offset;

				// Get the next level's dimensions
				w >>= 1;
				h >>= 1;
				d >>= 1;
			}
		}
		
		return offset;
	},
	
	this.__construct();
	
	console.log(this);
}

// Use OpenVTF for reading/writing
OpenVTF = {
	fromVTF : function(arrayBuffer) {
		return new VTFTexture(arrayBuffer);
	}
}