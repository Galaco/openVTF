'use strict'

var constants = require('./constants.js');


function parse(buffer, width, height, depth, format) {
	var rgbaOrder = constants.format[constants.formatName[format]],
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
};

module.exports = {
	parse: parse,
};