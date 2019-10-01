/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts" />
/// <reference path="../libs/core/dal.d.ts" />
/// <reference path="../libs/core/enums.d.ts" />
declare namespace pxsim {
    class DalBoard extends CoreBoard {
        ledMatrixState: LedMatrixState;
        edgeConnectorState: EdgeConnectorState;
        serialState: SerialState;
        accelerometerState: AccelerometerState;
        compassState: CompassState;
        thermometerState: ThermometerState;
        lightSensorState: LightSensorState;
        buttonPairState: ButtonPairState;
        radioState: RadioState;
        neopixelState: NeoPixelState;
        fileSystem: FileSystemState;
        viewHost: visuals.BoardHost;
        view: SVGElement;
        constructor();
        receiveMessage(msg: SimulatorMessage): void;
        initAsync(msg: SimulatorRunMessage): Promise<void>;
        screenshotAsync(width?: number): Promise<ImageData>;
    }
    function initRuntimeWithDalBoard(): void;
    function board(): DalBoard;
}
declare namespace pxsim.input {
    function onGesture(gesture: number, handler: RefAction): void;
    function isGesture(gesture: number): boolean;
    function acceleration(dimension: number): number;
    function rotation(kind: number): number;
    function setAccelerometerRange(range: number): void;
}
declare namespace pxsim {
    /**
      * Co-ordinate systems that can be used.
      * RAW: Unaltered data. Data will be returned directly from the accelerometer.
      *
      * SIMPLE_CARTESIAN: Data will be returned based on an easy to understand alignment, consistent with the cartesian system taught in schools.
      * When held upright, facing the user:
      *
      *                            /
      *    +--------------------+ z
      *    |                    |
      *    |       .....        |
      *    | *     .....      * |
      * ^  |       .....        |
      * |  |                    |
      * y  +--------------------+  x-->
      *
      *
      * NORTH_EAST_DOWN: Data will be returned based on the industry convention of the North East Down (NED) system.
      * When held upright, facing the user:
      *
      *                            z
      *    +--------------------+ /
      *    |                    |
      *    |       .....        |
      *    | *     .....      * |
      * ^  |       .....        |
      * |  |                    |
      * x  +--------------------+  y-->
      *
      */
    enum MicroBitCoordinateSystem {
        RAW = 0,
        SIMPLE_CARTESIAN = 1,
        NORTH_EAST_DOWN = 2,
    }
    enum AccelerometerFlag {
        X = 1,
        Y = 2,
        Z = 4,
    }
    class Accelerometer {
        runtime: Runtime;
        private sigma;
        private lastGesture;
        private currentGesture;
        private sample;
        private shake;
        private pitch;
        private roll;
        private id;
        isActive: boolean;
        sampleRange: number;
        flags: AccelerometerFlag;
        constructor(runtime: Runtime);
        setSampleRange(range: number): void;
        activate(flags?: AccelerometerFlag): void;
        /**
         * Reads the acceleration data from the accelerometer, and stores it in our buffer.
         * This is called by the tick() member function, if the interrupt is set!
         */
        update(x: number, y: number, z: number): void;
        instantaneousAccelerationSquared(): number;
        /**
         * Service function. Determines the best guess posture of the device based on instantaneous data.
         * This makes no use of historic data (except for shake), and forms this input to the filter implemented in updateGesture().
         *
         * @return A best guess of the current posture of the device, based on instantaneous data.
         */
        private instantaneousPosture();
        updateGesture(): void;
        forceGesture(gesture: number): void;
        private enqueueCurrentGesture();
        /**
          * Reads the X axis value of the latest update from the accelerometer.
          * @param system The coordinate system to use. By default, a simple cartesian system is provided.
          * @return The force measured in the X axis, in milli-g.
          *
          * Example:
          * @code
          * uBit.accelerometer.getX();
          * uBit.accelerometer.getX(RAW);
          * @endcode
          */
        getX(system?: MicroBitCoordinateSystem): number;
        /**
          * Reads the Y axis value of the latest update from the accelerometer.
          * @param system The coordinate system to use. By default, a simple cartesian system is provided.
          * @return The force measured in the Y axis, in milli-g.
          *
          * Example:
          * @code
          * uBit.accelerometer.getY();
          * uBit.accelerometer.getY(RAW);
          * @endcode
          */
        getY(system?: MicroBitCoordinateSystem): number;
        /**
          * Reads the Z axis value of the latest update from the accelerometer.
          * @param system The coordinate system to use. By default, a simple cartesian system is provided.
          * @return The force measured in the Z axis, in milli-g.
          *
          * Example:
          * @code
          * uBit.accelerometer.getZ();
          * uBit.accelerometer.getZ(RAW);
          * @endcode
          */
        getZ(system?: MicroBitCoordinateSystem): number;
        /**
          * Provides a rotation compensated pitch of the device, based on the latest update from the accelerometer.
          * @return The pitch of the device, in degrees.
          *
          * Example:
          * @code
          * uBit.accelerometer.getPitch();
          * @endcode
          */
        getPitch(): number;
        getPitchRadians(): number;
        /**
          * Provides a rotation compensated roll of the device, based on the latest update from the accelerometer.
          * @return The roll of the device, in degrees.
          *
          * Example:
          * @code
          * uBit.accelerometer.getRoll();
          * @endcode
          */
        getRoll(): number;
        getRollRadians(): number;
        getGesture(): number;
        /**
         * Recalculate roll and pitch values for the current sample.
         * We only do this at most once per sample, as the necessary trigonemteric functions are rather
         * heavyweight for a CPU without a floating point unit...
         */
        recalculatePitchRoll(): void;
    }
    class AccelerometerState {
        accelerometer: Accelerometer;
        useShake: boolean;
        constructor(runtime: Runtime);
        shake(): void;
    }
}
declare namespace pxsim.input {
    function onButtonPressed(button: number, handler: RefAction): void;
    function buttonIsPressed(button: number): boolean;
}
declare namespace pxsim.visuals {
    function mkBtnSvg(xy: Coord): SVGAndSize<SVGGElement>;
    const BUTTON_PAIR_STYLE: string;
    class ButtonPairView implements IBoardPart<ButtonPairState> {
        element: SVGElement;
        defs: SVGElement[];
        style: string;
        private state;
        private bus;
        private aBtn;
        private bBtn;
        private abBtn;
        init(bus: EventBus, state: ButtonPairState): void;
        moveToCoord(xy: Coord): void;
        updateState(): void;
        updateTheme(): void;
        private mkBtns();
        private attachEvents();
    }
}
declare namespace pxsim.input {
    function compassHeading(): number;
    function magneticForce(): number;
}
declare namespace pxsim.input {
    function onPinPressed(pinId: number, handler: RefAction): void;
    function onPinReleased(pinId: number, handler: RefAction): void;
    function pinIsPressed(pinId: number): boolean;
}
declare namespace pxsim {
    function getPin(id: number): Pin;
}
declare namespace pxsim.pins {
    function digitalReadPin(pinId: number): number;
    function digitalWritePin(pinId: number, value: number): void;
    function setPull(pinId: number, pull: number): void;
    function analogReadPin(pinId: number): number;
    function analogWritePin(pinId: number, value: number): void;
    function analogSetPeriod(pinId: number, micros: number): void;
    function servoWritePin(pinId: number, value: number): void;
    function servoSetPulse(pinId: number, micros: number): void;
    function analogSetPitchPin(pinId: number): void;
    function analogPitch(frequency: number, ms: number): void;
}
declare namespace pxsim {
    enum PinFlags {
        Unused = 0,
        Digital = 1,
        Analog = 2,
        Input = 4,
        Output = 8,
        Touch = 16,
    }
    class Pin {
        id: number;
        constructor(id: number);
        touched: boolean;
        value: number;
        period: number;
        servoAngle: number;
        mode: PinFlags;
        pitch: boolean;
        pull: number;
        digitalReadPin(): number;
        digitalWritePin(value: number): void;
        setPull(pull: number): void;
        analogReadPin(): number;
        analogWritePin(value: number): void;
        analogSetPeriod(micros: number): void;
        servoWritePin(value: number): void;
        servoSetPulse(pinId: number, micros: number): void;
        isTouched(): boolean;
    }
    interface EdgeConnectorProps {
        pins: number[];
        servos?: {
            [name: string]: number;
        };
    }
    class EdgeConnectorState {
        props: EdgeConnectorProps;
        pins: Pin[];
        constructor(props: EdgeConnectorProps);
        getPin(id: number): Pin;
    }
}
declare namespace pxsim.files {
    function appendLine(filename: string, text: string): void;
    function appendString(filename: string, text: string): void;
    function appendNumber(filename: string, value: number): void;
    function remove(filename: string): void;
    function readToSerial(filename: string): void;
}
declare namespace pxsim {
    enum DisplayMode {
        bw = 0,
        greyscale = 1,
    }
    class LedMatrixState {
        image: Image;
        brigthness: number;
        displayMode: DisplayMode;
        font: Image;
        disabled: boolean;
        animationQ: AnimationQueue;
        constructor(runtime: Runtime);
    }
    class Image extends RefObject {
        static height: number;
        width: number;
        data: number[];
        constructor(width: number, data: number[]);
        print(): void;
        get(x: number, y: number): number;
        set(x: number, y: number, v: number): void;
        copyTo(xSrcIndex: number, length: number, target: Image, xTargetIndex: number): void;
        shiftLeft(cols: number): void;
        shiftRight(cols: number): void;
        clear(): void;
    }
    function createInternalImage(width: number): Image;
    function createImage(width: number): Image;
    function createImageFromBuffer(data: number[]): Image;
    function createImageFromString(text: string): Image;
    function createFont(): Image;
}
declare namespace pxsim.images {
    function createImage(img: Image): Image;
    function createBigImage(img: Image): Image;
}
declare namespace pxsim.ImageMethods {
    function showImage(leds: Image, offset: number, interval: number): void;
    function plotImage(leds: Image, offset: number): void;
    function height(leds: Image): number;
    function width(leds: Image): number;
    function plotFrame(leds: Image, frame: number): void;
    function showFrame(leds: Image, frame: number, interval: number): void;
    function pixel(leds: Image, x: number, y: number): number;
    function setPixel(leds: Image, x: number, y: number, v: number): void;
    function clear(leds: Image): void;
    function setPixelBrightness(i: Image, x: number, y: number, b: number): void;
    function pixelBrightness(i: Image, x: number, y: number): number;
    function scrollImage(leds: Image, stride: number, interval: number): void;
}
declare namespace pxsim.basic {
    function showNumber(x: number, interval: number): void;
    function showString(s: string, interval: number): void;
    function showLeds(leds: Image, interval: number): void;
    function clearScreen(): void;
    function showAnimation(leds: Image, interval: number): void;
    function plotLeds(leds: Image): void;
}
declare namespace pxsim.led {
    function plot(x: number, y: number): void;
    function plotBrightness(x: number, y: number, brightness: number): void;
    function unplot(x: number, y: number): void;
    function point(x: number, y: number): boolean;
    function brightness(): number;
    function setBrightness(value: number): void;
    function stopAnimation(): void;
    function setDisplayMode(mode: DisplayMode): void;
    function displayMode(): DisplayMode;
    function screenshot(): Image;
    function enable(on: boolean): void;
}
declare namespace pxsim.input {
    function lightLevel(): number;
}
declare namespace pxsim.visuals {
    function mkMicroServoPart(xy?: Coord): SVGElAndSize;
    class MicroServoView implements IBoardPart<EdgeConnectorState> {
        style: string;
        overElement: SVGElement;
        element: SVGElement;
        defs: SVGElement[];
        state: EdgeConnectorState;
        bus: EventBus;
        private currentAngle;
        private targetAngle;
        private lastAngleTime;
        private pin;
        private crankEl;
        private crankTransform;
        init(bus: EventBus, state: EdgeConnectorState, svgEl: SVGSVGElement, otherParams: Map<string>): void;
        initDom(): void;
        moveToCoord(xy: visuals.Coord): void;
        updateState(): void;
        updateTheme(): void;
    }
}
declare namespace pxsim.control {
    function __midiSend(data: RefBuffer): void;
}
declare namespace pxsim {
    /**
     * Error codes used in the micro:bit runtime.
    */
    enum PanicCode {
        MICROBIT_OOM = 20,
        MICROBIT_HEAP_ERROR = 30,
        MICROBIT_NULL_DEREFERENCE = 40,
    }
    function panic(code: number): void;
    interface RuntimeOptions {
        theme: string;
    }
}
declare namespace pxsim.basic {
    var pause: typeof thread.pause;
    var forever: typeof thread.forever;
}
declare namespace pxsim.control {
    var inBackground: typeof thread.runInBackground;
    function createBuffer(sz: number): RefBuffer;
    function reset(): void;
    function waitMicros(micros: number): void;
    function deviceName(): string;
    function deviceSerialNumber(): number;
    function onEvent(id: number, evid: number, handler: RefAction): void;
    function raiseEvent(id: number, evid: number, mode: number): void;
    function eventTimestamp(): number;
    function eventValue(): string | number;
}
declare namespace pxsim.pxtcore {
    function registerWithDal(id: number, evid: number, handler: RefAction): void;
}
declare namespace pxsim.input {
    function runningTime(): number;
    function runningTimeMicros(): number;
    function calibrateCompass(): void;
}
declare namespace pxsim.pins {
    function onPulsed(name: number, pulse: number, body: RefAction): void;
    function pulseDuration(): number;
    function createBuffer(sz: number): RefBuffer;
    function pulseIn(name: number, value: number, maxDuration: number): number;
    function spiWrite(value: number): number;
    function spiFrequency(f: number): void;
    function spiFormat(bits: number, mode: number): void;
    function spiPins(mosi: number, miso: number, sck: number): void;
    function i2cReadBuffer(address: number, size: number, repeat?: boolean): RefBuffer;
    function i2cWriteBuffer(address: number, buf: RefBuffer, repeat?: boolean): void;
    function getPinAddress(name: number): Pin;
    function setEvents(name: number, event: number): void;
}
declare namespace pxsim.devices {
    function tellCameraTo(action: number): void;
    function tellRemoteControlTo(action: number): void;
    function raiseAlertTo(action: number): void;
    function onSignalStrengthChanged(action: number): void;
    function signalStrength(): number;
    function onGamepadButton(button: number, body: RefAction): void;
}
declare namespace pxsim.bluetooth {
    function startIOPinService(): void;
    function startLEDService(): void;
    function startTemperatureService(): void;
    function startMagnetometerService(): void;
    function startAccelerometerService(): void;
    function startButtonService(): void;
    function startUartService(): void;
    function uartWriteString(s: string): void;
    function uartWriteBuffer(b: RefBuffer): void;
    function uartReadBuffer(): RefBuffer;
    function uartReadUntil(del: string): string;
    function onUartDataReceived(delimiters: string, handler: RefAction): void;
    function onBluetoothConnected(a: RefAction): void;
    function onBluetoothDisconnected(a: RefAction): void;
    function advertiseUrl(url: string, power: number, connectable: boolean): void;
    function advertiseUidBuffer(nsAndInstance: RefBuffer, power: number, connectable: boolean): void;
    function stopAdvertising(): void;
    function setTransmitPower(power: number): void;
}
declare namespace pxsim {
    function sendBufferAsm(buffer: RefBuffer, pin: DigitalPin): void;
}
declare namespace pxsim {
    interface PacketBuffer {
        payload: SimulatorRadioPacketPayload;
        rssi: number;
        serial: number;
        time: number;
    }
    interface SimulatorRadioPacketPayload {
        bufferData?: Uint8Array;
    }
    class RadioDatagram {
        private runtime;
        datagram: PacketBuffer[];
        lastReceived: PacketBuffer;
        constructor(runtime: Runtime);
        queue(packet: PacketBuffer): void;
        send(payload: SimulatorRadioPacketPayload): void;
        recv(): PacketBuffer;
        private static defaultPacket();
    }
    class RadioState {
        power: number;
        transmitSerialNumber: boolean;
        datagram: RadioDatagram;
        groupId: number;
        constructor(runtime: Runtime);
        setGroup(id: number): void;
        setTransmitPower(power: number): void;
        setTransmitSerialNumber(sn: boolean): void;
        raiseEvent(id: number, eventid: number): void;
        receivePacket(packet: SimulatorRadioPacketMessage): void;
    }
}
declare namespace pxsim.radio {
    function raiseEvent(id: number, eventid: number): void;
    function setGroup(id: number): void;
    function setTransmitPower(power: number): void;
    function sendRawPacket(buf: RefBuffer): void;
    function readRawPacket(): RefBuffer;
    function receivedSignalStrength(): number;
    function onDataReceived(handler: RefAction): void;
}
declare namespace pxsim {
    class SerialState {
        serialIn: string[];
        receiveData(data: string): void;
        readSerial(): string;
        serialOutBuffer: string;
        writeSerial(s: string): void;
    }
}
declare namespace pxsim.control {
    function __log(s: string): void;
}
declare namespace pxsim.serial {
    function writeString(s: string): void;
    function writeBuffer(buf: RefBuffer): void;
    function readUntil(del: string): string;
    function readString(): string;
    function onDataReceived(delimiters: string, handler: RefAction): void;
    function redirect(tx: number, rx: number, rate: number): void;
    function redirectToUSB(): void;
    function setRxBufferSize(size: number): void;
    function setTxBufferSize(size: number): void;
    function readBuffer(length: number): RefBuffer;
}
declare namespace pxsim {
    class ThermometerState {
        usesTemperature: boolean;
        temperature: number;
    }
}
declare namespace pxsim.input {
    function temperature(): number;
}
declare namespace pxsim.visuals {
}
declare namespace pxsim.visuals {
    function mkLedMatrixSvg(xy: Coord, rows: number, cols: number): {
        el: SVGGElement;
        y: number;
        x: number;
        w: number;
        h: number;
        leds: SVGElement[];
        ledsOuter: SVGElement[];
        background: SVGElement;
    };
    interface ILedMatrixTheme {
        background?: string;
        ledOn?: string;
        ledOff?: string;
    }
    var defaultLedMatrixTheme: ILedMatrixTheme;
    const LED_MATRIX_STYLE = "\n            .sim-led-back:hover {\n                stroke:#a0a0a0;\n                stroke-width:3px;\n            }\n            .sim-led:hover {\n                stroke:#ff7f7f;\n                stroke-width:3px;\n            }\n            ";
    class LedMatrixView implements IBoardPart<LedMatrixState> {
        private background;
        private ledsOuter;
        private leds;
        private state;
        private bus;
        element: SVGElement;
        defs: SVGElement[];
        private theme;
        private DRAW_SIZE;
        private ACTIVE_SIZE;
        style: string;
        init(bus: EventBus, state: LedMatrixState): void;
        moveToCoord(xy: Coord): void;
        updateTheme(): void;
        updateState(): void;
        buildDom(): SVGGElement;
    }
}
declare namespace pxsim.visuals {
    interface IBoardTheme {
        highContrast?: boolean;
        accent?: string;
        display?: string;
        pin?: string;
        pinTouched?: string;
        pinActive?: string;
        ledOn?: string;
        ledOff?: string;
        buttonOuter?: string;
        buttonUp?: string;
        buttonDown?: string;
        virtualButtonOuter?: string;
        virtualButtonUp?: string;
        virtualButtonDown?: string;
        lightLevelOn?: string;
        lightLevelOff?: string;
    }
    var themes: IBoardTheme[];
    function randomTheme(highContrast?: boolean): IBoardTheme;
    interface IBoardProps {
        runtime?: pxsim.Runtime;
        theme?: IBoardTheme;
        wireframe?: boolean;
    }
    class MicrobitBoardSvg implements BoardView {
        props: IBoardProps;
        element: SVGSVGElement;
        private style;
        private defs;
        private g;
        private logos;
        private head;
        private headInitialized;
        private headText;
        private display;
        private buttons;
        private buttonsOuter;
        private buttonABText;
        private pins;
        private pinGradients;
        private pinTexts;
        private ledsOuter;
        private leds;
        private systemLed;
        private antenna;
        private lightLevelButton;
        private lightLevelGradient;
        private lightLevelText;
        private thermometerGradient;
        private thermometer;
        private thermometerText;
        private shakeButton;
        private shakeText;
        private accTextX;
        private accTextY;
        private accTextZ;
        board: pxsim.DalBoard;
        private pinNmToCoord;
        constructor(props: IBoardProps);
        getView(): SVGAndSize<SVGSVGElement>;
        getCoord(pinNm: string): Coord;
        highlightPin(pinNm: string): void;
        getPinDist(): number;
        recordPinCoords(): void;
        private updateTheme();
        updateState(): void;
        private updateGestures();
        private updateButtonAB();
        private updatePin(pin, index);
        private updateTemperature();
        private updateHeading();
        private lastFlashTime;
        flashSystemLed(): void;
        private lastAntennaFlash;
        flashAntenna(): void;
        private updatePins();
        private updateLightLevel();
        private applyLightLevel();
        findParentElement(): SVGSVGElement;
        private updateTilt();
        private buildDom();
        private attachEvents();
    }
}
declare namespace pxsim.visuals {
    function mkNeoPixelPart(xy?: Coord): SVGElAndSize;
    class NeoPixel {
        el: SVGElement;
        cy: number;
        constructor(xy?: Coord);
        setRgb(rgb: [number, number, number]): void;
    }
    class NeoPixelCanvas {
        canvas: SVGSVGElement;
        pin: number;
        pixels: NeoPixel[];
        private viewBox;
        private background;
        constructor(pin: number);
        private updateViewBox(x, y, w, h);
        update(colors: RGBW[]): void;
        setLoc(xy: Coord): void;
    }
    class NeoPixelView implements IBoardPart<NeoPixelState> {
        style: string;
        element: SVGElement;
        overElement: SVGElement;
        defs: SVGElement[];
        private state;
        private canvas;
        private part;
        private stripGroup;
        private lastLocation;
        private pin;
        private mode;
        init(bus: EventBus, state: NeoPixelState, svgEl: SVGSVGElement, otherParams: Map<string>): void;
        moveToCoord(xy: Coord): void;
        private updateStripLoc();
        updateState(): void;
        updateTheme(): void;
    }
}
