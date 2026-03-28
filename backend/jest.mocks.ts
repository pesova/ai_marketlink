const multer = require('multer');
const memoryUpload = multer({ storage: multer.memoryStorage() });

jest.mock('./src/config/database', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('./src/services/api/NinService', () => ({
  __esModule: true,
  default: {
    verifyNin: jest.fn().mockResolvedValue({
      verified: true,
      data: { status: 'verified', applicant: {}, summary: {} },
      message: 'NIN verified successfully',
    }),
  },
}));

jest.mock('./src/services/api/InterswitchAuth', () => ({
  __esModule: true,
  default: {
    getToken: jest.fn().mockResolvedValue('mock-bearer-token'),
  },
}));

jest.mock('./src/infrastructure/vector/VectorService', () => ({
  __esModule: true,
  default: {
    generateEmbedding: jest.fn().mockResolvedValue(new Array(8).fill(0.01)),
    searchProducts: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('./src/infrastructure/upload/CloudinaryUpload', () => ({
  __esModule: true,
  default: memoryUpload,
  uploadToCloudinary: jest.fn().mockResolvedValue('https://cloudinary.test/mock-image.jpg'),
  uploadManyToCloudinary: jest.fn().mockImplementation((files: { buffer: Buffer }[]) =>
    Promise.resolve(files.map(() => 'https://cloudinary.test/mock-image.jpg')),
  ),
  deleteFromCloudinary: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./src/services/ChatService', () => ({
  __esModule: true,
  default: {
    chat: jest.fn().mockResolvedValue({ reply: 'Mock assistant reply', sessionId: 'sess-1' }),
    getHistory: jest.fn().mockResolvedValue({ messages: [], summary: null }),
    clearHistory: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./src/services/api/InterswitchProvider', () => ({
  __esModule: true,
  default: {
    createPaymentLink: jest.fn().mockResolvedValue({
      id: 1,
      merchantCode: 'MERCH001',
      payableCode: 'PAY001',
      amount: 100000,
      code: '200',
      reference: 'ISW-REF-TEST',
      paymentUrl: 'https://interswitch.test/pay',
      transactionReference: 'ISW-TXN-TEST',
      redirectUrl: 'http://localhost/callback',
      customerId: 'buyer@test.com',
      customerEmail: 'buyer@test.com',
      currencyCode: '566',
    }),
    verifyTransaction: jest.fn().mockImplementation((_ref: string, amountKobo: number) =>
      Promise.resolve({
        responseCode: '00',
        responseDescription: 'Approved',
        transactionRef: _ref,
        amount: amountKobo,
        paymentReference: 'PAY-REF-1',
      }),
    ),
  },
}));

const notificationChain: Record<string, jest.Mock> = {};
const chainMethods = [
  'setFrom',
  'setTo',
  'setSubject',
  'setMessage',
  'setCategory',
  'setDetails',
  'useTemplate',
] as const;
chainMethods.forEach((m) => {
  notificationChain[m] = jest.fn(() => notificationChain);
});
notificationChain.sendViaEmail = jest.fn().mockResolvedValue(undefined);
notificationChain.sendToDB = jest.fn().mockResolvedValue(null);

jest.mock('./src/services/NotificationService', () => ({
  __esModule: true,
  default: notificationChain,
}));
