import HF2 = pxt.HF2;
export declare function isInstalled(install?: boolean): boolean;
export interface HidDevice {
    vendorId: number;
    productId: number;
    path: string;
    serialNumber: string;
    manufacturer: string;
    product: string;
    release: number;
}
export declare function listAsync(): Promise<void>;
export declare function serialAsync(): Promise<void>;
export declare function dmesgAsync(): Promise<void>;
export declare function deviceInfo(h: HidDevice): string;
export declare function getHF2DevicesAsync(): Promise<HidDevice[]>;
export declare function hf2ConnectAsync(path: string, raw?: boolean): Promise<any>;
export declare function mkPacketIOAsync(): Promise<any>;
export declare function initAsync(path?: string): Promise<HF2.Wrapper>;
export declare function connectSerial(w: HF2.Wrapper): void;
export declare class HIDError extends Error {
    constructor(m: string);
}
export declare class HidIO implements HF2.PacketIO {
    private requestedPath;
    dev: any;
    private path;
    onData: (v: Uint8Array) => void;
    onEvent: (v: Uint8Array) => void;
    onError: (e: Error) => void;
    constructor(requestedPath: string);
    private connect();
    sendPacketAsync(pkt: Uint8Array): Promise<void>;
    error(msg: string): any;
    disconnectAsync(): Promise<void>;
    reconnectAsync(): Promise<void>;
}
