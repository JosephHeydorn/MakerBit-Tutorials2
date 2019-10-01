/// <reference path="pxtlib.d.ts" />
/// <reference path="pxteditor.d.ts" />
/// <reference path="pxtcompiler.d.ts" />
/// <reference path="pxtblocks.d.ts" />
/// <reference path="pxtsim.d.ts" />
declare namespace pxt.runner {
    /**
     * Starts the simulator and injects it into the provided container.
     * the simulator will attempt to establish a websocket connection
     * to the debugger's user interface on port 3234.
     *
     * @param container The container to inject the simulator into
     */
    function startDebuggerAsync(container: HTMLElement): void;
    /**
     * Runner for the debugger that handles communication with the user
     * interface. Also talks to the server for anything to do with
     * the filesystem (like reading code)
     */
    class DebugRunner implements pxsim.protocol.DebugSessionHost {
        private container;
        private static RETRY_MS;
        private session;
        private ws;
        private pkgLoaded;
        private dataListener;
        private errorListener;
        private closeListener;
        private intervalId;
        private intervalRunning;
        constructor(container: HTMLElement);
        start(): void;
        private initializeWebsocket();
        send(msg: string): void;
        onData(cb: (msg: DebugProtocol.ProtocolMessage) => void): void;
        onError(cb: (e?: any) => void): void;
        onClose(cb: () => void): void;
        close(): void;
        private handleRunnerMessage(msg);
        private runCode(msg);
        private sendRunnerMessage(subtype, msg?);
    }
}
declare namespace pxt.runner {
    interface ClientRenderOptions {
        snippetClass?: string;
        signatureClass?: string;
        blocksClass?: string;
        blocksXmlClass?: string;
        diffBlocksXmlClass?: string;
        staticPythonClass?: string;
        projectClass?: string;
        blocksAspectRatio?: number;
        simulatorClass?: string;
        linksClass?: string;
        namespacesClass?: string;
        codeCardClass?: string;
        tutorial?: boolean;
        snippetReplaceParent?: boolean;
        simulator?: boolean;
        hex?: boolean;
        hexName?: string;
        pxtUrl?: string;
        packageClass?: string;
        package?: string;
        showEdit?: boolean;
        showJavaScript?: boolean;
        split?: boolean;
    }
    interface WidgetOptions {
        showEdit?: boolean;
        showJs?: boolean;
        showPy?: boolean;
        hideGutter?: boolean;
        run?: boolean;
        hexname?: string;
        hex?: string;
    }
    function renderAsync(options?: ClientRenderOptions): Promise<void>;
}
declare namespace pxt.runner {
    interface SimulateOptions {
        id?: string;
        code?: string;
        highContrast?: boolean;
        light?: boolean;
        fullScreen?: boolean;
        dependencies?: string[];
    }
    let mainPkg: pxt.MainPackage;
    function initFooter(footer: HTMLElement, shareId?: string): void;
    function showError(msg: string): void;
    function generateHexFileAsync(options: SimulateOptions): Promise<string>;
    function generateVMFileAsync(options: SimulateOptions): Promise<any>;
    function simulateAsync(container: HTMLElement, simOptions: SimulateOptions): Promise<void>;
    enum LanguageMode {
        Blocks = 0,
        TypeScript = 1,
    }
    let editorLanguageMode: LanguageMode;
    let editorLocale: string;
    function setEditorContextAsync(mode: LanguageMode, locale: string): Promise<void>;
    function startRenderServer(): void;
    function startDocsServer(loading: HTMLElement, content: HTMLElement, backButton?: HTMLElement): void;
    function renderProjectAsync(content: HTMLElement, projectid: string): Promise<void>;
    function renderProjectFilesAsync(content: HTMLElement, files: Map<string>, projectid?: string, escapeLinks?: boolean): Promise<void>;
    interface RenderMarkdownOptions {
        path?: string;
        tutorial?: boolean;
        blocksAspectRatio?: number;
        print?: boolean;
    }
    function renderMarkdownAsync(content: HTMLElement, md: string, options?: RenderMarkdownOptions): Promise<void>;
    interface DecompileResult {
        package: pxt.MainPackage;
        compileProgram?: ts.Program;
        compileJS?: pxtc.CompileResult;
        compileBlocks?: pxtc.CompileResult;
        compilePython?: pxtc.CompileResult;
        apiInfo?: pxtc.ApisInfo;
        blocksSvg?: Element;
    }
    function decompileToBlocksAsync(code: string, options?: blocks.BlocksRenderOptions): Promise<DecompileResult>;
    function compileBlocksAsync(code: string, options?: blocks.BlocksRenderOptions): Promise<DecompileResult>;
    let initCallbacks: (() => void)[];
    function init(): void;
}
