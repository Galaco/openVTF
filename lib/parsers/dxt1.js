'use strict'

var constants = require('./constants.js');


function parse(buffer, width, height, depth, format) {
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
};

module.exports = {
	parse: parse,
};