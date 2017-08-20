'use strict'


var formatName = {
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
};

var format = {
	'RGBA8888' 			: [0,1,2,3],
	'ABGR8888' 			: [3,2,1,0],
	'RGB888'   			: [0,1,2],
	'BGR888'   			: [2,1,0],
	'RGB888_BLUESCREEN' : [0,1,2],
	'BGR888_BLUESCREEN' : [2,1,0],
	'ARGB8888' 		    : [3,0,1,2],
	'BGRA8888' 			: [2,1,0,3],
	'DXT1'	   			: 0,			//Very early support
	'DXT3'    			: 0,			//Unsupported
	'DXT5'     			: 0,			//Unsupported
};

//Size of a single pixel in bytes (e.g RGB888 = 3)
var sizePerPixel = {
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
};


module.exports = {
	formatName: formatName,
	format: format,
	sizePerPixel: sizePerPixel
};