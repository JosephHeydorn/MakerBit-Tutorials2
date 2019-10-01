/// <reference path="../pxtwinrt/winrtrefs.d.ts" />
/// <reference path="pxtlib.d.ts" />
/// <reference path="pxteditor.d.ts" />
declare namespace pxt.winrt {
    function driveDeployCoreAsync(res: pxtc.CompileResult): Promise<void>;
    function browserDownloadAsync(text: string, name: string, contentType: string): Promise<void>;
    function saveOnlyAsync(res: pxtc.CompileResult): Promise<boolean>;
}
declare type WHID = Windows.Devices.HumanInterfaceDevice.HidDevice;
declare namespace pxt.winrt {
    class WindowsRuntimeIO implements pxt.HF2.PacketIO {
        onData: (v: Uint8Array) => void;
        onEvent: (v: Uint8Array) => void;
        onError: (e: Error) => void;
        dev: Windows.Devices.HumanInterfaceDevice.HidDevice;
        constructor();
        error(msg: string): void;
        reconnectAsync(): Promise<void>;
        isSwitchingToBootloader(): void;
        disconnectAsync(): Promise<void>;
        sendPacketAsync(pkt: Uint8Array): Promise<void>;
        initAsync(isRetry?: boolean): Promise<void>;
    }
    let packetIO: WindowsRuntimeIO;
    function mkPacketIOAsync(): Promise<pxt.HF2.PacketIO>;
    function isSwitchingToBootloader(): void;
    function initWinrtHid(reconnectUf2WrapperCb: () => Promise<void>, disconnectUf2WrapperCb: () => Promise<void>): void;
}
declare type DeviceWatcher = Windows.Devices.Enumeration.DeviceWatcher;
declare type DeviceInfo = Windows.Devices.Enumeration.DeviceInformation;
declare type DeviceInfoCollection = Windows.Devices.Enumeration.DeviceInformationCollection;
declare type SerialDevice = Windows.Devices.SerialCommunication.SerialDevice;
declare type LoadOperation = Windows.Storage.Streams.DataReaderLoadOperation;
declare type IBuffer = Windows.Storage.Streams.IBuffer;
declare type AsyncOp<TResult, TProgress> = Windows.Foundation.IAsyncOperationWithProgress<TResult, TProgress>;
declare namespace pxt.winrt {
    function initSerial(): void;
    function suspendSerialAsync(): Promise<void>;
    /**
     * Most Arduino devices support switching into bootloader by opening the COM port at 1200 baudrate.
     */
    function bootloaderViaBaud(): Promise<any>;
    /**
     * Connects to all matching serial devices without initializing the full PXT serial stack. Returns the list of
     * devices that were successfully connected to, but doesn't do anything with these devices.
     */
    function connectSerialDevicesAsync(hidSelectors: pxtc.HidSelector[]): Promise<SerialDevice[]>;
}
declare namespace pxt.winrt {
    function promisify<T>(p: Windows.Foundation.IAsyncOperation<T> | Windows.Foundation.Projections.Promise<T>): Promise<T>;
    function toArray<T>(v: any): T[];
    /**
     * Detects if the script is running in a browser on windows
     */
    function isWindows(): boolean;
    function isWinRT(): boolean;
    function initAsync(importHexImpl?: (hex: pxt.cpp.HexFile, options?: pxt.editor.ImportFileOptions) => void): Promise<void>;
    function captureInitialActivation(): void;
    function loadActivationProject(): Promise<void>;
    function hasActivationProjectAsync(): Promise<boolean>;
    function releaseAllDevicesAsync(): Promise<void>;
}
declare namespace pxt.winrt.workspace {
    function fileApiAsync(path: string, data?: any): Promise<FsPkg> | Promise<FsPkgs>;
    function getProvider(base: pxt.workspace.WorkspaceProvider): pxt.workspace.WorkspaceProvider;
}
