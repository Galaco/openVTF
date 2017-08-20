# openVTF
JavaScript library to work with Valve Texture Format images. At present allows reading from only.

# This branch
My main dev branch. Don't assume this branch works correctly, although it hopefully will. 

# General changelog between dev->master
* Complete refactor of the core code
* Support for loading through node or require.js
* Included basic support for mipmap loading
* Added support for RGBA8888_BLUESCREEN and variants
* Early support for DXT1 format (i.e. thumbnails). DXT3 + DXT5 should be easily addable once this is ready


# Known issues right now
* Looks like there are some issues with reading the correct byte counts causing reading from the wrong byte offests. Hopefully this will see resolution with the completion of DXT1 support (its likely thumbnail data) is the cause.