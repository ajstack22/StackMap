// Type declarations for untyped modules

// React Native modules
declare module 'react-native/Libraries/Image/AssetRegistry' {
  export function registerAsset(asset: any): number;
  export function getAssetByID(assetId: number): any;
}

declare module 'react-native/Libraries/Utilities/Platform' {
  export const OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
  export const Version: number | string;
  export const isPad: boolean;
  export const isTVOS: boolean;
  export const isTV: boolean;
  export function select<T>(specifics: { [platform: string]: T }): T;
}

declare module 'react-native/Libraries/TurboModule/TurboModuleRegistry' {
  export function get<T>(name: string): T | null;
  export function getEnforcing<T>(name: string): T;
}

// React Native Vector Icons
declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  export default class MaterialIcons extends Component<IconProps> {}

  export function getImageSource(
    name: string,
    size?: number,
    color?: string,
  ): Promise<any>;

  export function getImageSourceSync(
    name: string,
    size?: number,
    color?: string,
  ): any;

  export function getRawGlyphMap(): { [name: string]: number };
  export function hasIcon(name: string): boolean;
}

// Emoji datasource
declare module 'emoji-datasource-apple' {
  export interface Emoji {
    name: string;
    unified: string;
    non_qualified: string | null;
    docomo: string | null;
    au: string | null;
    softbank: string | null;
    google: string | null;
    image: string;
    sheet_x: number;
    sheet_y: number;
    short_name: string;
    short_names: string[];
    text: string | null;
    texts: string[] | null;
    category: string;
    subcategory: string;
    sort_order: number;
    added_in: string;
    has_img_apple: boolean;
    has_img_google: boolean;
    has_img_twitter: boolean;
    has_img_facebook: boolean;
    skin_variations?: { [key: string]: Emoji };
    obsoletes?: string;
    obsoleted_by?: string;
  }

  const emojis: Emoji[];
  export default emojis;
}

// React Native MMKV
declare module 'react-native-mmkv' {
  export class MMKV {
    constructor(config?: {
      id?: string;
      path?: string;
      encryptionKey?: string;
    });

    set(key: string, value: boolean | string | number): void;
    getBoolean(key: string): boolean | undefined;
    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;

    contains(key: string): boolean;
    delete(key: string): void;
    clearAll(): void;
    getAllKeys(): string[];

    addOnValueChangedListener(callback: (key: string) => void): () => void;
  }
}

// React Native Document Picker (RN 0.80+ compatible package)
declare module '@react-native-documents/picker' {
  export interface DocumentPickerResponse {
    uri: string;
    type: string;
    name: string;
    size: number;
    fileCopyUri?: string;
  }

  export interface DocumentPickerOptions {
    type?: string | string[];
    copyTo?: 'cachesDirectory' | 'documentDirectory';
    multiple?: boolean;
  }

  export function pick(
    options?: DocumentPickerOptions,
  ): Promise<DocumentPickerResponse[]>;

  export function pickSingle(
    options?: DocumentPickerOptions,
  ): Promise<DocumentPickerResponse>;

  export const types: {
    allFiles: string;
    images: string;
    plainText: string;
    audio: string;
    pdf: string;
    zip: string;
    csv: string;
    doc: string;
    docx: string;
    ppt: string;
    pptx: string;
    xls: string;
    xlsx: string;
    json: string;
  };

  export const errorCodes: {
    cancelled: string;
  };

  export class DocumentPickerError extends Error {
    code: string;
  }
}

// React Native QRCode SVG
declare module 'react-native-qrcode-svg' {
  import { Component } from 'react';

  export interface QRCodeProps {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?: any;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    gradientDirection?: string[];
    linearGradient?: string[];
    ecl?: 'L' | 'M' | 'Q' | 'H';
    getRef?: (ref: any) => void;
  }

  export default class QRCode extends Component<QRCodeProps> {
    toDataURL(callback: (dataURL: string) => void): void;
  }
}

// Tweetnacl util
declare module 'tweetnacl-util' {
  export function encodeBase64(arr: Uint8Array): string;
  export function decodeBase64(str: string): Uint8Array;
  export function encodeUTF8(str: string): Uint8Array;
  export function decodeUTF8(arr: Uint8Array): string;
}

// Tweetnacl
declare module 'tweetnacl' {
  export namespace box {
    interface KeyPair {
      publicKey: Uint8Array;
      secretKey: Uint8Array;
    }

    interface KeyPairFunctions {
      (): KeyPair;
      fromSecretKey(secretKey: Uint8Array): KeyPair;
    }

    const keyPair: KeyPairFunctions;

    const publicKeyLength: number;
    const secretKeyLength: number;
    const sharedKeyLength: number;
    const nonceLength: number;

    function before(publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;

    function after(
      message: Uint8Array,
      nonce: Uint8Array,
      sharedKey: Uint8Array,
    ): Uint8Array | null;

    function open(
      box: Uint8Array,
      nonce: Uint8Array,
      publicKey: Uint8Array,
      secretKey: Uint8Array,
    ): Uint8Array | null;
  }

  export namespace secretbox {
    function open(
      box: Uint8Array,
      nonce: Uint8Array,
      key: Uint8Array,
    ): Uint8Array | null;

    const keyLength: number;
    const nonceLength: number;
  }

  // randomBytes is exported as a top-level function, not a namespace

  export function hash(message: Uint8Array): Uint8Array;

  export namespace hash {
    const hashLength: number;
  }

  export namespace sign {
    interface KeyPair {
      publicKey: Uint8Array;
      secretKey: Uint8Array;
    }

    interface KeyPairFunctions {
      (): KeyPair;
      fromSecretKey(secretKey: Uint8Array): KeyPair;
      fromSeed(seed: Uint8Array): KeyPair;
    }

    const keyPair: KeyPairFunctions;

    interface DetachedFunctions {
      (message: Uint8Array, secretKey: Uint8Array): Uint8Array;
      verify(
        message: Uint8Array,
        signature: Uint8Array,
        publicKey: Uint8Array,
      ): boolean;
    }

    const detached: DetachedFunctions;

    const publicKeyLength: number;
    const secretKeyLength: number;
    const seedLength: number;
    const signatureLength: number;
  }

  export function randomBytes(length: number): Uint8Array;
}

// Pako compression
declare module 'pako' {
  export function deflate(data: Uint8Array | string, options?: any): Uint8Array;
  export function inflate(data: Uint8Array, options?: any): Uint8Array;
  export function deflateRaw(
    data: Uint8Array | string,
    options?: any,
  ): Uint8Array;
  export function inflateRaw(data: Uint8Array, options?: any): Uint8Array;
  export function gzip(data: Uint8Array | string, options?: any): Uint8Array;
  export function ungzip(data: Uint8Array, options?: any): Uint8Array;
}

// Platform-specific modules
declare module '*.ios' {
  const value: any;
  export default value;
}

declare module '*.android' {
  const value: any;
  export default value;
}

declare module '*.web' {
  const value: any;
  export default value;
}
