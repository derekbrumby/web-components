/**
 * QR Code web component rendering SVG output for a provided value.
 *
 * QR encoding logic adapted from qrcode.js by Kazuhiko Arase (MIT License).
 */

const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };
const QRMode = { MODE_NUMBER: 1, MODE_ALPHA_NUM: 2, MODE_8BIT_BYTE: 4, MODE_KANJI: 8 };
const QRMaskPattern = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7,
};

class QRPolynomial {
  constructor(num, shift) {
    if (num.length === undefined) {
      throw new Error(`${num.length}/${shift}`);
    }
    let offset = 0;
    while (offset < num.length && num[offset] === 0) {
      offset += 1;
    }
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i += 1) {
      this.num[i] = num[i + offset];
    }
    for (let i = num.length - offset; i < this.num.length; i += 1) {
      this.num[i] = 0;
    }
  }

  get(index) {
    return this.num[index];
  }

  getLength() {
    return this.num.length;
  }

  multiply(e) {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i += 1) {
      for (let j = 0; j < e.getLength(); j += 1) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  }

  mod(e) {
    if (this.getLength() - e.getLength() < 0) {
      return this;
    }
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = this.num.slice();
    for (let i = 0; i < e.getLength(); i += 1) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num, 0).mod(e);
  }
}

const QRMath = {
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256),
  glog(n) {
    if (n < 1) {
      throw new Error(`glog(${n})`);
    }
    return QRMath.LOG_TABLE[n];
  },
  gexp(n) {
    while (n < 0) {
      n += 255;
    }
    while (n >= 256) {
      n -= 255;
    }
    return QRMath.EXP_TABLE[n];
  },
};

for (let i = 0; i < 8; i += 1) {
  QRMath.EXP_TABLE[i] = 1 << i;
}
for (let i = 8; i < 256; i += 1) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i += 1) {
  QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
}

class QRRSBlock {
  constructor(totalCount, dataCount) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }

  static getRSBlocks(typeNumber, errorCorrectLevel) {
    const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (rsBlock == null) {
      throw new Error(`bad rs block @ typeNumber:${typeNumber}/errorCorrectLevel:${errorCorrectLevel}`);
    }
    const list = [];
    for (let i = 0; i < rsBlock.length; i += 1) {
      const count = rsBlock[i];
      const totalCount = rsBlock[i + 1];
      const dataCount = rsBlock[i + 2];
      for (let j = 0; j < count; j += 1) {
        list.push(new QRRSBlock(totalCount, dataCount));
      }
      i += 2;
    }
    return list;
  }

  static getRsBlockTable(typeNumber, errorCorrectLevel) {
    switch (errorCorrectLevel) {
      case QRErrorCorrectLevel.L:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectLevel.M:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectLevel.Q:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectLevel.H:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default:
        return undefined;
    }
  }
}

QRRSBlock.RS_BLOCK_TABLE = [
  [1, 26, 19],
  [1, 26, 16],
  [1, 26, 13],
  [1, 26, 9],
  [1, 44, 34],
  [1, 44, 28],
  [1, 44, 22],
  [1, 44, 16],
  [1, 70, 55],
  [1, 70, 44],
  [2, 35, 17],
  [2, 35, 13],
  [1, 100, 80],
  [2, 50, 32],
  [2, 50, 24],
  [4, 25, 9],
  [1, 134, 108],
  [2, 67, 43],
  [2, 33, 15, 2, 34, 16],
  [2, 33, 11, 2, 34, 12],
  [2, 86, 68],
  [4, 43, 27],
  [4, 43, 19],
  [4, 43, 15],
  [2, 98, 78],
  [4, 49, 31],
  [2, 32, 14, 4, 33, 15],
  [4, 39, 13, 1, 40, 14],
  [2, 121, 97],
  [2, 60, 38, 2, 61, 39],
  [4, 40, 18, 2, 41, 19],
  [4, 40, 14, 2, 41, 15],
  [2, 146, 116],
  [3, 58, 36, 2, 59, 37],
  [4, 36, 16, 4, 37, 17],
  [4, 36, 12, 4, 37, 13],
  [2, 86, 68, 2, 87, 69],
  [4, 69, 43, 1, 70, 44],
  [6, 43, 19, 2, 44, 20],
  [6, 43, 15, 2, 44, 16],
  [4, 101, 81],
  [1, 80, 50, 4, 81, 51],
  [4, 50, 22, 4, 51, 23],
  [3, 36, 12, 8, 37, 13],
  [2, 116, 92, 2, 117, 93],
  [6, 58, 36, 2, 59, 37],
  [4, 46, 20, 6, 47, 21],
  [7, 42, 14, 4, 43, 15],
  [4, 133, 107],
  [8, 59, 37, 1, 60, 38],
  [8, 44, 20, 4, 45, 21],
  [12, 33, 11, 4, 34, 12],
  [3, 145, 115, 1, 146, 116],
  [4, 64, 40, 5, 65, 41],
  [11, 36, 16, 5, 37, 17],
  [11, 36, 12, 5, 37, 13],
  [5, 109, 87, 1, 110, 88],
  [5, 65, 41, 5, 66, 42],
  [5, 54, 24, 7, 55, 25],
  [11, 36, 12],
  [5, 122, 98, 1, 123, 99],
  [7, 73, 45, 3, 74, 46],
  [15, 43, 19, 2, 44, 20],
  [3, 45, 15, 13, 46, 16],
  [1, 135, 107, 5, 136, 108],
  [10, 74, 46, 1, 75, 47],
  [1, 50, 22, 15, 51, 23],
  [2, 42, 14, 17, 43, 15],
  [5, 150, 120, 1, 151, 121],
  [9, 69, 43, 4, 70, 44],
  [17, 50, 22, 1, 51, 23],
  [2, 42, 14, 19, 43, 15],
  [3, 141, 113, 4, 142, 114],
  [3, 70, 44, 11, 71, 45],
  [17, 47, 21, 4, 48, 22],
  [9, 39, 13, 16, 40, 14],
  [3, 135, 107, 5, 136, 108],
  [3, 67, 41, 13, 68, 42],
  [15, 54, 24, 5, 55, 25],
  [15, 43, 15, 10, 44, 16],
  [4, 144, 116, 4, 145, 117],
  [17, 68, 42],
  [17, 50, 22, 6, 51, 23],
  [19, 46, 16, 6, 47, 17],
  [2, 139, 111, 7, 140, 112],
  [17, 74, 46],
  [7, 54, 24, 16, 55, 25],
  [34, 37, 13],
  [4, 151, 121, 5, 152, 122],
  [4, 75, 47, 14, 76, 48],
  [11, 54, 24, 14, 55, 25],
  [16, 45, 15, 14, 46, 16],
  [6, 147, 117, 4, 148, 118],
  [6, 73, 45, 14, 74, 46],
  [11, 54, 24, 16, 55, 25],
  [30, 46, 16, 2, 47, 17],
  [8, 132, 106, 4, 133, 107],
  [8, 75, 47, 13, 76, 48],
  [7, 54, 24, 22, 55, 25],
  [22, 45, 15, 13, 46, 16],
  [10, 142, 114, 2, 143, 115],
  [19, 74, 46, 4, 75, 47],
  [28, 50, 22, 6, 51, 23],
  [33, 46, 16, 4, 47, 17],
  [8, 152, 122, 4, 153, 123],
  [22, 73, 45, 3, 74, 46],
  [8, 53, 23, 26, 54, 24],
  [12, 45, 15, 28, 46, 16],
  [3, 147, 117, 10, 148, 118],
  [3, 73, 45, 23, 74, 46],
  [4, 54, 24, 31, 55, 25],
  [11, 45, 15, 31, 46, 16],
  [7, 146, 116, 7, 147, 117],
  [21, 73, 45, 7, 74, 46],
  [1, 53, 23, 37, 54, 24],
  [19, 45, 15, 26, 46, 16],
  [5, 145, 115, 10, 146, 116],
  [19, 75, 47, 10, 76, 48],
  [15, 54, 24, 25, 55, 25],
  [23, 45, 15, 25, 46, 16],
  [13, 145, 115, 3, 146, 116],
  [2, 74, 46, 29, 75, 47],
  [42, 54, 24, 1, 55, 25],
  [23, 45, 15, 28, 46, 16],
  [17, 145, 115],
  [10, 74, 46, 23, 75, 47],
  [10, 54, 24, 35, 55, 25],
  [19, 45, 15, 35, 46, 16],
  [17, 145, 115, 1, 146, 116],
  [14, 74, 46, 21, 75, 47],
  [29, 54, 24, 19, 55, 25],
  [11, 45, 15, 46, 46, 16],
  [13, 145, 115, 6, 146, 116],
  [14, 74, 46, 23, 75, 47],
  [44, 54, 24, 7, 55, 25],
  [59, 46, 16, 1, 47, 17],
  [12, 151, 121, 7, 152, 122],
  [12, 75, 47, 26, 76, 48],
  [39, 54, 24, 14, 55, 25],
  [22, 45, 15, 41, 46, 16],
  [6, 151, 121, 14, 152, 122],
  [6, 75, 47, 34, 76, 48],
  [46, 54, 24, 10, 55, 25],
  [2, 45, 15, 64, 46, 16],
  [17, 152, 122, 4, 153, 123],
  [29, 74, 46, 14, 75, 47],
  [49, 54, 24, 10, 55, 25],
  [24, 45, 15, 46, 46, 16],
  [4, 152, 122, 18, 153, 123],
  [13, 74, 46, 32, 75, 47],
  [48, 54, 24, 14, 55, 25],
  [42, 45, 15, 32, 46, 16],
  [20, 147, 117, 4, 148, 118],
  [40, 75, 47, 7, 76, 48],
  [43, 54, 24, 22, 55, 25],
  [10, 45, 15, 67, 46, 16],
  [19, 148, 118, 6, 149, 119],
  [18, 75, 47, 31, 76, 48],
  [34, 54, 24, 34, 55, 25],
  [20, 45, 15, 61, 46, 16],
];

class QRBitBuffer {
  constructor() {
    this.buffer = [];
    this.length = 0;
  }

  get(index) {
    const buf = Math.floor(index / 8);
    return ((this.buffer[buf] >>> (7 - (index % 8))) & 1) === 1;
  }

  put(num, length) {
    for (let i = 0; i < length; i += 1) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
    }
    this.length += 1;
  }

  getLengthInBits() {
    return this.length;
  }

  getBuffer() {
    return this.buffer;
  }
}

class QR8bitByte {
  constructor(data) {
    this.mode = QRMode.MODE_8BIT_BYTE;
    this.data = data;
    this.parsedData = [];
    for (let i = 0; i < data.length; i += 1) {
      const code = data.charCodeAt(i);
      if (code > 0x10000) {
        this.parsedData.push(0xf0 | ((code & 0x1c0000) >>> 18));
        this.parsedData.push(0x80 | ((code & 0x3f000) >>> 12));
        this.parsedData.push(0x80 | ((code & 0xfc0) >>> 6));
        this.parsedData.push(0x80 | (code & 0x3f));
      } else if (code > 0x800) {
        this.parsedData.push(0xe0 | ((code & 0xf000) >>> 12));
        this.parsedData.push(0x80 | ((code & 0xfc0) >>> 6));
        this.parsedData.push(0x80 | (code & 0x3f));
      } else if (code > 0x80) {
        this.parsedData.push(0xc0 | ((code & 0x7c0) >>> 6));
        this.parsedData.push(0x80 | (code & 0x3f));
      } else {
        this.parsedData.push(code);
      }
    }
    if (this.parsedData.length !== data.length) {
      this.parsedData = data;
    }
  }

  getLength() {
    return this.parsedData.length;
  }

  write(buffer) {
    for (let i = 0; i < this.parsedData.length; i += 1) {
      buffer.put(this.parsedData[i], 8);
    }
  }
}

const QRUtil = {
  PATTERN_POSITION_TABLE: [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170],
  ],
  G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | 1,
  G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | 1,
  G15_MASK: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | 1,
  getBCHTypeInfo(data) {
    let d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK;
  },
  getBCHTypeNumber(data) {
    let d = data << 12;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
      d ^= QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18));
    }
    return (data << 12) | d;
  },
  getBCHDigit(data) {
    let digit = 0;
    while (data !== 0) {
      digit += 1;
      data >>>= 1;
    }
    return digit;
  },
  getPatternPosition(typeNumber) {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
  },
  getMask(maskPattern, i, j) {
    switch (maskPattern) {
      case QRMaskPattern.PATTERN000:
        return (i + j) % 2 === 0;
      case QRMaskPattern.PATTERN001:
        return i % 2 === 0;
      case QRMaskPattern.PATTERN010:
        return j % 3 === 0;
      case QRMaskPattern.PATTERN011:
        return (i + j) % 3 === 0;
      case QRMaskPattern.PATTERN100:
        return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case QRMaskPattern.PATTERN101:
        return ((i * j) % 2) + ((i * j) % 3) === 0;
      case QRMaskPattern.PATTERN110:
        return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case QRMaskPattern.PATTERN111:
        return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
      default:
        throw new Error(`bad maskPattern:${maskPattern}`);
    }
  },
  getErrorCorrectPolynomial(errorCorrectLength) {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i += 1) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  },
  getLengthInBits(mode, type) {
    if (1 <= type && type < 10) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 10;
        case QRMode.MODE_ALPHA_NUM:
          return 9;
        case QRMode.MODE_8BIT_BYTE:
          return 8;
        case QRMode.MODE_KANJI:
          return 8;
        default:
          return 8;
      }
    }
    if (type < 27) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 12;
        case QRMode.MODE_ALPHA_NUM:
          return 11;
        case QRMode.MODE_8BIT_BYTE:
          return 16;
        case QRMode.MODE_KANJI:
          return 10;
        default:
          return 16;
      }
    }
    if (type < 41) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 14;
        case QRMode.MODE_ALPHA_NUM:
          return 13;
        case QRMode.MODE_8BIT_BYTE:
          return 16;
        case QRMode.MODE_KANJI:
          return 12;
        default:
          return 16;
      }
    }
    return 0;
  },
  getLostPoint(qrCode) {
    const moduleCount = qrCode.moduleCount;
    let lostPoint = 0;
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        let sameCount = 0;
        const dark = qrCode.modules[row][col];
        for (let r = -1; r <= 1; r += 1) {
          if (row + r < 0 || moduleCount <= row + r) {
            continue;
          }
          for (let c = -1; c <= 1; c += 1) {
            if (col + c < 0 || moduleCount <= col + c) {
              continue;
            }
            if (r === 0 && c === 0) {
              continue;
            }
            if (dark === qrCode.modules[row + r][col + c]) {
              sameCount += 1;
            }
          }
        }
        if (sameCount > 5) {
          lostPoint += 3 + sameCount - 5;
        }
      }
    }
    for (let row = 0; row < moduleCount - 1; row += 1) {
      for (let col = 0; col < moduleCount - 1; col += 1) {
        const count =
          (qrCode.modules[row][col] ? 1 : 0) +
          (qrCode.modules[row + 1][col] ? 1 : 0) +
          (qrCode.modules[row][col + 1] ? 1 : 0) +
          (qrCode.modules[row + 1][col + 1] ? 1 : 0);
        if (count === 0 || count === 4) {
          lostPoint += 3;
        }
      }
    }
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount - 6; col += 1) {
        if (
          qrCode.modules[row][col] &&
          !qrCode.modules[row][col + 1] &&
          qrCode.modules[row][col + 2] &&
          qrCode.modules[row][col + 3] &&
          qrCode.modules[row][col + 4] &&
          !qrCode.modules[row][col + 5] &&
          qrCode.modules[row][col + 6]
        ) {
          lostPoint += 40;
        }
      }
    }
    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount - 6; row += 1) {
        if (
          qrCode.modules[row][col] &&
          !qrCode.modules[row + 1][col] &&
          qrCode.modules[row + 2][col] &&
          qrCode.modules[row + 3][col] &&
          qrCode.modules[row + 4][col] &&
          !qrCode.modules[row + 5][col] &&
          qrCode.modules[row + 6][col]
        ) {
          lostPoint += 40;
        }
      }
    }
    let darkCount = 0;
    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount; row += 1) {
        if (qrCode.modules[row][col]) {
          darkCount += 1;
        }
      }
    }
    const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
    lostPoint += ratio * 10;
    return lostPoint;
  },
};

class QRCodeModel {
  constructor(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
    this.dataCache = null;
  }

  addData(data) {
    const newData = new QR8bitByte(data);
    this.dataList.push(newData);
  }

  make() {
    if (this.typeNumber < 1) {
      this.typeNumber = 1;
    }
    this.makeImpl(false, this.getBestMaskPattern());
    return this.modules;
  }

  makeImpl(test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row += 1) {
      this.modules[row] = new Array(this.moduleCount).fill(null);
    }
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }
    if (!this.dataCache) {
      this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    }
    this.mapData(this.dataCache, maskPattern);
  }

  setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r += 1) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c += 1) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i += 1) {
      this.makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint(this);
      if (i === 0 || lostPoint < minLostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r += 1) {
      if (this.modules[r][6] !== null) {
        continue;
      }
      this.modules[r][6] = r % 2 === 0;
    }
    for (let c = 8; c < this.moduleCount - 8; c += 1) {
      if (this.modules[6][c] !== null) {
        continue;
      }
      this.modules[6][c] = c % 2 === 0;
    }
  }

  setupPositionAdjustPattern() {
    const pos = QRUtil.getPatternPosition(this.typeNumber);
    for (let i = 0; i < pos.length; i += 1) {
      for (let j = 0; j < pos.length; j += 1) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] !== null) {
          continue;
        }
        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            this.modules[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
          }
        }
      }
    }
  }

  setupTypeNumber(test) {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (let i = 0; i < 18; i += 1) {
      const mod = !test && ((bits >>> i) & 1) === 1;
      this.modules[Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3] = mod;
      this.modules[(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  setupTypeInfo(test, maskPattern) {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i += 1) {
      const mod = !test && ((bits >>> i) & 1) === 1;
      if (i < 6) {
        this.modules[i][8] = mod;
      } else if (i < 8) {
        this.modules[i + 1][8] = mod;
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod;
      }
    }
    for (let i = 0; i < 15; i += 1) {
      const mod = !test && ((bits >>> i) & 1) === 1;
      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this.modules[8][15 - i - 1] = mod;
      } else {
        this.modules[8][15 - i] = mod;
      }
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  mapData(data, maskPattern) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) {
        col -= 1;
      }
      while (true) {
        for (let c = 0; c < 2; c += 1) {
          if (this.modules[row][col - c] !== null) {
            continue;
          }
          let dark = false;
          if (byteIndex < data.length) {
            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
          }
          const mask = QRUtil.getMask(maskPattern, row, col - c);
          this.modules[row][col - c] = mask ? !dark : dark;
          bitIndex -= 1;
          if (bitIndex === -1) {
            byteIndex += 1;
            bitIndex = 7;
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  static createData(typeNumber, errorCorrectLevel, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();
    for (const data of dataList) {
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (const rsBlock of rsBlocks) {
      totalDataCount += rsBlock.dataCount;
    }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error('code length overflow');
    }
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.getLengthInBits() % 8 !== 0) {
      buffer.putBit(false);
    }
    const data = buffer.getBuffer();
    const pads = [0xec, 0x11];
    let padIndex = 0;
    while (data.length < totalDataCount) {
      data.push(pads[padIndex % 2]);
      padIndex += 1;
    }
    return QRCodeModel.createBytes(data, rsBlocks);
  }

  static createBytes(buffer, rsBlocks) {
    let offset = 0;
    const maxDcCount = Math.max(...rsBlocks.map((b) => b.dataCount));
    const maxEcCount = Math.max(...rsBlocks.map((b) => b.totalCount - b.dataCount));
    const dcdata = [];
    const ecdata = [];
    for (const block of rsBlocks) {
      const dcCount = block.dataCount;
      const ecCount = block.totalCount - block.dataCount;
      const data = buffer.slice(offset, offset + dcCount);
      offset += dcCount;
      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(data, rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      const ec = new Array(rsPoly.getLength() - 1).fill(0);
      for (let i = 0; i < ec.length; i += 1) {
        const modIndex = i + modPoly.getLength() - ec.length;
        ec[i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
      dcdata.push(data);
      ecdata.push(ec);
    }
    const totalBytes = [];
    for (let i = 0; i < maxDcCount; i += 1) {
      for (const dc of dcdata) {
        if (i < dc.length) {
          totalBytes.push(dc[i]);
        }
      }
    }
    for (let i = 0; i < maxEcCount; i += 1) {
      for (const ec of ecdata) {
        if (i < ec.length) {
          totalBytes.push(ec[i]);
        }
      }
    }
    return totalBytes;
  }
}

function getUTF8Length(s) {
  const replacedText = encodeURI(s).toString().replace(/%[0-9a-fA-F]{2}/g, 'a');
  return replacedText.length + (replacedText.length !== s.length ? 3 : 0);
}

function getMode(value) {
  if (/^[0-9]+$/.test(value)) {
    return QRMode.MODE_NUMBER;
  }
  if (/^[0-9A-Z $%*+./:-]+$/.test(value)) {
    return QRMode.MODE_ALPHA_NUM;
  }
  return QRMode.MODE_8BIT_BYTE;
}

function chooseTypeNumber(value, correctionLevel) {
  const mode = getMode(value);
  const length = getUTF8Length(value);
  for (let typeNumber = 1; typeNumber <= 40; typeNumber += 1) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, correctionLevel);
    const totalDataCount = rsBlocks.reduce((sum, block) => sum + block.dataCount, 0);
    const lengthInBits = QRUtil.getLengthInBits(mode, typeNumber);
    const requiredBits = 4 + lengthInBits + length * 8;
    if (requiredBits <= totalDataCount * 8) {
      return typeNumber;
    }
  }
  throw new Error('Value too long');
}

function generateMatrix(value, correction) {
  const level = correction in QRErrorCorrectLevel ? QRErrorCorrectLevel[correction] : QRErrorCorrectLevel.M;
  const typeNumber = chooseTypeNumber(value, level);
  const qr = new QRCodeModel(typeNumber, level);
  qr.addData(value);
  return qr.make();
}

function renderSvg(matrix, quietZone, foreground, background, size) {
  const moduleCount = matrix.length;
  const total = moduleCount + quietZone * 2;
  const viewBox = `0 0 ${total} ${total}`;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" part="svg">`,
    `<rect width="100%" height="100%" fill="${background}" />`,
  ];
  const path = [];
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!matrix[row][col]) continue;
      path.push(`M${col + quietZone} ${row + quietZone}h1v1h-1z`);
    }
  }
  parts.push(`<path d="${path.join('')}" fill="${foreground}" shape-rendering="crispEdges" />`);
  parts.push('</svg>');
  return parts.join('');
}

class QRCodeElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'size', 'quiet-zone', 'error-correction'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--qr-foreground, currentColor);
        }

        .qr-container {
          inline-size: var(--qr-size, 160px);
          block-size: var(--qr-size, 160px);
        }

        svg {
          inline-size: 100%;
          block-size: 100%;
          display: block;
        }

        ::slotted(*) {
          font-size: 0.875rem;
          color: inherit;
        }
      </style>
      <div class="qr-container" part="container" aria-hidden="true"></div>
      <slot></slot>
    `;
    this._container = /** @type {HTMLDivElement} */ (this.shadowRoot.querySelector('.qr-container'));
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
    }
  }

  #render() {
    const value = this.value;
    if (!value) {
      this._container.innerHTML = '';
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      return;
    }

    try {
      const matrix = generateMatrix(value, this.errorCorrection);
      const styles = getComputedStyle(this);
      const foreground = styles.getPropertyValue('--qr-foreground').trim() || 'currentColor';
      const background = styles.getPropertyValue('--qr-background').trim() || 'transparent';
      const svg = renderSvg(matrix, this.quietZone, foreground, background, this.size);
      this._container.innerHTML = svg;
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', `QR code for ${value}`);
    } catch (error) {
      this._container.innerHTML = '';
      this.dispatchEvent(
        new CustomEvent('qr-code-error', {
          detail: /** @type {Error} */ (error).message,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  get value() {
    return this.getAttribute('value') ?? '';
  }

  set value(newValue) {
    this.setAttribute('value', newValue);
  }

  get size() {
    const attr = this.getAttribute('size');
    return attr ? Number(attr) : 160;
  }

  set size(newValue) {
    this.setAttribute('size', String(newValue));
  }

  get quietZone() {
    const attr = this.getAttribute('quiet-zone');
    return attr ? Number(attr) : 4;
  }

  set quietZone(newValue) {
    this.setAttribute('quiet-zone', String(newValue));
  }

  get errorCorrection() {
    const attr = this.getAttribute('error-correction');
    if (attr === 'L' || attr === 'M' || attr === 'Q' || attr === 'H') {
      return attr;
    }
    return 'M';
  }

  set errorCorrection(newValue) {
    this.setAttribute('error-correction', newValue);
  }
}

if (!customElements.get('qr-code')) {
  customElements.define('qr-code', QRCodeElement);
}

export { QRCodeElement };
