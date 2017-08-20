var reader = require('./reader.js');

function toRgba(bufferData) {
	var reader = new VtfReader(bufferData);
	return reader.fromVtf();
}

module.exports = {
	toRgba: toRgba
};