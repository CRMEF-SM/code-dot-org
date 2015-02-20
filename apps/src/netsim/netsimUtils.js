/* jshint
 funcscope: true,
 newcap: true,
 nonew: true,
 shadow: false,
 unused: true,

 maxlen: 90,
 maxparams: 3,
 maxstatements: 200
 */
'use strict';

var NetSimClientNode = require('./NetSimClientNode');
var NetSimRouterNode = require('./NetSimRouterNode');

/**
 * Given a set of rows from the node table on a shard, gives back a set of node
 * controllers (of appropriate types).
 * @param {!NetSimShard} shard
 * @param {!Array.<Object>} rows
 * @throws when a row doesn't have a mappable node type.
 * @return {Array.<NetSimNode>} nodes for the rows
 */
exports.nodesFromRows = function (shard, rows) {
  return rows
      .map(function (row) {
        if (row.type === NetSimClientNode.getNodeType()) {
          return new NetSimClientNode(shard, row);
        } else if (row.type == NetSimRouterNode.getNodeType()) {
          return new NetSimRouterNode(shard, row);
        }
        // Oops!  We probably shouldn't ever get here.
        throw new Error("Unable to map row to node.");
      });
};

/**
 * Converts a binary string into its most compact string representation.
 * @param {string} binaryString that may contain whitespace
 * @returns {string} binary string with no whitespace
 */
exports.minifyBinary = function (binaryString) {
  return binaryString.replace(/[^01]/g, '');
};

/**
 * Converts a binary string to a formatted representation, with chunks of
 * a set size separated by a space.
 * @param {string} binaryString - may be unformatted already
 * @param {number} chunkSize - how many bits per format chunk
 * @returns {string} pretty formatted binary string
 */
exports.formatBinary = function (binaryString, chunkSize) {
  if (chunkSize <= 0) {
    throw new RangeError("Parameter chunkSize must be greater than zero");
  }

  var binary = exports.minifyBinary(binaryString);

  var chunks = [];
  for (var i = 0; i < binary.length; i += chunkSize) {
    chunks.push(binary.substr(i, chunkSize));
  }

  return chunks.join(' ');
};

/**
 * Converts a hexadecimal string into its most compact string representation.
 * Strips whitespace and non-hex characters, and coerces letters to uppercase.
 * @param {string} hexString
 * @returns {string}
 */
exports.minifyHex = function (hexString) {
  return hexString.replace(/[^0-9A-F]/gi, '').toUpperCase();
};

/**
 * Converts a hex string to a formatted representation, with chunks of
 * a set size separated by a space.
 * @param {string} hexString
 * @param {number} chunkSize
 * @returns {string} formatted hex
 */
exports.formatHex = function (hexString, chunkSize) {
  if (chunkSize <= 0) {
    throw new RangeError("Parameter chunkSize must be greater than zero");
  }

  var hex = exports.minifyHex(hexString);

  var chunks = [];
  for (var i = 0; i < hex.length; i += chunkSize) {
    chunks.push(hex.substr(i, chunkSize));
  }

  return chunks.join(' ');
};

/**
 * Interprets a binary string as a single number, and returns that number.
 * @param {string} binaryString
 * @returns {number}
 */
exports.binaryToInt = function (binaryString) {
  return parseInt(exports.minifyBinary(binaryString), 2);
};

var zeroPadLeft = function (string, desiredWidth) {
  var padding = new Array(desiredWidth + 1).join('0');
  return (padding + string).slice(-desiredWidth);
};

var zeroPadRight = function (string, desiredWidth) {
  var padding = new Array(desiredWidth + 1).join('0');
  return (string + padding).substr(0, desiredWidth);
};

var intToString = function (int, base, width) {
  if (width <= 0) {
    throw new RangeError("Output width must be greater than zero");
  }
  return zeroPadLeft(int.toString(base), width);
};

/**
 * Converts a number to a binary string representation with the given width.
 * @param {number} int - number to convert
 * @param {number} width - number of bits to use
 * @returns {string} - binary representation with length of "width"
 */
exports.intToBinary = function (int, width) {
  return intToString(int, 2, width);
};

/**
 * Interprets a hex string as a single number, and returns that number.
 * @param hexadecimalString
 * @returns {Number}
 */
exports.hexToInt = function (hexadecimalString) {
  return parseInt(exports.minifyHex(hexadecimalString), 16);
};

/**
 * Converts a number to a hexadecimal string representation with the given
 * width.
 * @param {number} int - number to convert
 * @param {number} width - number of characters to use
 * @returns {string} - hex representation with length of "width"
 */
exports.intToHex = function (int, width) {
  return intToString(int, 16, width).toUpperCase();
};

/**
 * Converts a hex string to a binary string, by mapping each hex character
 * to four bits of binary.
 * @param {string} hexadecimalString
 * @returns {string} binary representation.
 */
exports.hexToBinary = function (hexadecimalString) {
  var uglyHex = exports.minifyHex(hexadecimalString);
  var binary = '';

  for (var i = 0; i < uglyHex.length; i++) {
    binary += exports.intToBinary(exports.hexToInt(uglyHex.substr(i, 1)), 4);
  }

  return binary;
};

/**
 * Converts a binary string to a hex string, mapping each four bits into
 * a hex character and right-padding with zeroes to round out the binary length.
 * @param {string} binaryString
 * @returns {string}
 */
exports.binaryToHex = function (binaryString) {
  var nibble;
  var nibbleWidth = 4;
  var chars = [];
  var uglyBinary = exports.minifyBinary(binaryString);
  for (var i = 0; i < uglyBinary.length; i += nibbleWidth) {
    // Right-pad nibble with zeroes
    nibble = zeroPadRight(uglyBinary.substr(i, nibbleWidth), nibbleWidth);
    chars.push(exports.intToHex(exports.binaryToInt(nibble), 1));
  }
  return chars.join('');
};

/**
 * Converts a string set of numbers to a binary representation of those numbers
 * using the given byte-size.
 * @param {string} decimalString - A set of numbers separated by whitespace.
 * @param {number} byteSize - How many bits to use to represent each number.
 * @returns {string} Binary representation.
 */
exports.decimalToBinary = function (decimalString, byteSize) {
  var decimal = decimalString.replace(/[^0-9\s]/g, '');

  // Special case: No numbers
  if (decimal.replace(/\s/g, '') === '') {
    return '';
  }

  return decimal
      .split(/\s+/)
      .map(function (numString) {
        return exports.intToBinary(parseInt(numString, 10), byteSize);
      })
      .join('');
};

/**
 * Converts binary to a string of decimal numbers separated by whitespace.
 * @param {string} binaryString
 * @param {number} byteSize - How many bits to read for each number
 * @returns {string} decimal numbers
 */
exports.binaryToDecimal = function (binaryString, byteSize) {
  var byte;
  var numbers = [];
  var binary = exports.minifyBinary(binaryString);
  for (var i = 0; i < binary.length; i += byteSize) {
    byte = zeroPadRight(binary.substr(i, byteSize), byteSize);
    numbers.push(exports.binaryToInt(byte));
  }
  return numbers.join(' ');
};

/**
 * Converts ascii to binary, using the given bytesize for each character.
 * Overflow is ignored (left-trimmed); recommend using a bytesize of 8 in
 * most circumstances.
 * @param {string} asciiString
 * @param {number} byteSize
 * @returns {string}
 */
exports.asciiToBinary = function (asciiString, byteSize) {
  var bytes = [];
  for (var i = 0; i < asciiString.length; i++) {
    bytes.push(exports.intToBinary(asciiString.charCodeAt(i), byteSize));
  }
  return bytes.join('');
};

/**
 * Converts binary to an ascii string, using the given bytesize for each
 * character.  If the binary is not divisible by bytesize, the final character
 * is right-padded.
 * @param {string} binaryString
 * @param {number} byteSize
 * @returns {string} ASCII string
 */
exports.binaryToAscii = function (binaryString, byteSize) {
  if (byteSize <= 0) {
    throw new RangeError("Parameter byteSize must be greater than zero");
  }

  var byte;
  var chars = [];
  var binary = exports.minifyBinary(binaryString);
  for (var i = 0; i < binary.length; i += byteSize) {
    byte = zeroPadRight(binary.substr(i, byteSize), byteSize);
    chars.push(String.fromCharCode(exports.binaryToInt(byte)));
  }
  return chars.join('');
};
