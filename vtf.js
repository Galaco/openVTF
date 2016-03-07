VTF_IMAGE_FORMATS = {
	0 : 'VTF_FORMAT_NONE',
	1 : 'VTF_FORMAT_RGBA8888',
	2 : 'VTF_FORMAT_ABGR8888',
	3 : 'VTF_FORMAT_RGB888',
	4 : 'VTF_FORMAT_BGR888',
	5 : 'VTF_FORMAT_RGB565',
	6 : 'VTF_FORMAT_I8',
	7 : 'VTF_FORMAT_IA88',
	8 : 'VTF_FORMAT_P8',
	9 : 'VTF_FORMAT_A8',
	10 : 'VTF_FORMAT_RGB888_BLUESCREEN',
	11 : 'VTF_FORMAT_BGR888_BLUESCREEN',
	12 : 'VTF_FORMAT_ARGB8888',
	13 : 'VTF_FORMAT_BGRA8888',
	14 : 'VTF_FORMAT_DXT1',
	15 : 'VTF_FORMAT_DXT3',
	16 : 'VTF_FORMAT_DXT5',
	17 : 'VTF_FORMAT_BGRX8888',
	18 : 'VTF_FORMAT_BGR565',
	19 : 'VTF_FORMAT_BGRX5551',
	20 : 'VTF_FORMAT_BGRA4444',
	21 : 'VTF_FORMAT_DXT1_ONEBITALPHA',
	22 : 'VTF_FORMAT_BGRA5551',
	23 : 'VTF_FORMAT_UV88',
	24 : 'VTF_FORMAT_UVWQ8888',
	25 : 'VTF_FORMAT_RGBA16161616F',
	26 : 'VTF_FORMAT_RGBA16161616',
	27 : 'VTF_FORMAT_UVLX8888'
};

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
	this.format = {format: 0, pixelLayout: 0, dataType: 0, order: [0,1,2]},
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
			this.isSupported = ConvertImageFormat(vtfFormat, this.format);
			if (!this.isSupported) return;
		} else {
			return;
		}		
		console.log('Size in bytes: ' + this.getSizeInBytes());
		
		this.Import();
	},
	
	this.getSizeInBytes = function() 
	{
		if (this.sizeInBytes == -1) {
			this.sizeInBytes = this.s * this.t * this.r * 3; //this.format.format;
		} 
		
		return this.sizeInBytes;
	}
	
	var ConvertImageFormat = function(vtfFormat, format)
	{
		var supported = true;

		// Decode the format
		switch (VTF_IMAGE_FORMATS[vtfFormat])
		{
			case 'VTF_FORMAT_RGBA8888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGBA'];
				format.pixelFormat = GL_IMAGE_FORMATS['GL_RGBA'];
				format.order = [0,1,2,3];
				break;
			case 'VTF_FORMAT_RGB888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGB'];
				format.pixelFormat = GL_IMAGE_FORMATS['GL_RGB'];
				format.order = [0,1,2];
				break;
			case 'VTF_FORMAT_BGR888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGB'];
				format.pixelFormat = GL_IMAGE_FORMATS['GL_BGR'];
				format.order = [2,1,0];
				break;
			case 'VTF_FORMAT_BGRA8888':
				format.internalFormat = GL_IMAGE_FORMATS['GL_RGBA'];
				format.pixelFormat = GL_IMAGE_FORMATS['GL_BGRA'];
				format.order = [0,1,2,3];
				break;
			default:
				supported = false;
				break;
		}
		
		format.dataType = Int8Array;
		// Return whether or not the format is supported
		return supported;
	}
	
	this.Import = function() {
		this.rawData = new Uint8Array(reader.Raw(0, this.getSizeInBytes()));
		if (this.format.order.length == 3) {
			this.hasAlphaChannel = false;
		}
		var tempData = new Uint8Array((this.rawData.length/3)*4), 
			offset = 0;
		for (pixel=0; pixel < this.rawData.length; pixel += this.format.order.length)
		{
			for(i=0; i < this.format.order.length; i++) {
				tempData[offset] = this.rawData[pixel + this.format.order[i]];
				offset++;
			}
			//Add an alpha channel if there isn't one.
			if (this.hasAlphaChannel == false) {
				tempData[offset] = 255;
				offset++;
			}
		}
		this.rawData = tempData;
		console.log(tempData.length);
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
	
	this.__construct = function() {
		this.header = new VTFHeader(this.buffer.slice(0, 80));
		this.thumbnail = new VTFImage(
			this.header.lowResImageWidth, 
			this.header.lowResImageHeight, 
			this.header.depth, 
			this.header.lowResImageFormat, 
			this.buffer.slice(this.header.headerSize)
		);
		
		this.image = new VTFImage(
			this.header.width, 
			this.header.height, 
			this.header.depth, 
			this.header.highResImageFormat, 
			new Uint8Array(this.buffer).slice(this.header.headerSize-1 + this.thumbnail.getSizeInBytes())
		);
	},
	
	this.__construct();
	
	console.log(this);
}