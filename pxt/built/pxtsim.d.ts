/// <reference path="../localtypings/vscode-debug-protocol.d.ts" />
/// <reference path="../localtypings/pxtparts.d.ts" />
declare namespace pxsim.accessibility {
    function makeFocusable(elem: SVGElement): void;
    function enableKeyboardInteraction(elem: Element, handlerKeyDown?: () => void, handlerKeyUp?: () => void): void;
    function setAria(elem: Element, role?: string, label?: string): void;
    function setLiveContent(value: string): void;
}
declare namespace pxsim {
    interface AllocatorOpts {
        boardDef: BoardDefinition;
        partDefs: Map<PartDefinition>;
        partsList: string[];
        fnArgs: any;
        getBBCoord: (loc: BBLoc) => visuals.Coord;
    }
    interface AllocatorResult {
        partsAndWires: PartAndWiresInst[];
        requiresBreadboard?: boolean;
        hideBreadboard?: boolean;
        parts: pxsim.visuals.IBoardPart<any>[];
        wires: pxsim.visuals.Wire[];
    }
    interface PartInst {
        name: string;
        simulationBehavior?: string;
        visual: PartVisualDefinition;
        bbFit: PartBBFit;
        startColumnIdx: number;
        startRowIdx: number;
        breadboardConnections: BBLoc[];
        params: Map<string>;
    }
    interface WireInst {
        start: Loc;
        end: Loc;
        color: string;
    }
    interface AssemblyStep {
        part?: boolean;
        wireIndices?: number[];
    }
    interface PartAndWiresInst {
        part?: PartInst;
        wires?: WireInst[];
        assembly: AssemblyStep[];
    }
    interface PartBBFit {
        xOffset: number;
        yOffset: number;
        rowCount: number;
        colCount: number;
    }
    function readPin(arg: string): string;
    function allocateDefinitions(opts: AllocatorOpts): AllocatorResult;
}
/**
 * Heavily adapted from https://github.com/Microsoft/vscode-debugadapter-node
 * and altered to run in a browser and communcate via JSON over a websocket
 * rather than through stdin and stdout
 */
declare namespace pxsim.protocol {
    /**
     * Host for debug session that is responsible with communication with
     * the debugger's user interface.
     */
    interface DebugSessionHost {
        send(msg: string): void;
        onData(cb: (msg: DebugProtocol.ProtocolMessage) => void): void;
        onError(cb: (e?: any) => void): void;
        onClose(cb: () => void): void;
        close(): void;
    }
    class Message implements DebugProtocol.ProtocolMessage {
        seq: number;
        type: string;
        constructor(type: string);
    }
    class Response extends Message implements DebugProtocol.Response {
        request_seq: number;
        success: boolean;
        command: string;
        constructor(request: DebugProtocol.Request, message?: string);
    }
    class Event extends Message implements DebugProtocol.Event {
        event: string;
        constructor(event: string, body?: any);
    }
    class Source implements DebugProtocol.Source {
        name: string;
        path: string;
        sourceReference: number;
        constructor(name: string, path: string, id?: number, origin?: string, data?: any);
    }
    class Scope implements DebugProtocol.Scope {
        name: string;
        variablesReference: number;
        expensive: boolean;
        constructor(name: string, reference: number, expensive?: boolean);
    }
    class StackFrame implements DebugProtocol.StackFrame {
        id: number;
        source: Source;
        line: number;
        column: number;
        name: string;
        constructor(i: number, nm: string, src?: Source, ln?: number, col?: number);
    }
    class Thread implements DebugProtocol.Thread {
        id: number;
        name: string;
        constructor(id: number, name: string);
    }
    class Variable implements DebugProtocol.Variable {
        name: string;
        value: string;
        variablesReference: number;
        constructor(name: string, value: string, ref?: number, indexedVariables?: number, namedVariables?: number);
    }
    class Breakpoint implements DebugProtocol.Breakpoint {
        verified: boolean;
        constructor(verified: boolean, line?: number, column?: number, source?: Source);
    }
    class Module implements DebugProtocol.Module {
        id: number | string;
        name: string;
        constructor(id: number | string, name: string);
    }
    class CompletionItem implements DebugProtocol.CompletionItem {
        label: string;
        start: number;
        length: number;
        constructor(label: string, start: number, length?: number);
    }
    class StoppedEvent extends Event implements DebugProtocol.StoppedEvent {
        body: {
            reason: string;
            threadId: number;
        };
        constructor(reason: string, threadId: number, exception_text?: string);
    }
    class ContinuedEvent extends Event implements DebugProtocol.ContinuedEvent {
        body: {
            threadId: number;
        };
        constructor(threadId: number, allThreadsContinued?: boolean);
    }
    class InitializedEvent extends Event implements DebugProtocol.InitializedEvent {
        constructor();
    }
    class TerminatedEvent extends Event implements DebugProtocol.TerminatedEvent {
        constructor(restart?: boolean);
    }
    class OutputEvent extends Event implements DebugProtocol.OutputEvent {
        body: {
            category: string;
            output: string;
            data?: any;
        };
        constructor(output: string, category?: string, data?: any);
    }
    class ThreadEvent extends Event implements DebugProtocol.ThreadEvent {
        body: {
            reason: string;
            threadId: number;
        };
        constructor(reason: string, threadId: number);
    }
    class BreakpointEvent extends Event implements DebugProtocol.BreakpointEvent {
        body: {
            reason: string;
            breakpoint: Breakpoint;
        };
        constructor(reason: string, breakpoint: Breakpoint);
    }
    class ModuleEvent extends Event implements DebugProtocol.ModuleEvent {
        body: {
            reason: 'new' | 'changed' | 'removed';
            module: Module;
        };
        constructor(reason: 'new' | 'changed' | 'removed', module: Module);
    }
    class ProtocolServer {
        private host;
        private _pendingRequests;
        private _sequence;
        start(host: DebugSessionHost): void;
        stop(): void;
        sendEvent(event: DebugProtocol.Event): void;
        sendResponse(response: DebugProtocol.Response): void;
        sendRequest(command: string, args: any, timeout: number, cb: (response: DebugProtocol.Response) => void): void;
        private send(typ, message);
        protected dispatchRequest(request: DebugProtocol.Request): void;
    }
    class DebugSession extends ProtocolServer {
        private _debuggerLinesStartAt1;
        private _debuggerColumnsStartAt1;
        private _debuggerPathsAreURIs;
        private _clientLinesStartAt1;
        private _clientColumnsStartAt1;
        private _clientPathsAreURIs;
        private _isServer;
        shutdown(): void;
        protected dispatchRequest(request: DebugProtocol.Request): void;
        protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void;
        protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): void;
        protected launchRequest(response: DebugProtocol.LaunchResponse, args: DebugProtocol.LaunchRequestArguments): void;
        protected attachRequest(response: DebugProtocol.AttachResponse, args: DebugProtocol.AttachRequestArguments): void;
        protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): void;
        protected setFunctionBreakPointsRequest(response: DebugProtocol.SetFunctionBreakpointsResponse, args: DebugProtocol.SetFunctionBreakpointsArguments): void;
        protected setExceptionBreakPointsRequest(response: DebugProtocol.SetExceptionBreakpointsResponse, args: DebugProtocol.SetExceptionBreakpointsArguments): void;
        protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): void;
        protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void;
        protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void;
        protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): void;
        protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): void;
        protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void;
        protected restartFrameRequest(response: DebugProtocol.RestartFrameResponse, args: DebugProtocol.RestartFrameArguments): void;
        protected gotoRequest(response: DebugProtocol.GotoResponse, args: DebugProtocol.GotoArguments): void;
        protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): void;
        protected sourceRequest(response: DebugProtocol.SourceResponse, args: DebugProtocol.SourceArguments): void;
        protected threadsRequest(response: DebugProtocol.ThreadsResponse): void;
        protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void;
        protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void;
        protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void;
        protected setVariableRequest(response: DebugProtocol.SetVariableResponse, args: DebugProtocol.SetVariableArguments): void;
        protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void;
        protected stepInTargetsRequest(response: DebugProtocol.StepInTargetsResponse, args: DebugProtocol.StepInTargetsArguments): void;
        protected gotoTargetsRequest(response: DebugProtocol.GotoTargetsResponse, args: DebugProtocol.GotoTargetsArguments): void;
        protected completionsRequest(response: DebugProtocol.CompletionsResponse, args: DebugProtocol.CompletionsArguments): void;
        /**
         * Override this hook to implement custom requests.
         */
        protected customRequest(command: string, response: DebugProtocol.Response, args: any): void;
        protected sendErrorResponse(response: DebugProtocol.Response, codeOrMessage: number | DebugProtocol.Message, format?: string, variables?: any): void;
        protected convertClientLineToDebugger(line: number): number;
        protected convertDebuggerLineToClient(line: number): number;
        protected convertClientColumnToDebugger(column: number): number;
        protected convertDebuggerColumnToClient(column: number): number;
        protected convertClientPathToDebugger(clientPath: string): string;
        protected convertDebuggerPathToClient(debuggerPath: string): string;
        private static path2uri(str);
        private static uri2path(url);
        private static _formatPIIRegexp;
        private static formatPII(format, excludePII, args);
    }
}
declare namespace pxsim.util {
    function injectPolyphils(): void;
    class Lazy<T> {
        private _func;
        private _value;
        private _evaluated;
        constructor(_func: () => T);
        readonly value: T;
    }
    function getNormalizedParts(path: string): string[];
    function normalizePath(path: string): string;
    function relativePath(fromDir: string, toFile: string): string;
    function pathJoin(...paths: string[]): string;
    function toArray<T>(a: ArrayLike<T> | ReadonlyArray<T>): T[];
}
declare namespace pxsim {
    function getWarningMessage(msg: string): DebuggerWarningMessage;
    class BreakpointMap {
        fileMap: {
            [index: string]: [number, DebugProtocol.Breakpoint][];
        };
        idMap: {
            [index: number]: DebugProtocol.Breakpoint;
        };
        constructor(breakpoints: [number, DebugProtocol.Breakpoint][]);
        getById(id: number): DebugProtocol.Breakpoint;
        verifyBreakpoint(path: string, breakpoint: DebugProtocol.SourceBreakpoint): [number, DebugProtocol.Breakpoint];
    }
    function dumpHeap(v: any, heap: Map<any>, fields?: string[], filters?: string[]): Variables;
    function getBreakpointMsg(s: pxsim.StackFrame, brkId: number, userGlobals?: string[]): {
        msg: DebuggerBreakpointMessage;
        heap: Map<any>;
    };
    interface SimLaunchArgs extends DebugProtocol.LaunchRequestArguments {
        projectDir: string;
    }
    class SimDebugSession extends protocol.DebugSession {
        private static THREAD_ID;
        private driver;
        private lastBreak;
        private state;
        private projectDir;
        private breakpoints;
        constructor(container: HTMLElement);
        runCode(js: string, parts: string[], fnArgs: Map<string>, breakpoints: BreakpointMap, board: pxsim.BoardDefinition): void;
        stopSimulator(unload?: boolean): void;
        protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void;
        protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): void;
        protected launchRequest(response: DebugProtocol.LaunchResponse, args: SimLaunchArgs): void;
        protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): void;
        protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void;
        protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void;
        protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): void;
        protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): void;
        protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): void;
        protected threadsRequest(response: DebugProtocol.ThreadsResponse): void;
        protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void;
        protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void;
        protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void;
        private onDebuggerBreakpoint(breakMsg);
        private onDebuggerWarning(warnMsg);
        private onDebuggerResume();
        private onStateChanged(state);
        private fixBreakpoints();
    }
}
declare namespace pxsim {
    interface SimulatorRunMessage extends SimulatorMessage {
        type: "run";
        id?: string;
        boardDefinition?: BoardDefinition;
        frameCounter?: number;
        refCountingDebug?: boolean;
        options?: any;
        parts?: string[];
        partDefinitions?: Map<PartDefinition>;
        fnArgs?: any;
        code: string;
        mute?: boolean;
        highContrast?: boolean;
        light?: boolean;
        cdnUrl?: string;
        localizedStrings?: Map<string>;
        version?: string;
        clickTrigger?: boolean;
        breakOnStart?: boolean;
        storedState?: Map<any>;
    }
    interface SimulatorInstructionsMessage extends SimulatorMessage {
        type: "instructions";
        options: pxsim.instructions.RenderPartsOptions;
    }
    interface SimulatorMuteMessage extends SimulatorMessage {
        type: "mute";
        mute: boolean;
    }
    interface SimulatorStopSoundMessage extends SimulatorMessage {
        type: "stopsound";
    }
    interface SimulatorDocMessage extends SimulatorMessage {
        type: "localtoken" | "docfailed";
        docType?: string;
        src?: string;
        localToken?: string;
    }
    interface SimulatorFileLoadedMessage extends SimulatorMessage {
        type: "fileloaded";
        name: string;
        locale: string;
        content?: string;
    }
    interface SimulatorReadyMessage extends SimulatorMessage {
        type: "ready";
        frameid: string;
    }
    interface SimulatorTopLevelCodeFinishedMessage extends SimulatorMessage {
        type: "toplevelcodefinished";
    }
    interface SimulatorOpenDocMessage extends SimulatorMessage {
        type: "opendoc";
        url: string;
    }
    interface SimulatorStateMessage extends SimulatorMessage {
        type: "status";
        frameid?: string;
        runtimeid?: string;
        state: string;
    }
    interface SimulatorBroadcastMessage extends SimulatorMessage {
        broadcast: boolean;
    }
    interface SimulatorEventBusMessage extends SimulatorBroadcastMessage {
        type: "eventbus";
        broadcast: true;
        id: number;
        eventid: number;
        value?: number;
    }
    interface SimulatorSerialMessage extends SimulatorMessage {
        type: "serial";
        id: string;
        data: string;
        sim?: boolean;
        receivedTime?: number;
    }
    interface SimulatorBulkSerialMessage extends SimulatorMessage {
        type: "bulkserial";
        id: string;
        data: {
            data: string;
            time: number;
        }[];
        sim?: boolean;
    }
    interface SimulatorCommandMessage extends SimulatorMessage {
        type: "simulator";
        command: "modal" | "restart" | "reload" | "setstate" | "focus" | "blur";
        stateKey?: string;
        stateValue?: any;
        header?: string;
        body?: string;
        copyable?: string;
        linkButtonHref?: string;
        linkButtonLabel?: string;
        displayOnceId?: string;
        modalContext?: string;
        timestamp?: number;
    }
    interface SimulatorRadioPacketMessage extends SimulatorBroadcastMessage {
        type: "radiopacket";
        broadcast: true;
        rssi: number;
        serial: number;
        time: number;
        payload: SimulatorRadioPacketPayload;
    }
    interface SimulatorInfraredPacketMessage extends SimulatorBroadcastMessage {
        type: "irpacket";
        broadcast: true;
        packet: Uint8Array;
    }
    interface SimulatorBLEPacketMessage extends SimulatorBroadcastMessage {
        type: "blepacket";
        broadcast: true;
        packet: Uint8Array;
    }
    interface SimulatorI2CMessage extends SimulatorMessage {
        type: "i2c";
        data: Uint8Array;
    }
    interface SimulatorRadioPacketPayload {
        type: number;
        groupId: number;
        stringData?: string;
        numberData?: number;
    }
    interface SimulatorCustomMessage extends SimulatorMessage {
        type: "custom";
        content: any;
    }
    interface SimulatorScreenshotMessage extends SimulatorMessage {
        type: "screenshot";
        data: ImageData;
        delay?: number;
    }
    interface SimulatorRecorderMessage extends SimulatorMessage {
        type: "recorder";
        action: "start" | "stop";
        width?: number;
    }
    interface TutorialMessage extends SimulatorMessage {
        type: "tutorial";
        tutorial: string;
        subtype: string;
    }
    interface ImportFileMessage extends SimulatorMessage {
        type: "importfile";
        filename: string;
        parts: (string | ArrayBuffer)[];
    }
    interface TutorialStepInfo {
        fullscreen?: boolean;
        hasHint?: boolean;
        contentMd?: string;
        headerContentMd?: string;
    }
    interface TutorialLoadedMessage extends TutorialMessage {
        subtype: "loaded";
        showCategories?: boolean;
        stepInfo: TutorialStepInfo[];
        toolboxSubset?: {
            [index: string]: number;
        };
    }
    interface TutorialStepChangeMessage extends TutorialMessage {
        subtype: "stepchange";
        step: number;
    }
    interface TutorialFailedMessage extends TutorialMessage {
        subtype: "error";
        message?: string;
    }
    interface RenderReadyResponseMessage extends SimulatorMessage {
        source: "makecode";
        type: "renderready";
    }
    interface RenderBlocksRequestMessage extends SimulatorMessage {
        type: "renderblocks";
        id: string;
        code?: string;
        options?: {
            packageId?: string;
            package?: string;
            snippetMode?: boolean;
        };
    }
    interface RenderBlocksResponseMessage extends SimulatorMessage {
        source: "makecode";
        type: "renderblocks";
        id: string;
        svg?: string;
        width?: number;
        height?: number;
        css?: string;
        uri?: string;
        error?: string;
    }
    function print(delay?: number): void;
    namespace Embed {
        let frameid: string;
        function start(): void;
        function stop(): void;
        function run(msg: SimulatorRunMessage): void;
    }
    /**
     * Log an event to the parent editor (allowSimTelemetry must be enabled in target)
     * @param id The id of the event
     * @param data Any custom values associated with this event
     */
    function tickEvent(id: string, data?: Map<string | number>): void;
    /**
     * Log an error to the parent editor (allowSimTelemetry must be enabled in target)
     * @param cat The category of the error
     * @param msg The error message
     * @param data Any custom values associated with this event
     */
    function reportError(cat: string, msg: string, data?: Map<string>): void;
    function reload(): void;
}
declare namespace pxsim.instructions {
    interface RenderPartsOptions {
        name: string;
        boardDef: BoardDefinition;
        parts: string[];
        partDefinitions: Map<PartDefinition>;
        fnArgs: any;
        configData: pxsim.ConfigData;
        print?: boolean;
    }
    function renderParts(container: HTMLElement, options: RenderPartsOptions): void;
    function renderInstructions(msg: SimulatorInstructionsMessage): void;
}
declare namespace pxsim {
    let quiet: boolean;
    function check(cond: boolean, msg?: string): void;
    let title: string;
    function getConfig(id: number): number;
    function getConfigKey(id: string): number;
    function getAllConfigKeys(): string[];
    function setConfigKey(key: string, id: number): void;
    function setConfig(id: number, val: number): void;
    function setConfigData(cfg_: Map<number>, cfgKey_: Map<number>): void;
    interface ConfigData {
        cfg: Map<number>;
        cfgKey: Map<number>;
    }
    function getConfigData(): ConfigData;
    function setTitle(t: string): void;
    class RefObject {
        id: number;
        constructor();
        destroy(): void;
        print(): void;
        toDebugString(): string;
        static toAny(o: any): any;
        static toDebugString(o: any): string;
    }
    class FnWrapper {
        func: LabelFn;
        caps: any[];
        args: any[];
        constructor(func: LabelFn, caps: any[], args: any[]);
    }
    interface VTable {
        name: string;
        methods: LabelFn[];
        numFields: number;
        toStringMethod?: LabelFn;
        classNo: number;
        lastSubtypeNo: number;
        iface?: Map<any>;
    }
    class RefRecord extends RefObject {
        fields: any;
        vtable: VTable;
        destroy(): void;
        print(): void;
    }
    class RefAction extends RefObject {
        fields: any[];
        len: number;
        func: LabelFn;
        isRef(idx: number): boolean;
        ldclo(n: number): any;
        destroy(): void;
        print(): void;
    }
    namespace pxtcore {
        function seedAddRandom(num: number): void;
        function mkAction(len: number, fn: LabelFn): RefAction;
        function runAction(a: RefAction, args: any[]): void;
        function dumpPerfCounters(): void;
    }
    class RefRefLocal extends RefObject {
        v: any;
        destroy(): void;
        print(): void;
    }
    interface MapEntry {
        key: string;
        val: any;
    }
    class RefMap extends RefObject {
        vtable: VTable;
        data: MapEntry[];
        findIdx(key: string): number;
        destroy(): void;
        print(): void;
        toAny(): any;
    }
    function dumpLivePointers(): void;
    namespace numops {
        function toString(v: any): any;
        function toBoolDecr(v: any): boolean;
        function toBool(v: any): boolean;
    }
    namespace langsupp {
        function toInt(v: number): number;
        function toFloat(v: number): number;
        function ignore(v: any): any;
    }
    namespace pxtcore {
        function ptrOfLiteral(v: any): any;
        function debugMemLeaks(): void;
        function templateHash(): number;
        function programHash(): number;
        function programName(): string;
        function programSize(): number;
        function afterProgramPage(): number;
        function getConfig(key: number, defl: number): number;
        function toInt(n: number): number;
        function toUInt(n: number): number;
        function toDouble(n: number): number;
        function toFloat(n: number): number;
        function fromInt(n: number): number;
        function fromUInt(n: number): number;
        function fromDouble(n: number): number;
        function fromFloat(n: number): number;
        function fromBool(n: any): boolean;
    }
    namespace pxtrt {
        function toInt8(v: number): number;
        function toInt16(v: number): number;
        function toInt32(v: number): number;
        function toUInt32(v: number): number;
        function toUInt8(v: number): number;
        function toUInt16(v: number): number;
        function nullFix(v: any): any;
        function nullCheck(v: any): void;
        function panic(code: number): void;
        function stringToBool(s: string): 0 | 1;
        function ptrToBool(v: any): 0 | 1;
        function emptyToNull(s: string): any;
        function ldlocRef(r: RefRefLocal): any;
        function stlocRef(r: RefRefLocal, v: any): void;
        function mklocRef(): RefRefLocal;
        function stclo(a: RefAction, idx: number, v: any): RefAction;
        function runtimeWarning(msg: string): void;
        function mkMap(): RefMap;
        let mapKeyNames: string[];
        function mapGet(map: RefMap, key: number): any;
        function mapSet(map: RefMap, key: number, val: any): void;
        function mapGetByString(map: RefMap, key: string): any;
        function mapDeleteByString(map: RefMap, key: string): boolean;
        const mapSetGeneric: typeof mapSetByString;
        const mapGetGeneric: typeof mapGetByString;
        function mapSetByString(map: RefMap, key: string, val: any): void;
        function keysOf(v: RefMap): RefCollection;
        let getGlobalsPtr: any;
        let lookupMapKey: any;
    }
    namespace pxtcore {
        function mkClassInstance(vtable: VTable): RefRecord;
        function switch_eq(a: any, b: any): boolean;
        let getNumGlobals: any;
        let RefRecord_destroy: any;
        let RefRecord_print: any;
        let anyPrint: any;
        let dumpDmesg: any;
        let getVTable: any;
        let valType: any;
        let lookupPin: any;
        let deleteRefObject: any;
        let popThreadContext: any;
        let pushThreadContext: any;
        let failedCast: any;
        let missingProperty: any;
        let string_vt: any;
        let buffer_vt: any;
        let number_vt: any;
        let RefAction_vtable: any;
        let RefRecord_scan: any;
        let RefRecord_gcsize: any;
        let startPerfCounter: any;
        let stopPerfCounter: any;
        let string_inline_ascii_vt: any;
        let string_inline_utf8_vt: any;
        let string_cons_vt: any;
        let string_skiplist16_vt: any;
        function typeOf(obj: any): "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function";
    }
    let __aeabi_dadd: any;
    let __aeabi_dcmplt: any;
    let __aeabi_dcmpgt: any;
    let __aeabi_dsub: any;
    let __aeabi_ddiv: any;
    let __aeabi_dmul: any;
    namespace thread {
        let panic: typeof pxtrt.panic;
        function pause(ms: number): void;
        function runInBackground(a: RefAction): void;
        function forever(a: RefAction): void;
    }
}
declare namespace pxsim {
    class RefCollection extends RefObject {
        private data;
        constructor();
        toArray(): any[];
        toAny(): any[];
        toDebugString(): string;
        destroy(): void;
        isValidIndex(x: number): boolean;
        push(x: any): void;
        pop(): any;
        getLength(): number;
        setLength(x: number): void;
        getAt(x: number): any;
        setAt(x: number, y: any): void;
        insertAt(x: number, y: number): void;
        removeAt(x: number): any;
        indexOf(x: number, start: number): number;
        print(): void;
    }
    namespace Array_ {
        function mk(): RefCollection;
        function isArray(c: any): boolean;
        function length(c: RefCollection): number;
        function setLength(c: RefCollection, x: number): void;
        function push(c: RefCollection, x: any): void;
        function pop(c: RefCollection, x: any): any;
        function getAt(c: RefCollection, x: number): any;
        function removeAt(c: RefCollection, x: number): any;
        function insertAt(c: RefCollection, x: number, y: number): void;
        function setAt(c: RefCollection, x: number, y: any): void;
        function indexOf(c: RefCollection, x: any, start: number): number;
        function removeElement(c: RefCollection, x: any): 0 | 1;
    }
    namespace Math_ {
        const imul: (x: number, y: number) => number;
        function idiv(x: number, y: number): number;
        function round(n: number): number;
        function roundWithPrecision(x: number, digits: number): number;
        function ceil(n: number): number;
        function floor(n: number): number;
        function sqrt(n: number): number;
        function pow(x: number, y: number): number;
        function clz32(n: number): number;
        function log(n: number): number;
        function log10(n: number): number;
        function log2(n: number): number;
        function exp(n: number): number;
        function sin(n: number): number;
        function sinh(n: number): number;
        function cos(n: number): number;
        function cosh(n: number): number;
        function tan(n: number): number;
        function tanh(n: number): number;
        function asin(n: number): number;
        function asinh(n: number): number;
        function acos(n: number): number;
        function acosh(n: number): number;
        function atan(n: number): number;
        function atanh(x: number): number;
        function atan2(y: number, x: number): number;
        function trunc(x: number): number;
        function random(): number;
        function randomRange(min: number, max: number): number;
    }
    namespace Number_ {
        function lt(x: number, y: number): boolean;
        function le(x: number, y: number): boolean;
        function neq(x: number, y: number): boolean;
        function eq(x: number, y: number): boolean;
        function eqDecr(x: number, y: number): boolean;
        function gt(x: number, y: number): boolean;
        function ge(x: number, y: number): boolean;
        function div(x: number, y: number): number;
        function mod(x: number, y: number): number;
        function bnot(x: number): number;
        function toString(x: number): string;
    }
    namespace thumb {
        function adds(x: number, y: number): number;
        function subs(x: number, y: number): number;
        function divs(x: number, y: number): number;
        function muls(x: number, y: number): number;
        function ands(x: number, y: number): number;
        function orrs(x: number, y: number): number;
        function eors(x: number, y: number): number;
        function lsls(x: number, y: number): number;
        function lsrs(x: number, y: number): number;
        function asrs(x: number, y: number): number;
        function bnot(x: number): number;
        function ignore(v: any): any;
    }
    namespace avr {
        function adds(x: number, y: number): number;
        function subs(x: number, y: number): number;
        function divs(x: number, y: number): number;
        function muls(x: number, y: number): number;
        function ands(x: number, y: number): number;
        function orrs(x: number, y: number): number;
        function eors(x: number, y: number): number;
        function lsls(x: number, y: number): number;
        function lsrs(x: number, y: number): number;
        function asrs(x: number, y: number): number;
        function bnot(x: number): number;
        function ignore(v: any): any;
    }
    namespace String_ {
        function stringConv(v: any): void;
        function mkEmpty(): string;
        function fromCharCode(code: number): string;
        function toNumber(s: string): number;
        function concat(a: string, b: string): string;
        function substring(s: string, i: number, j: number): string;
        function equals(s1: string, s2: string): boolean;
        function compare(s1: string, s2: string): 0 | 1 | -1;
        function compareDecr(s1: string, s2: string): 0 | 1 | -1;
        function length(s: string): number;
        function substr(s: string, start: number, length?: number): string;
        function charAt(s: string, i: number): string;
        function charCodeAt(s: string, i: number): number;
        function indexOf(s: string, searchValue: string, start?: number): number;
        function lastIndexOf(s: string, searchValue: string, start?: number): number;
        function includes(s: string, searchValue: string, start?: number): boolean;
    }
    namespace Boolean_ {
        function toString(v: boolean): "true" | "false";
        function bang(v: boolean): boolean;
    }
    class RefBuffer extends RefObject {
        data: Uint8Array;
        constructor(data: Uint8Array);
        print(): void;
    }
    namespace BufferMethods {
        enum NumberFormat {
            Int8LE = 1,
            UInt8LE = 2,
            Int16LE = 3,
            UInt16LE = 4,
            Int32LE = 5,
            Int8BE = 6,
            UInt8BE = 7,
            Int16BE = 8,
            UInt16BE = 9,
            Int32BE = 10,
            UInt32LE = 11,
            UInt32BE = 12,
            Float32LE = 13,
            Float64LE = 14,
            Float32BE = 15,
            Float64BE = 16,
        }
        function getNumber(buf: RefBuffer, fmt: NumberFormat, offset: number): number;
        function setNumber(buf: RefBuffer, fmt: NumberFormat, offset: number, r: number): void;
        function createBuffer(size: number): RefBuffer;
        function createBufferFromHex(hex: string): RefBuffer;
        function getBytes(buf: RefBuffer): Uint8Array;
        function getUint8(buf: RefBuffer, off: number): number;
        function getByte(buf: RefBuffer, off: number): number;
        function setUint8(buf: RefBuffer, off: number, v: number): void;
        function setByte(buf: RefBuffer, off: number, v: number): void;
        function length(buf: RefBuffer): number;
        function fill(buf: RefBuffer, value: number, offset?: number, length?: number): void;
        function slice(buf: RefBuffer, offset: number, length: number): RefBuffer;
        function toHex(buf: RefBuffer): string;
        function toString(buf: RefBuffer): string;
        function shift(buf: RefBuffer, offset: number, start: number, len: number): void;
        function rotate(buf: RefBuffer, offset: number, start: number, len: number): void;
        function write(buf: RefBuffer, dstOffset: number, src: RefBuffer, srcOffset?: number, length?: number): void;
    }
}
declare namespace pxsim.control {
    function createBufferFromUTF8(str: string): RefBuffer;
}
declare namespace pxsim.localization {
    function setLocalizedStrings(strs: Map<string>): void;
    function lf(s: string): string;
}
declare namespace pxsim {
    namespace U {
        function containsClass(el: SVGElement | HTMLElement, classes: string): boolean;
        function addClass(el: SVGElement | HTMLElement, classes: string): void;
        function removeClass(el: SVGElement | HTMLElement, classes: string): void;
        function remove(element: Element): void;
        function removeChildren(element: Element): void;
        function clear(element: Element): void;
        function assert(cond: boolean, msg?: string): void;
        function repeatMap<T>(n: number, fn: (index: number) => T): T[];
        function userError(msg: string): Error;
        function now(): number;
        function perfNowUs(): number;
        function nextTick(f: () => void): void;
        function stringToUint8Array(input: string): Uint8Array;
        function uint8ArrayToString(input: ArrayLike<number>): string;
        function fromUTF8(binstr: string): string;
        function toUTF8(str: string, cesu8?: boolean): string;
    }
    interface Map<T> {
        [index: string]: T;
    }
    type LabelFn = (s: StackFrame) => StackFrame;
    type ResumeFn = (v?: any) => void;
    interface StackFrame {
        fn: LabelFn;
        pc: number;
        overwrittenPC?: boolean;
        depth: number;
        r0?: any;
        parent: StackFrame;
        retval?: any;
        lambdaArgs?: any[];
        caps?: any[];
        lastBrkId?: number;
        tryFrame?: TryFrame;
        thrownValue?: any;
        hasThrownValue?: boolean;
    }
    interface TryFrame {
        parent?: TryFrame;
        handlerPC: number;
        handlerFrame: StackFrame;
    }
    class BreakLoopException {
    }
    namespace pxtcore {
        function beginTry(lbl: number): void;
        function endTry(): void;
        function throwValue(v: any): void;
        function getThrownValue(): any;
        function endFinally(): void;
    }
    let runtime: Runtime;
    function getResume(): ResumeFn;
    type MessageListener = (msg: SimulatorMessage) => void;
    class BaseBoard {
        id: string;
        bus: pxsim.EventBus;
        runOptions: SimulatorRunMessage;
        messageListeners: MessageListener[];
        constructor();
        updateView(): void;
        receiveMessage(msg: SimulatorMessage): void;
        private dispatchMessage(msg);
        addMessageListener(listener: MessageListener): void;
        readonly storedState: Map<any>;
        initAsync(msg: SimulatorRunMessage): Promise<void>;
        setStoredState(k: string, value: any): void;
        onDebuggerResume(): void;
        screenshotAsync(width?: number): Promise<ImageData>;
        kill(): void;
        protected serialOutBuffer: string;
        private messages;
        private serialTimeout;
        private lastSerialTime;
        writeSerial(s: string): void;
        private debouncedPostAll;
    }
    class CoreBoard extends BaseBoard {
        updateSubscribers: (() => void)[];
        builtinParts: Map<any>;
        builtinVisuals: Map<() => visuals.IBoardPart<any>>;
        builtinPartVisuals: Map<(xy: visuals.Coord) => visuals.SVGElAndSize>;
        constructor();
        kill(): void;
    }
    function initBareRuntime(): void;
    type EventValueToActionArgs = (value: EventIDType) => any[];
    type EventIDType = number | string;
    class EventQueue {
        runtime: Runtime;
        private valueToArgs;
        max: number;
        events: EventIDType[];
        private awaiters;
        private lock;
        private _handlers;
        private _addRemoveLog;
        constructor(runtime: Runtime, valueToArgs?: EventValueToActionArgs);
        push(e: EventIDType, notifyOne: boolean): Promise<void>;
        private poke();
        readonly handlers: RefAction[];
        setHandler(a: RefAction): void;
        addHandler(a: RefAction): void;
        removeHandler(a: RefAction): void;
        addAwaiter(awaiter: (v?: any) => void): void;
    }
    let initCurrentRuntime: (msg: SimulatorRunMessage) => void;
    let handleCustomMessage: (message: pxsim.SimulatorCustomMessage) => void;
    function syntheticRefAction(f: (s: StackFrame) => any): RefAction;
    class TimeoutScheduled {
        id: number;
        fn: Function;
        totalRuntime: number;
        timestampCall: number;
        constructor(id: number, fn: Function, totalRuntime: number, timestampCall: number);
    }
    class PausedTimeout {
        fn: Function;
        timeRemaining: number;
        constructor(fn: Function, timeRemaining: number);
    }
    function mkVTable(src: VTable): VTable;
    function mkMapVTable(): VTable;
    class Runtime {
        board: BaseBoard;
        numGlobals: number;
        errorHandler: (e: any) => void;
        postError: (e: any) => void;
        stateChanged: () => void;
        dead: boolean;
        running: boolean;
        idleTimer: number;
        recording: boolean;
        recordingTimer: number;
        recordingLastImageData: ImageData;
        recordingWidth: number;
        startTime: number;
        startTimeUs: number;
        pausedTime: number;
        lastPauseTimestamp: number;
        id: string;
        globals: any;
        currFrame: StackFrame;
        entry: LabelFn;
        loopLock: Object;
        loopLockWaitList: (() => void)[];
        timeoutsScheduled: TimeoutScheduled[];
        timeoutsPausedOnBreakpoint: PausedTimeout[];
        pausedOnBreakpoint: boolean;
        perfCounters: PerfCounter[];
        perfOffset: number;
        perfElapsed: number;
        perfStack: number;
        refCountingDebug: boolean;
        private refObjId;
        overwriteResume: (retPC: number) => void;
        getResume: () => ResumeFn;
        run: (cb: ResumeFn) => void;
        setupTop: (cb: ResumeFn) => StackFrame;
        handleDebuggerMsg: (msg: DebuggerMessage) => void;
        registerLiveObject(object: RefObject): number;
        runningTime(): number;
        runningTimeUs(): number;
        runFiberAsync(a: RefAction, arg0?: any, arg1?: any, arg2?: any): Promise<any>;
        currTryFrame(): TryFrame;
        static messagePosted: (data: SimulatorMessage) => void;
        static postMessage(data: SimulatorMessage): void;
        static postScreenshotAsync(opts?: SimulatorScreenshotMessage): Promise<void>;
        static requestToggleRecording(): void;
        restart(): void;
        kill(): void;
        updateDisplay(): void;
        startRecording(width?: number): void;
        stopRecording(): void;
        postFrame(): void;
        private numDisplayUpdates;
        queueDisplayUpdate(): void;
        maybeUpdateDisplay(): void;
        setRunning(r: boolean): void;
        dumpLivePointers(): void;
        constructor(msg: SimulatorRunMessage);
        setupPerfCounters(names: string[]): void;
        private perfStartRuntime();
        private perfStopRuntime();
        perfNow(): number;
        startPerfCounter(n: number): void;
        stopPerfCounter(n: number): void;
        startIdle(): void;
        stopIdle(): void;
        schedule(fn: Function, timeout: number): number;
        pauseScheduled(): void;
        resumeAllPausedScheduled(): void;
        cleanScheduledExpired(): void;
    }
    class PerfCounter {
        name: string;
        start: number;
        numstops: number;
        value: number;
        lastFew: Uint32Array;
        lastFewPtr: number;
        constructor(name: string);
    }
}
declare namespace pxsim {
    interface SimulatorDriverOptions {
        restart?: () => void;
        revealElement?: (el: HTMLElement) => void;
        removeElement?: (el: HTMLElement, onComplete?: () => void) => void;
        unhideElement?: (el: HTMLElement) => void;
        onDebuggerWarning?: (wrn: DebuggerWarningMessage) => void;
        onDebuggerBreakpoint?: (brk: DebuggerBreakpointMessage) => void;
        onTraceMessage?: (msg: TraceMessage) => void;
        onDebuggerResume?: () => void;
        onStateChanged?: (state: SimulatorState) => void;
        onSimulatorCommand?: (msg: pxsim.SimulatorCommandMessage) => void;
        onTopLevelCodeEnd?: () => void;
        simUrl?: string;
        stoppedClass?: string;
        invalidatedClass?: string;
    }
    enum SimulatorState {
        Unloaded = 0,
        Stopped = 1,
        Pending = 2,
        Starting = 3,
        Running = 4,
        Paused = 5,
        Suspended = 6,
    }
    enum SimulatorDebuggerCommand {
        StepInto = 0,
        StepOver = 1,
        StepOut = 2,
        Resume = 3,
        Pause = 4,
    }
    interface SimulatorRunOptions {
        debug?: boolean;
        boardDefinition?: pxsim.BoardDefinition;
        parts?: string[];
        fnArgs?: any;
        aspectRatio?: number;
        partDefinitions?: pxsim.Map<PartDefinition>;
        mute?: boolean;
        highContrast?: boolean;
        light?: boolean;
        cdnUrl?: string;
        localizedStrings?: pxsim.Map<string>;
        refCountingDebug?: boolean;
        version?: string;
        clickTrigger?: boolean;
        breakOnStart?: boolean;
        storedState?: Map<any>;
        autoRun?: boolean;
    }
    interface HwDebugger {
        postMessage: (msg: pxsim.SimulatorMessage) => void;
    }
    class SimulatorDriver {
        container: HTMLElement;
        options: SimulatorDriverOptions;
        private themes;
        private runId;
        private nextFrameId;
        private frameCounter;
        private _currentRuntime;
        private listener;
        private traceInterval;
        private breakpointsSet;
        private _runOptions;
        state: SimulatorState;
        hwdbg: HwDebugger;
        private loanedSimulator;
        constructor(container: HTMLElement, options?: SimulatorDriverOptions);
        isDebug(): boolean;
        hasParts(): boolean;
        setDirty(): void;
        setPending(): void;
        focus(): void;
        private setStarting();
        setHwDebugger(hw: HwDebugger): void;
        handleHwDebuggerMsg(msg: pxsim.SimulatorMessage): void;
        setThemes(themes: string[]): void;
        startRecording(width?: number): void;
        stopRecording(): void;
        private setFrameState(frame);
        private setState(state);
        private freeze(value);
        private simFrames(skipLoaned?);
        postMessage(msg: pxsim.SimulatorMessage, source?: Window): void;
        private createFrame(light?);
        preload(aspectRatio: number): void;
        stop(unload?: boolean, starting?: boolean): void;
        suspend(): void;
        private unload();
        mute(mute: boolean): void;
        stopSound(): void;
        isLoanedSimulator(el: HTMLElement): boolean;
        loanSimulator(): HTMLDivElement;
        unloanSimulator(): void;
        private loanedIFrame();
        private frameCleanupTimeout;
        private cancelFrameCleanup();
        private scheduleFrameCleanup();
        private applyAspectRatio(ratio?);
        private applyAspectRatioToFrame(frame, ratio?);
        private cleanupFrames();
        hide(completeHandler?: () => void): void;
        unhide(): void;
        run(js: string, opts?: SimulatorRunOptions): void;
        restart(): void;
        areBreakpointsSet(): boolean;
        private start();
        private startFrame(frame);
        private handleMessage(msg, source?);
        private addEventListeners();
        private removeEventListeners();
        resume(c: SimulatorDebuggerCommand): void;
        setBreakpoints(breakPoints: number[]): void;
        setTraceInterval(intervalMs: number): void;
        variablesAsync(id: number, fields?: string[]): Promise<VariablesMessage>;
        private handleSimulatorCommand(msg);
        private debuggerSeq;
        private debuggerResolvers;
        private clearDebugger();
        private handleDebuggerMessage(msg);
        private postDebuggerMessageAsync(subtype, data?);
        private postDebuggerMessage(subtype, data?, seq?);
        private nextId();
        private readonly stoppedClass;
        private readonly invalidatedClass;
    }
}
declare namespace pxsim {
    type BoardPin = string;
    interface BBLoc {
        type: "breadboard";
        row: string;
        col: string;
        xOffset?: number;
        yOffset?: number;
        style?: PinStyle;
    }
    interface BoardLoc {
        type: "dalboard";
        pin: BoardPin;
    }
    type Loc = BBLoc | BoardLoc;
    function mkRange(a: number, b: number): number[];
    class EventBus {
        private runtime;
        private valueToArgs;
        private queues;
        private notifyID;
        private notifyOneID;
        private schedulerID;
        private idleEventID;
        private lastEventValue;
        private lastEventTimestampUs;
        private backgroundHandlerFlag;
        nextNotifyEvent: number;
        constructor(runtime: Runtime, valueToArgs?: EventValueToActionArgs);
        setBackgroundHandlerFlag(): void;
        setNotify(notifyID: number, notifyOneID: number): void;
        setIdle(schedulerID: number, idleEventID: number): void;
        private start(id, evid, background, create?);
        listen(id: EventIDType, evid: EventIDType, handler: RefAction): void;
        removeBackgroundHandler(handler: RefAction): void;
        private getQueues(id, evid, bg);
        queue(id: EventIDType, evid: EventIDType, value?: EventIDType): void;
        queueIdle(): void;
        wait(id: number | string, evid: number | string, cb: (value?: any) => void): void;
        getLastEventValue(): string | number;
        getLastEventTime(): number;
    }
    interface AnimationOptions {
        interval: number;
        frame: () => boolean;
        whenDone?: (cancelled: boolean) => void;
        setTimeoutHandle?: number;
    }
    class AnimationQueue {
        private runtime;
        private queue;
        private process;
        constructor(runtime: Runtime);
        cancelAll(): void;
        cancelCurrent(): void;
        enqueue(anim: AnimationOptions): void;
        executeAsync(anim: AnimationOptions): Promise<boolean>;
    }
    namespace AudioContextManager {
        function mute(mute: boolean): void;
        function stopAll(): void;
        function stop(): void;
        function frequency(): number;
        function muteAllChannels(): void;
        function queuePlayInstructions(when: number, b: RefBuffer): void;
        function playInstructionsAsync(b: RefBuffer): Promise<void>;
        function tone(frequency: number, gain: number): void;
        function playBufferAsync(buf: RefBuffer): Promise<void>;
        function sendMidiMessage(buf: RefBuffer): void;
    }
    interface IPointerEvents {
        up: string;
        down: string[];
        move: string;
        enter: string;
        leave: string;
    }
    function isTouchEnabled(): boolean;
    function hasPointerEvents(): boolean;
    const pointerEvents: IPointerEvents;
}
declare namespace pxsim.visuals {
    interface IBoardPart<T> {
        style: string;
        element: SVGElement;
        overElement?: SVGElement;
        defs: SVGElement[];
        init(bus: EventBus, state: T, svgEl: SVGSVGElement, otherParams: Map<string>): void;
        moveToCoord(xy: visuals.Coord): void;
        updateState(): void;
        updateTheme(): void;
    }
    function translateEl(el: SVGElement, xy: [number, number]): void;
    interface ComposeOpts {
        el1: SVGAndSize<SVGSVGElement>;
        scaleUnit1: number;
        el2: SVGAndSize<SVGSVGElement>;
        scaleUnit2: number;
        margin: [number, number, number, number];
        middleMargin: number;
        maxWidth?: string;
        maxHeight?: string;
    }
    interface ComposeResult {
        host: SVGSVGElement;
        scaleUnit: number;
        under: SVGGElement;
        over: SVGGElement;
        edges: number[];
        toHostCoord1: (xy: Coord) => Coord;
        toHostCoord2: (xy: Coord) => Coord;
    }
    function composeSVG(opts: ComposeOpts): ComposeResult;
    function mkScaleFn(originUnit: number, targetUnit: number): (n: number) => number;
    interface MkImageOpts {
        image: string;
        width: number;
        height: number;
        imageUnitDist: number;
        targetUnitDist: number;
    }
    function mkImageSVG(opts: MkImageOpts): SVGAndSize<SVGImageElement>;
    type Coord = [number, number];
    function findDistSqrd(a: Coord, b: Coord): number;
    function findClosestCoordIdx(a: Coord, bs: Coord[]): number;
    function mkTxt(cx: number, cy: number, size: number, rot: number, txt: string, txtXOffFactor?: number, txtYOffFactor?: number): SVGTextElement;
    type WireColor = "black" | "white" | "gray" | "purple" | "blue" | "green" | "yellow" | "orange" | "red" | "brown" | "pink";
    const GPIO_WIRE_COLORS: string[];
    const WIRE_COLOR_MAP: Map<string>;
    function mapWireColor(clr: WireColor | string): string;
    interface SVGAndSize<T extends SVGElement> {
        el: T;
        y: number;
        x: number;
        w: number;
        h: number;
    }
    type SVGElAndSize = SVGAndSize<SVGElement>;
    const PIN_DIST = 15;
    interface BoardView {
        getView(): SVGAndSize<SVGSVGElement>;
        getCoord(pinNm: string): Coord;
        getPinDist(): number;
        highlightPin(pinNm: string): void;
    }
    function rgbToHsl(rgb: [number, number, number]): [number, number, number];
}
declare namespace pxsim.svg {
    function parseString(xml: string): SVGSVGElement;
    function toDataUri(xml: string): string;
    function cursorPoint(pt: SVGPoint, svg: SVGSVGElement, evt: MouseEvent): SVGPoint;
    function rotateElement(el: SVGElement, originX: number, originY: number, degrees: number): void;
    function hydrate(el: SVGElement, props: any): void;
    function elt(name: string, props?: any): SVGElement;
    function child(parent: Element, name: string, props?: any): SVGElement;
    function mkPath(cls: string, data: string, title?: string): SVGPathElement;
    function path(parent: Element, cls: string, data: string, title?: string): SVGPathElement;
    function fill(el: SVGElement, c: string): void;
    function filter(el: SVGElement, c: string): void;
    function fills(els: SVGElement[], c: string): void;
    function isTouchEnabled(): boolean;
    function onClick(el: Element, click: (ev: MouseEvent) => void): void;
    function buttonEvents(el: Element, move?: (ev: MouseEvent) => void, start?: (ev: MouseEvent) => void, stop?: (ev: MouseEvent) => void, keydown?: (ev: KeyboardEvent) => void): void;
    function mkLinearGradient(id: string, horizontal?: boolean): SVGLinearGradientElement;
    function linearGradient(defs: SVGDefsElement, id: string, horizontal?: boolean): SVGLinearGradientElement;
    function setGradientColors(lg: SVGLinearGradientElement, start: string, end: string): void;
    function setGradientValue(lg: SVGLinearGradientElement, percent: string): void;
    function animate(el: SVGElement, cls: string): void;
    function mkTitle(txt: string): SVGTitleElement;
    function title(el: SVGElement, txt: string): SVGTitleElement;
    function toHtmlColor(c: number): string;
}
declare namespace pxsim {
    class Button {
        id: number;
        constructor(id: number);
        pressed: boolean;
        virtual: boolean;
    }
    interface ButtonPairProps {
        ID_BUTTON_A: number;
        ID_BUTTON_B: number;
        ID_BUTTON_AB: number;
        BUTTON_EVT_UP: number;
        BUTTON_EVT_CLICK: number;
    }
    class ButtonPairState {
        props: ButtonPairProps;
        usesButtonAB: boolean;
        aBtn: Button;
        bBtn: Button;
        abBtn: Button;
        constructor(props: ButtonPairProps);
    }
}
declare namespace pxsim {
    class CompassState {
        usesHeading: boolean;
        heading: number;
    }
}
declare namespace pxsim {
    class FileSystemState {
        files: Map<string>;
        append(file: string, content: string): void;
        remove(file: string): void;
    }
}
declare namespace pxsim {
    class LightSensorState {
        usesLightLevel: boolean;
        lightLevel: number;
    }
}
declare namespace pxsim {
    enum NeoPixelMode {
        RGB = 0,
        RGBW = 1,
    }
    type RGBW = [number, number, number, number];
    class NeoPixelState {
        private buffers;
        private colors;
        private dirty;
        updateBuffer(buffer: Uint8Array, pin: number): void;
        getColors(pin: number, mode: NeoPixelMode): RGBW[];
        private readNeoPixelBuffer(inBuffer, outColors, mode);
    }
}
declare namespace pxsim.visuals {
    interface BoardViewOptions {
        visual: string | BoardImageDefinition;
        boardDef: BoardDefinition;
        wireframe?: boolean;
        highContrast?: boolean;
        light?: boolean;
    }
    interface BoardHostOpts {
        state: CoreBoard;
        boardDef: BoardDefinition;
        partsList: string[];
        partDefs: Map<PartDefinition>;
        fnArgs: any;
        forceBreadboardLayout?: boolean;
        forceBreadboardRender?: boolean;
        maxWidth?: string;
        maxHeight?: string;
        wireframe?: boolean;
        highContrast?: boolean;
        light?: boolean;
    }
    let mkBoardView: (opts: BoardViewOptions) => BoardView;
    class BoardHost {
        private opts;
        private parts;
        private wireFactory;
        private breadboard;
        private fromBBCoord;
        private fromMBCoord;
        private boardView;
        private view;
        private partGroup;
        private partOverGroup;
        private style;
        private defs;
        private state;
        constructor(view: BoardView, opts: BoardHostOpts);
        highlightBoardPin(pinNm: string): void;
        highlightBreadboardPin(rowCol: BBLoc): void;
        highlightWire(wire: Wire): void;
        getView(): SVGElement;
        screenshotAsync(width?: number): Promise<ImageData>;
        private updateState();
        private getBBCoord(rowCol);
        private getPinCoord(pin);
        getLocCoord(loc: Loc): Coord;
        getPinStyle(loc: Loc): PinStyle;
        addPart(partInst: PartInst): IBoardPart<any>;
        addWire(inst: WireInst): Wire;
        addAll(allocRes: AllocatorResult): void;
    }
}
declare namespace pxsim.visuals {
    const BREADBOARD_MID_ROWS = 10;
    const BREADBOARD_MID_COLS = 30;
    function getColumnName(colIdx: number): string;
    function getRowName(rowIdx: number): string;
    interface GridPin {
        el: SVGElement;
        hoverEl: SVGElement;
        cx: number;
        cy: number;
        row: string;
        col: string;
        group?: string;
    }
    interface GridOptions {
        xOffset?: number;
        yOffset?: number;
        rowCount: number;
        colCount: number;
        rowStartIdx?: number;
        colStartIdx?: number;
        pinDist: number;
        mkPin: () => SVGElAndSize;
        mkHoverPin: () => SVGElAndSize;
        getRowName: (rowIdx: number) => string;
        getColName: (colIdx: number) => string;
        getGroupName?: (rowIdx: number, colIdx: number) => string;
        rowIdxsWithGap?: number[];
        colIdxsWithGap?: number[];
    }
    interface GridResult {
        g: SVGGElement;
        allPins: GridPin[];
    }
    function mkGrid(opts: GridOptions): GridResult;
    interface GridLabel {
        el: SVGTextElement;
        hoverEl: SVGTextElement;
        txt: string;
        group?: string;
    }
    interface BreadboardOpts {
        wireframe?: boolean;
    }
    class Breadboard {
        bb: SVGSVGElement;
        private styleEl;
        private defs;
        private allPins;
        private allLabels;
        private allPowerBars;
        private rowColToPin;
        private rowColToLbls;
        constructor(opts: BreadboardOpts);
        hide(): void;
        updateLocation(x: number, y: number): void;
        getPin(row: string, col: string): GridPin;
        getCoord(rowCol: BBLoc): Coord;
        getPinDist(): number;
        private buildDom();
        getSVGAndSize(): SVGAndSize<SVGSVGElement>;
        highlightLoc(rowCol: BBLoc): void;
    }
}
declare namespace pxsim.visuals {
    const BOARD_SYTLE: string;
    interface GenericBoardProps {
        visualDef: BoardImageDefinition;
        boardDef: BoardDefinition;
        wireframe?: boolean;
    }
    class GenericBoardSvg implements BoardView {
        props: GenericBoardProps;
        private element;
        private style;
        private defs;
        private g;
        private background;
        private width;
        private height;
        private id;
        private allPins;
        private allLabels;
        private pinNmToLbl;
        private pinNmToPin;
        constructor(props: GenericBoardProps);
        private findPin(pinNm);
        private findPinLabel(pinNm);
        getCoord(pinNm: string): Coord;
        private mkGrayCover(x, y, w, h);
        getView(): SVGAndSize<SVGSVGElement>;
        getPinDist(): number;
        highlightPin(pinNm: string): void;
    }
}
declare namespace pxsim.visuals {
    function mkGenericPartSVG(partVisual: PartVisualDefinition): SVGAndSize<SVGImageElement>;
    class GenericPart implements IBoardPart<any> {
        style: string;
        element: SVGElement;
        defs: SVGElement[];
        constructor(partVisual: PartVisualDefinition);
        moveToCoord(xy: Coord): void;
        init(bus: EventBus, state: any, svgEl: SVGSVGElement): void;
        updateState(): void;
        updateTheme(): void;
    }
}
declare namespace pxsim.visuals {
    const WIRES_CSS: string;
    interface Wire {
        endG: SVGGElement;
        end1: SVGElement;
        end2: SVGElement;
        wires: SVGElement[];
    }
    enum WireEndStyle {
        BBJumper = 0,
        OpenJumper = 1,
        Croc = 2,
    }
    interface WireOpts {
        color?: string;
        colorClass?: string;
        bendFactor?: number;
    }
    function mkWirePart(cp: [number, number], clr: string, croc?: boolean): visuals.SVGAndSize<SVGGElement>;
    class WireFactory {
        private underboard;
        private overboard;
        private boardEdges;
        private getLocCoord;
        private getPinStyle;
        styleEl: SVGStyleElement;
        constructor(underboard: SVGGElement, overboard: SVGGElement, boardEdges: number[], styleEl: SVGStyleElement, getLocCoord: (loc: Loc) => Coord, getPinStyle: (loc: Loc) => PinStyle);
        private indexOfMin(vs);
        private closestEdgeIdx(p);
        private closestEdge(p);
        private nextWireId;
        private drawWire(pin1, pin2, color);
        private drawWireWithCrocs(pin1, pin2, color, smallPin?);
        checkWire(start: Loc, end: Loc): boolean;
        addWire(start: Loc, end: Loc, color: string): Wire;
    }
}
