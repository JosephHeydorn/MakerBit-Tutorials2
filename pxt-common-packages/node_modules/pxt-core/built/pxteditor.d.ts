/// <reference path="../localtypings/monaco.d.ts" />
/// <reference path="pxtlib.d.ts" />
/// <reference path="pxtblocks.d.ts" />
declare namespace pxt.editor {
    enum SimState {
        Stopped = 0,
        Pending = 1,
        Starting = 2,
        Running = 3,
    }
    interface IEditor {
        undo(): void;
        redo(): void;
        hasUndo(): boolean;
        hasRedo(): boolean;
        zoomIn(): void;
        zoomOut(): void;
        resize(): void;
        setScale(scale: number): void;
    }
    interface IFile {
        name: string;
        virtual?: boolean;
    }
    function isBlocks(f: IFile): boolean;
    interface FileHistoryEntry {
        id: string;
        name: string;
        pos: any;
    }
    interface EditorSettings {
        editorFontSize: number;
        fileHistory: FileHistoryEntry[];
    }
    interface IAppProps {
    }
    interface IAppState {
        active?: boolean;
        header?: pxt.workspace.Header;
        editorState?: EditorState;
        currFile?: IFile;
        fileState?: string;
        showFiles?: boolean;
        sideDocsLoadUrl?: string;
        sideDocsCollapsed?: boolean;
        projectName?: string;
        suppressPackageWarning?: boolean;
        tutorialOptions?: pxt.tutorial.TutorialOptions;
        lightbox?: boolean;
        simState?: SimState;
        autoRun?: boolean;
        resumeOnVisibility?: boolean;
        compiling?: boolean;
        isSaving?: boolean;
        publishing?: boolean;
        hideEditorFloats?: boolean;
        collapseEditorTools?: boolean;
        showBlocks?: boolean;
        showParts?: boolean;
        fullscreen?: boolean;
        mute?: boolean;
        embedSimView?: boolean;
        editorPosition?: {
            lineNumber: number;
            column: number;
            file: IFile;
        };
        tracing?: boolean;
        debugging?: boolean;
        bannerVisible?: boolean;
        pokeUserComponent?: string;
        highContrast?: boolean;
        print?: boolean;
        greenScreen?: boolean;
        home?: boolean;
        hasError?: boolean;
        screenshoting?: boolean;
    }
    interface EditorState {
        filters?: pxt.editor.ProjectFilters;
        searchBar?: boolean;
        hasCategories?: boolean;
    }
    interface ProjectCreationOptions {
        prj?: pxt.ProjectTemplate;
        name?: string;
        documentation?: string;
        filesOverride?: pxt.Map<string>;
        filters?: ProjectFilters;
        temporary?: boolean;
        tutorial?: pxt.tutorial.TutorialOptions;
        dependencies?: pxt.Map<string>;
        tsOnly?: boolean;
        preferredEditor?: string;
    }
    interface ExampleImportOptions {
        name: string;
        path: string;
        loadBlocks?: boolean;
        prj?: ProjectTemplate;
    }
    interface ProjectFilters {
        namespaces?: {
            [index: string]: FilterState;
        };
        blocks?: {
            [index: string]: FilterState;
        };
        fns?: {
            [index: string]: FilterState;
        };
        defaultState?: FilterState;
    }
    enum FilterState {
        Hidden = 0,
        Visible = 1,
        Disabled = 2,
    }
    interface ModalDialogButton {
        label: string;
        url?: string;
    }
    interface ModalDialogOptions {
        header: string;
        body: string;
        buttons?: ModalDialogButton[];
    }
    interface ScreenshotData {
        data?: ImageData;
        delay?: number;
        event?: "start" | "stop";
    }
    interface SimulatorStartOptions {
        clickTrigger?: boolean;
    }
    interface ImportFileOptions {
        extension?: boolean;
        openHomeIfFailed?: boolean;
    }
    interface IProjectView {
        state: IAppState;
        setState(st: IAppState): void;
        forceUpdate(): void;
        reloadEditor(): void;
        openBlocks(): void;
        openJavaScript(giveFocusOnLoading?: boolean): void;
        openPython(giveFocusOnLoading?: boolean): void;
        openSettings(): void;
        openSimView(): void;
        openPreviousEditor(): void;
        switchTypeScript(): void;
        openTypeScriptAsync(): Promise<void>;
        openPythonAsync(): Promise<void>;
        saveBlocksToTypeScriptAsync(): Promise<string>;
        saveFileAsync(): Promise<void>;
        loadHeaderAsync(h: pxt.workspace.Header): Promise<void>;
        reloadHeaderAsync(): Promise<void>;
        importProjectAsync(prj: pxt.workspace.Project, editorState?: pxt.editor.EditorState): Promise<void>;
        importTutorialAsync(markdown: string): Promise<void>;
        overrideTypescriptFile(text: string): void;
        overrideBlocksFile(text: string): void;
        exportAsync(): Promise<string>;
        newEmptyProject(name?: string, documentation?: string): void;
        newProject(options?: ProjectCreationOptions): void;
        createProjectAsync(options: ProjectCreationOptions): Promise<void>;
        importExampleAsync(options: ExampleImportOptions): Promise<void>;
        showScriptManager(): void;
        importProjectDialog(): void;
        removeProject(): void;
        editText(): void;
        getPreferredEditor(): string;
        saveAndCompile(): void;
        updateHeaderName(name: string): void;
        updateHeaderNameAsync(name: string): Promise<void>;
        compile(): void;
        setFile(fn: IFile, line?: number): void;
        setSideFile(fn: IFile, line?: number): void;
        navigateToError(diag: pxtc.KsDiagnostic): void;
        setSideDoc(path: string, blocksEditor?: boolean): void;
        setSideMarkdown(md: string): void;
        removeFile(fn: IFile, skipConfirm?: boolean): void;
        updateFileAsync(name: string, content: string, open?: boolean): Promise<void>;
        openHome(): void;
        setTutorialStep(step: number): void;
        setTutorialInstructionsExpanded(value: boolean): void;
        exitTutorial(): void;
        completeTutorialAsync(): Promise<void>;
        showTutorialHint(): void;
        pokeUserActivity(): void;
        stopPokeUserActivity(): void;
        anonymousPublishAsync(screenshotUri?: string): Promise<string>;
        startStopSimulator(opts?: SimulatorStartOptions): void;
        stopSimulator(unload?: boolean, opts?: SimulatorStartOptions): void;
        restartSimulator(): void;
        startSimulator(opts?: SimulatorStartOptions): void;
        runSimulator(): void;
        isSimulatorRunning(): boolean;
        expandSimulator(): void;
        collapseSimulator(): void;
        toggleSimulatorCollapse(): void;
        toggleSimulatorFullscreen(): void;
        proxySimulatorMessage(content: string): void;
        toggleTrace(intervalSpeed?: number): void;
        setTrace(enabled: boolean, intervalSpeed?: number): void;
        toggleMute(): void;
        setMute(on: boolean): void;
        openInstructions(): void;
        closeFlyout(): void;
        printCode(): void;
        requestScreenshotAsync(): Promise<string>;
        downloadScreenshotAsync(): Promise<void>;
        toggleDebugging(): void;
        dbgPauseResume(): void;
        dbgStepInto(): void;
        dbgStepOver(): void;
        dbgInsertBreakpoint(): void;
        setBannerVisible(b: boolean): void;
        typecheckNow(): void;
        openExtension(extension: string, url: string, consentRequired?: boolean): void;
        handleExtensionRequest(request: ExtensionRequest): void;
        fireResize(): void;
        updateEditorLogo(left: number, rgba?: string): number;
        loadBlocklyAsync(): Promise<void>;
        isBlocksEditor(): boolean;
        isTextEditor(): boolean;
        renderBlocksAsync(req: EditorMessageRenderBlocksRequest): Promise<EditorMessageRenderBlocksResponse>;
        renderPythonAsync(req: EditorMessageRenderPythonRequest): Promise<EditorMessageRenderPythonResponse>;
        toggleHighContrast(): void;
        toggleGreenScreen(): void;
        pair(): void;
        launchFullEditor(): void;
        settings: EditorSettings;
        isEmbedSimActive(): boolean;
        isBlocksActive(): boolean;
        isJavaScriptActive(): boolean;
        isPythonActive(): boolean;
        editor: IEditor;
        startTutorial(tutorialId: string, tutorialTitle?: string, recipe?: boolean): void;
        showLightbox(): void;
        hideLightbox(): void;
        showReportAbuse(): void;
        showLanguagePicker(): void;
        showShareDialog(title?: string): void;
        showAboutDialog(): void;
        showImportUrlDialog(): void;
        showImportFileDialog(options?: ImportFileOptions): void;
        showImportGithubDialog(): void;
        showResetDialog(): void;
        showExitAndSaveDialog(): void;
        showChooseHwDialog(): void;
        showExperimentsDialog(): void;
        showRecipesDialog(): void;
        showPackageDialog(): void;
        showBoardDialogAsync(features?: string[], closeIcon?: boolean): Promise<void>;
        showModalDialogAsync(options: ModalDialogOptions): Promise<void>;
        askForProjectNameAsync(): Promise<string>;
        pushScreenshotHandler(handler: (msg: ScreenshotData) => void): void;
        popScreenshotHandler(): void;
    }
    interface IHexFileImporter {
        id: string;
        canImport(data: pxt.cpp.HexFile): boolean;
        importAsync(project: IProjectView, data: pxt.cpp.HexFile): Promise<void>;
    }
    interface IResourceImporter {
        id: string;
        canImport(data: File): boolean;
        importAsync(project: IProjectView, data: File): Promise<void>;
    }
    interface ISettingsProps {
        parent: IProjectView;
        visible?: boolean;
    }
    interface IFieldCustomOptions {
        selector: string;
        editor: Blockly.FieldCustomConstructor;
        text?: string;
        validator?: any;
    }
    interface ExtensionOptions {
        blocklyToolbox: ToolboxDefinition;
        monacoToolbox: ToolboxDefinition;
        projectView: IProjectView;
    }
    interface IToolboxOptions {
        blocklyToolbox?: ToolboxDefinition;
        monacoToolbox?: ToolboxDefinition;
    }
    interface ExtensionResult {
        hexFileImporters?: IHexFileImporter[];
        resourceImporters?: IResourceImporter[];
        beforeCompile?: () => void;
        patchCompileResultAsync?: (r: pxtc.CompileResult) => Promise<void>;
        deployAsync?: (r: pxtc.CompileResult) => Promise<void>;
        saveOnlyAsync?: (r: ts.pxtc.CompileResult) => Promise<void>;
        saveProjectAsync?: (project: pxt.cpp.HexFile) => Promise<void>;
        showUploadInstructionsAsync?: (fn: string, url: string, confirmAsync: (options: any) => Promise<number>) => Promise<void>;
        toolboxOptions?: IToolboxOptions;
        blocklyPatch?: (pkgTargetVersion: string, dom: Element) => void;
        webUsbPairDialogAsync?: (confirmAsync: (options: any) => Promise<number>) => Promise<number>;
        onTutorialCompleted?: () => void;
    }
    interface FieldExtensionOptions {
    }
    interface FieldExtensionResult {
        fieldEditors?: IFieldCustomOptions[];
    }
    interface ToolboxDefinition {
        loops?: ToolboxCategoryDefinition;
        logic?: ToolboxCategoryDefinition;
        variables?: ToolboxCategoryDefinition;
        maths?: ToolboxCategoryDefinition;
        text?: ToolboxCategoryDefinition;
        arrays?: ToolboxCategoryDefinition;
        functions?: ToolboxCategoryDefinition;
    }
    interface ToolboxCategoryDefinition {
        /**
         * The display name for the category
         */
        name?: string;
        /**
         * The icon of this category
         */
        icon?: string;
        /**
         * The color of this category
         */
        color?: string;
        /**
         * The weight of the category relative to other categories in the toolbox
         */
        weight?: number;
        /**
         * Whether or not the category should be placed in the advanced category
         */
        advanced?: boolean;
        /**
         * Blocks to appear in the category. Specifying this field will override
         * all existing blocks in the category. The ordering of the blocks is
         * determined by the ordering of this array.
         */
        blocks?: ToolboxBlockDefinition[];
        /**
         * Ordering of category groups
         */
        groups?: string[];
    }
    interface ToolboxBlockDefinition {
        /**
         * Internal id used to refer to this block or snippet, must be unique
         */
        name: string;
        /**
         * Group label used to categorize block.  Blocks are arranged with other
         * blocks that share the same group.
         */
        group?: string;
        /**
         * Indicates an advanced API. Advanced APIs appear after basic ones in the
         * toolbox
         */
        advanced?: boolean;
        /**
         * The weight for the block. Blocks are arranged in order of they appear in the category
         * definition's array but the weight can be specified in the case that other APIs are
         * dynamically added to the category (eg. loops.forever())
         */
        weight?: number;
        /**
         * Description of code to appear in the hover text
         */
        jsDoc?: string;
        /**
         * TypeScript snippet of code to insert when dragged into editor
         */
        snippet?: string;
        /**
         * Python snippet of code to insert when dragged into editor
         */
        pySnippet?: string;
        /**
         * TypeScript name used for highlighting the snippet, uses name if not defined
         */
        snippetName?: string;
        /**
         * Python name used for highlighting the snippet, uses name if not defined
         */
        pySnippetName?: string;
        /**
         * Display just the snippet and nothing else. Should be set to true for
         * language constructs (eg. for-loops) and to false for function
         * calls (eg. Math.random())
         */
        snippetOnly?: boolean;
        /**
         * The return type of the block. This is used to determine the shape of the block rendered.
         */
        retType?: string;
        /**
         * The block definition in XML for the blockly toolbox.
         */
        blockXml?: string;
        /**
         * The Blockly block id used to identify this block.
         */
        blockId?: string;
    }
    let initExtensionsAsync: (opts: ExtensionOptions) => Promise<ExtensionResult>;
    let initFieldExtensionsAsync: (opts: FieldExtensionOptions) => Promise<FieldExtensionResult>;
    interface NativeHostMessage {
        name?: string;
        download?: string;
        save?: string;
    }
    let HELP_IMAGE_URI: string;
    function initEditorExtensionsAsync(): Promise<void>;
}
declare namespace pxt.editor {
    interface EditorMessage {
        /**
         * Constant identifier
         */
        type: "pxteditor" | "pxthost" | "pxtpkgext" | "pxtsim";
        /**
         * Original request id
         */
        id?: string;
        /**
         * flag to request response
         */
        response?: boolean;
    }
    interface EditorMessageResponse extends EditorMessage {
        /**
         * Additional response payload provided by the command
         */
        resp?: any;
        /**
         * indicate if operation started or completed successfully
         */
        success: boolean;
        /**
         * Error object if any
         */
        error?: any;
    }
    interface EditorMessageRequest extends EditorMessage {
        /**
         * Request action
         */
        action: "switchblocks" | "switchjavascript" | "startsimulator" | "restartsimulator" | "stopsimulator" | "hidesimulator" | "showsimulator" | "closeflyout" | "newproject" | "importproject" | "importtutorial" | "proxytosim" | "undo" | "redo" | "renderblocks" | "renderpython" | "setscale" | "toggletrace" | "togglehighcontrast" | "togglegreenscreen" | "settracestate" | "print" | "pair" | "workspacesync" | "workspacereset" | "workspacesave" | "workspaceloaded" | "workspaceevent" | "event" | "simevent" | "info" | ExtInitializeType | ExtDataStreamType | ExtQueryPermissionType | ExtRequestPermissionType | ExtUserCodeType | ExtReadCodeType | ExtWriteCodeType;
    }
    /**
     * Request sent by the editor when a tick/error/expection is registered
     */
    interface EditorMessageEventRequest extends EditorMessageRequest {
        action: "event";
        tick: string;
        category?: string;
        message?: string;
        data?: Map<string | number>;
    }
    interface EditorMessageStopRequest extends EditorMessageRequest {
        action: "stopsimulator";
        /**
         * Indicates if simulator iframes should be unloaded or kept hot.
         */
        unload?: boolean;
    }
    interface EditorMessageNewProjectRequest extends EditorMessageRequest {
        action: "newproject";
        /**
         * Additional optional to create new project
         */
        options?: ProjectCreationOptions;
    }
    interface EditorMessageSetScaleRequest extends EditorMessageRequest {
        action: "setscale";
        scale: number;
    }
    interface EditorMessageSimulatorMessageProxyRequest extends EditorMessageRequest {
        action: "proxytosim";
        /**
         * Content to send to the simulator
         */
        content: any;
    }
    interface EditorWorkspaceSyncRequest extends EditorMessageRequest {
        /**
         * Synching projects from host into
         */
        action: "workspacesync" | "workspacereset" | "workspaceloaded";
    }
    interface EditorWorkspaceEvent extends EditorMessageRequest {
        action: "workspaceevent";
        event: pxt.editor.events.Event;
    }
    interface EditorSyncState {
        filters?: pxt.editor.ProjectFilters;
        searchBar?: boolean;
    }
    interface EditorWorkspaceSyncResponse extends EditorMessageResponse {
        projects: pxt.workspace.Project[];
        editor?: EditorSyncState;
        controllerId?: string;
    }
    interface EditorWorkspaceSaveRequest extends EditorMessageRequest {
        action: "workspacesave";
        project: pxt.workspace.Project;
    }
    interface EditorMessageImportProjectRequest extends EditorMessageRequest {
        action: "importproject";
        project: pxt.workspace.Project;
        filters?: pxt.editor.ProjectFilters;
        searchBar?: boolean;
    }
    interface EditorMessageImportTutorialRequest extends EditorMessageRequest {
        action: "importtutorial";
        markdown: string;
    }
    interface EditorMessageRenderBlocksRequest extends EditorMessageRequest {
        action: "renderblocks";
        ts: string;
    }
    interface EditorMessageRenderBlocksResponse {
        svg: SVGSVGElement;
        xml: Promise<any>;
    }
    interface EditorMessageRenderPythonRequest extends EditorMessageRequest {
        action: "renderpython";
        ts: string;
    }
    interface EditorMessageRenderPythonResponse {
        python: string;
    }
    interface EditorSimulatorEvent extends EditorMessageRequest {
        action: "simevent";
        subtype: "toplevelfinished" | "started" | "stopped" | "resumed";
    }
    interface EditorSimulatorStoppedEvent extends EditorSimulatorEvent {
        subtype: "stopped";
        exception?: string;
    }
    interface EditorMessageToggleTraceRequest extends EditorMessageRequest {
        action: "toggletrace";
        intervalSpeed?: number;
    }
    interface EditorMessageSetTraceStateRequest extends EditorMessageRequest {
        action: "settracestate";
        enabled: boolean;
        intervalSpeed?: number;
    }
    interface InfoMessage {
        versions: pxt.TargetVersions;
        locale: string;
        availableLocales?: string[];
    }
    interface PackageExtensionData {
        ts: string;
        json?: any;
    }
    interface EditorPkgExtMessageRequest extends EditorMessageRequest {
        package: string;
    }
    interface EditorPkgExtMessageResponse extends EditorMessageResponse {
        package: string;
    }
    interface EditorSimulatorTickEvent extends EditorMessageEventRequest {
        type: "pxtsim";
    }
    /**
     * Binds incoming window messages to the project view.
     * Requires the "allowParentController" flag in the pxtarget.json/appTheme object.
     *
     * When the project view receives a request (EditorMessageRequest),
     * it starts the command and returns the result upon completion.
     * The response (EditorMessageResponse) contains the request id and result.
     * Some commands may be async, use the ``id`` field to correlate to the original request.
     */
    function bindEditorMessages(getEditorAsync: () => Promise<IProjectView>): void;
    /**
     * Sends analytics messages upstream to container if any
     */
    function enableControllerAnalytics(): void;
    /**
     * Posts a message from the editor to the host
     */
    function postHostMessageAsync(msg: EditorMessageRequest): Promise<EditorMessageResponse>;
}
declare namespace pxt.editor.events {
    type EditorType = 'blocks' | 'ts';
    interface Event {
        type: string;
        editor: EditorType;
    }
    interface CreateEvent extends Event {
        type: "create";
        blockId: string;
    }
    interface UIEvent extends Event {
        type: "ui";
        action: "groupHelpClicked";
        data?: pxt.Map<string>;
    }
}
declare namespace pxt.editor.experiments {
    interface Experiment {
        id: string;
        name: string;
        description: string;
        feedbackUrl: string;
    }
    function syncTheme(): void;
    function all(): Experiment[];
    function clear(): void;
    function someEnabled(): boolean;
    function isEnabled(experiment: Experiment): boolean;
    function toggle(experiment: Experiment): void;
    function state(): string;
    function setState(experiment: Experiment, enabled: boolean): void;
}
declare namespace pxt.editor {
    interface DataStreams<T> {
        console?: T;
    }
    interface Permissions<T> {
        console?: T;
        readUserCode?: T;
    }
    interface ExtensionFiles {
        code?: string;
        json?: string;
        jres?: string;
        asm?: string;
    }
    enum PermissionResponses {
        Granted = 0,
        Denied = 1,
        NotAvailable = 2,
    }
    interface ExtensionMessage extends EditorMessage {
        type: "pxtpkgext";
    }
    interface ExtensionResponse extends EditorMessageResponse {
        type: "pxtpkgext";
        extId: string;
    }
    interface ExtensionRequest extends EditorMessageRequest {
        type: "pxtpkgext";
        extId: string;
        body?: any;
    }
    /**
     * Events are fired by the editor on the extension iFrame. Extensions
     * receive events, they don't send them.
     */
    interface ExtensionEvent extends ExtensionMessage {
        event: string;
        target: string;
    }
    /**
     * Event fired when the extension is loaded.
     */
    interface LoadedEvent extends ExtensionEvent {
        event: "extloaded";
    }
    /**
     * Event fired when the extension becomes visible.
     */
    interface ShownEvent extends ExtensionEvent {
        event: "extshown";
    }
    /**
     * Event fired when the extension becomes hidden.
     */
    interface HiddenEvent extends ExtensionEvent {
        event: "exthidden";
        body: HiddenReason;
    }
    type HiddenReason = "useraction" | "other";
    /**
     * Event fired when console data is received
     */
    interface ConsoleEvent extends ExtensionEvent {
        event: "extconsole";
        body: {
            source: string;
            sim: boolean;
            data: string;
        };
    }
    /**
     * Event fired when extension is first shown. Extension
     * should send init request in response
     */
    type ExtInitializeType = "extinit";
    interface InitializeRequest extends ExtensionRequest {
        action: ExtInitializeType;
        body: string;
    }
    interface InitializeResponse extends ExtensionResponse {
        target?: pxt.AppTarget;
    }
    /**
     * Requests data stream event to be fired. Permission will
     * be requested if not already received.
     */
    type ExtDataStreamType = "extdatastream";
    interface DataStreamRequest extends ExtensionRequest {
        action: ExtDataStreamType;
        body: DataStreams<boolean>;
    }
    interface DataStreamResponse extends ExtensionResponse {
        resp: DataStreams<PermissionResponses>;
    }
    /**
     * Queries the current permissions granted to the extension.
     */
    type ExtQueryPermissionType = "extquerypermission";
    interface QueryPermissionRequest extends ExtensionRequest {
        action: ExtQueryPermissionType;
    }
    interface QueryPermissionResponse extends ExtensionResponse {
        resp: Permissions<PermissionResponses>;
    }
    /**
     * Prompts the user for the specified permission
     */
    type ExtRequestPermissionType = "extrequestpermission";
    interface PermissionRequest extends ExtensionRequest {
        action: ExtRequestPermissionType;
        body: Permissions<boolean>;
    }
    interface PermissionResponse extends ExtensionResponse {
        resp: Permissions<PermissionResponses>;
    }
    /**
     * Request to read the user's code. Will request permission if
     * not already granted
     */
    type ExtUserCodeType = "extusercode";
    interface UserCodeRequest extends ExtensionRequest {
        action: ExtUserCodeType;
    }
    interface UserCodeResponse extends ExtensionResponse {
        resp?: {
            [index: string]: string;
        };
    }
    /**
     * Request to read the files saved by this extension
     */
    type ExtReadCodeType = "extreadcode";
    interface ReadCodeRequest extends ExtensionRequest {
        action: ExtReadCodeType;
    }
    interface ReadCodeResponse extends ExtensionResponse {
        action: ExtReadCodeType;
        body?: ExtensionFiles;
    }
    /**
     * Request to write the JSON and/or TS files saved
     * by this extension
     */
    type ExtWriteCodeType = "extwritecode";
    interface WriteCodeRequest extends ExtensionRequest {
        action: ExtWriteCodeType;
        body?: ExtensionFiles;
    }
    interface WriteCodeResponse extends ExtensionResponse {
    }
}
declare namespace pxt.storage {
    function storageId(): string;
    function setLocal(key: string, value: string): void;
    function getLocal(key: string): string;
    function removeLocal(key: string): void;
    function clearLocal(): void;
}
declare namespace pxt.vs {
    interface BlockDefiniton {
        commentAttr: pxtc.CommentAttrs;
        fns?: Map<string>;
    }
    interface MethodDef {
        sig: string;
        snippet: string;
        comment?: string;
        metaData?: pxtc.CommentAttrs;
        snippetOnly?: boolean;
    }
    interface NameDefiniton {
        fns: {
            [fn: string]: MethodDef;
        };
        vars?: {
            [index: string]: string;
        };
        metaData?: pxtc.CommentAttrs;
        builtin?: boolean;
    }
    type DefinitionMap = {
        [ns: string]: NameDefiniton;
    };
    function syncModels(mainPkg: MainPackage, libs: {
        [path: string]: monaco.IDisposable;
    }, currFile: string, readOnly: boolean): void;
    function initMonacoAsync(element: HTMLElement): Promise<monaco.editor.IStandaloneCodeEditor>;
    function createEditor(element: HTMLElement): monaco.editor.IStandaloneCodeEditor;
}
declare namespace pxt.shell {
    enum EditorLayoutType {
        IDE = 0,
        Sandbox = 1,
        Widget = 2,
        Controller = 3,
    }
    function layoutTypeClass(): string;
    function isSandboxMode(): boolean;
    function isReadOnly(): boolean;
    function isControllerMode(): boolean;
}
declare namespace pxt.workspace {
    type ScriptText = pxt.Map<string>;
    interface Project {
        header?: Header;
        text?: ScriptText;
    }
    interface Asset {
        name: string;
        size: number;
        url: string;
    }
    type Version = any;
    interface File {
        header: Header;
        text: ScriptText;
        version: Version;
    }
    interface WorkspaceProvider {
        listAsync(): Promise<Header[]>;
        getAsync(h: Header): Promise<File>;
        setAsync(h: Header, prevVersion: Version, text?: ScriptText): Promise<Version>;
        deleteAsync?: (h: Header, prevVersion: Version) => Promise<void>;
        resetAsync(): Promise<void>;
        loadedAsync?: () => Promise<void>;
        getSyncState?: () => pxt.editor.EditorSyncState;
        saveScreenshotAsync?: (h: Header, screenshot: string, icon: string) => Promise<void>;
        saveAssetAsync?: (id: string, filename: string, data: Uint8Array) => Promise<void>;
        listAssetsAsync?: (id: string) => Promise<Asset[]>;
        fireEvent?: (ev: pxt.editor.events.Event) => void;
    }
    function freshHeader(name: string, modTime: number): Header;
}
declare namespace pxt.editor {
    interface TextEdit {
        range: monaco.Range;
        replacement: string;
    }
    interface MonacoFieldEditorHost {
        contentDiv(): HTMLDivElement;
        getText(range: monaco.Range): string;
        blocksInfo(): pxtc.BlocksInfo;
    }
    interface MonacoFieldEditor {
        getId(): string;
        showEditorAsync(fileType: FileType, editrange: monaco.Range, host: MonacoFieldEditorHost): Promise<TextEdit>;
        onClosed(): void;
        dispose(): void;
    }
    interface MonacoFieldEditorDefinition {
        id: string;
        matcher: MonacoFindArguments;
        foldMatches?: boolean;
        glyphCssClass?: string;
        proto: {
            new (): MonacoFieldEditor;
        };
        heightInPixels?: number;
    }
    interface MonacoFindArguments {
        searchString: string;
        isRegex: boolean;
        matchWholeWord: boolean;
        matchCase: boolean;
    }
    function registerMonacoFieldEditor(name: string, definition: MonacoFieldEditorDefinition): void;
    function getMonacoFieldEditor(name: string): MonacoFieldEditorDefinition;
}
declare namespace pxt.editor {
    class MonacoSpriteEditor implements MonacoFieldEditor {
        private resolver;
        private rejecter;
        protected editor: pxtsprite.SpriteEditor;
        protected fileType: pxt.editor.FileType;
        protected editrange: monaco.Range;
        getId(): string;
        showEditorAsync(fileType: FileType, editrange: monaco.Range, host: MonacoFieldEditorHost): Promise<TextEdit>;
        onClosed(): void;
        dispose(): void;
    }
    const spriteEditorDefinition: MonacoFieldEditorDefinition;
}
