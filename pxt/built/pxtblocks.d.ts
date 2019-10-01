/// <reference path="../localtypings/pxtblockly.d.ts" />
/// <reference path="pxtlib.d.ts" />
/// <reference path="../localtypings/blockly.d.ts" />
/// <reference path="pxtsim.d.ts" />
declare let iface: pxt.worker.Iface;
declare namespace pxt.blocks {
    function workerOpAsync(op: string, arg: pxtc.service.OpArg): Promise<any>;
    class Point {
        link: Point;
        type: string;
        parentType: Point;
        childType: Point;
        constructor(link: Point, type: string, parentType?: Point, childType?: Point);
    }
    interface Scope {
        parent?: Scope;
        firstStatement: Blockly.Block;
        declaredVars: Map<VarInfo>;
        referencedVars: number[];
        assignedVars: number[];
        children: Scope[];
    }
    enum BlockDeclarationType {
        None = 0,
        Argument = 1,
        Assigned = 2,
        Implicit = 3,
    }
    interface BlockDiagnostic {
        blockId: string;
        message: string;
    }
    interface VarInfo {
        name: string;
        id: number;
        escapedName?: string;
        type?: Point;
        alreadyDeclared?: BlockDeclarationType;
        firstReference?: Blockly.Block;
        isAssigned?: boolean;
    }
    function compileExpression(e: Environment, b: Blockly.Block, comments: string[]): JsNode;
    interface Environment {
        workspace: Blockly.Workspace;
        stdCallTable: pxt.Map<StdFunc>;
        errors: Blockly.Block[];
        renames: RenameMap;
        stats: pxt.Map<number>;
        enums: pxtc.EnumInfo[];
        kinds: pxtc.KindInfo[];
        idToScope: pxt.Map<Scope>;
        blockDeclarations: pxt.Map<VarInfo[]>;
        blocksInfo: pxtc.BlocksInfo;
        allVariables: VarInfo[];
    }
    interface RenameMap {
        oldToNew: Map<string>;
        takenNames: Map<boolean>;
        oldToNewFunctions: Map<string>;
    }
    function escapeVarName(name: string, e: Environment, isFunction?: boolean): string;
    interface StdFunc {
        f: string;
        comp: BlockCompileInfo;
        attrs: ts.pxtc.CommentAttrs;
        isExtensionMethod?: boolean;
        isExpression?: boolean;
        imageLiteral?: number;
        hasHandler?: boolean;
        property?: boolean;
        namespace?: string;
        isIdentity?: boolean;
    }
    function mkEnv(w: Blockly.Workspace, blockInfo?: pxtc.BlocksInfo): Environment;
    function compileBlockAsync(b: Blockly.Block, blockInfo: pxtc.BlocksInfo): Promise<BlockCompilationResult>;
    function callKey(e: Environment, b: Blockly.Block): string;
    interface BlockCompilationResult {
        source: string;
        sourceMap: SourceInterval[];
        stats: pxt.Map<number>;
        diagnostics: BlockDiagnostic[];
    }
    function findBlockId(sourceMap: SourceInterval[], loc: {
        start: number;
        length: number;
    }): string;
    function compileAsync(b: Blockly.Workspace, blockInfo: pxtc.BlocksInfo): Promise<BlockCompilationResult>;
}
declare namespace pxt.blocks {
    function initFieldEditors(): void;
    function registerFieldEditor(selector: string, field: Blockly.FieldCustomConstructor, validator?: any): void;
    function createFieldEditor(selector: string, text: string, params: any): Blockly.FieldCustom;
}
declare namespace pxt.blocks {
    interface DiffOptions {
        hideDeletedTopBlocks?: boolean;
        renderOptions?: BlocksRenderOptions;
    }
    interface DiffResult {
        ws?: Blockly.WorkspaceSvg;
        message?: string;
        error?: any;
        svg?: Element;
        deleted: number;
        added: number;
        modified: number;
    }
    function diffXml(oldXml: string, newXml: string, options?: DiffOptions): DiffResult;
}
declare namespace pxt.blocks {
    /**
     * Converts a DOM into workspace without triggering any Blockly event. Returns the new block ids
     * @param dom
     * @param workspace
     */
    function domToWorkspaceNoEvents(dom: Element, workspace: Blockly.Workspace): string[];
    function clearWithoutEvents(workspace: Blockly.Workspace): void;
    function saveWorkspaceXml(ws: Blockly.Workspace, keepIds?: boolean): string;
    function getDirectChildren(parent: Element, tag: string): Element[];
    function getBlocksWithType(parent: Document | Element, type: string): Element[];
    function getChildrenWithAttr(parent: Document | Element, tag: string, attr: string, value: string): Element[];
    function getFirstChildWithAttr(parent: Document | Element, tag: string, attr: string, value: string): Element;
    /**
     * Loads the xml into a off-screen workspace (not suitable for size computations)
     */
    function loadWorkspaceXml(xml: string, skipReport?: boolean): Blockly.WorkspaceSvg;
    /**
     * This callback is populated from the editor extension result.
     * Allows a target to provide version specific blockly updates
     */
    let extensionBlocklyPatch: (pkgTargetVersion: string, dom: Element) => void;
    function importXml(pkgTargetVersion: string, xml: string, info: pxtc.BlocksInfo, skipReport?: boolean): string;
}
declare namespace pxt.blocks.layout {
    interface FlowOptions {
        ratio?: number;
        useViewWidth?: boolean;
    }
    function patchBlocksFromOldWorkspace(blockInfo: ts.pxtc.BlocksInfo, oldWs: Blockly.Workspace, newXml: string): string;
    /**
     * Splits a blockly SVG AFTER a vertical layout. This function relies on the ordering
     * of blocks / comments to get as getTopBlock(true)/getTopComment(true)
     */
    function splitSvg(svg: SVGSVGElement, ws: Blockly.WorkspaceSvg, emPixels?: number): Element;
    function verticalAlign(ws: Blockly.WorkspaceSvg, emPixels: number): void;
    function flow(ws: Blockly.WorkspaceSvg, opts?: FlowOptions): void;
    function screenshotEnabled(): boolean;
    function screenshotAsync(ws: Blockly.Workspace): Promise<string>;
    function toPngAsync(ws: Blockly.Workspace): Promise<string>;
    function toSvgAsync(ws: Blockly.Workspace): Promise<{
        width: number;
        height: number;
        xml: string;
    }>;
    function serializeNode(sg: Node): string;
    function serializeSvgString(xmlString: string): string;
    interface BlockSvg {
        width: number;
        height: number;
        svg: string;
        xml: string;
        css: string;
    }
    function cleanUpBlocklySvg(svg: SVGElement): SVGElement;
    function blocklyToSvgAsync(sg: SVGElement, x: number, y: number, width: number, height: number): Promise<BlockSvg>;
    function documentToSvg(xsg: Node): string;
}
declare namespace pxt.blocks {
    const optionalDummyInputPrefix = "0_optional_dummy";
    const optionalInputWithFieldPrefix = "0_optional_field";
    function isArrayType(type: string): string;
    function isTupleType(type: string): string[];
    function builtinBlocks(): Map<{
        block: Blockly.BlockDefinition;
        symbol?: pxtc.SymbolInfo;
    }>;
    const buildinBlockStatements: Map<boolean>;
    function blockSymbol(type: string): pxtc.SymbolInfo;
    function createShadowValue(info: pxtc.BlocksInfo, p: pxt.blocks.BlockParameter, shadowId?: string, defaultV?: string): Element;
    function createFlyoutHeadingLabel(name: string, color?: string, icon?: string, iconClass?: string): HTMLElement;
    function createFlyoutGroupLabel(name: string, icon?: string, labelLineWidth?: string, helpCallback?: string): HTMLElement;
    function createFlyoutButton(callbackkey: string, label: string): Element;
    function createToolboxBlock(info: pxtc.BlocksInfo, fn: pxtc.SymbolInfo, comp: pxt.blocks.BlockCompileInfo): HTMLElement;
    function injectBlocks(blockInfo: pxtc.BlocksInfo): pxtc.SymbolInfo[];
    function hasArrowFunction(fn: pxtc.SymbolInfo): boolean;
    function cleanBlocks(): void;
    /**
     * Used by pxtrunner to initialize blocks in the docs
     */
    function initializeAndInject(blockInfo: pxtc.BlocksInfo): void;
    /**
     * Used by main app to initialize blockly blocks.
     * Blocks are injected separately by called injectBlocks
     */
    function initialize(blockInfo: pxtc.BlocksInfo): void;
    function installHelpResources(id: string, name: string, tooltip: any, url: string, colour: string, colourSecondary?: string, colourTertiary?: string): void;
    let openHelpUrl: (url: string) => void;
    let onShowContextMenu: (workspace: Blockly.Workspace, items: Blockly.ContextMenu.MenuItem[]) => void;
    /**
     * <block type="pxt_wait_until">
     *     <value name="PREDICATE">
     *          <shadow type="logic_boolean">
     *              <field name="BOOL">TRUE</field>
     *          </shadow>
     *     </value>
     * </block>
     */
    function mkPredicateBlock(type: string): HTMLElement;
    function mkFieldBlock(type: string, fieldName: string, fieldValue: string, isShadow: boolean): HTMLElement;
    function getFixedInstanceDropdownValues(apis: pxtc.ApisInfo, qName: string): pxtc.SymbolInfo[];
    function generateIcons(instanceSymbols: pxtc.SymbolInfo[]): void;
    /**
     * Blockly variable fields can't be set directly; you either have to use the
     * variable ID or set the value of the model and not the field
     */
    function setVarFieldValue(block: Blockly.Block, fieldName: string, newName: string): void;
}
declare namespace pxt.blocks {
    /**
     * This interface defines the optionally defined functions for mutations that Blockly
     * will call if they exist.
     */
    interface MutatingBlock extends Blockly.Block {
        mutation: Mutation;
        mutationToDom(): Element;
        domToMutation(xmlElement: Element): void;
        compose(topBlock: Blockly.Block): void;
        decompose(workspace: Blockly.Workspace): Blockly.Block;
    }
    /**
     * Represents a mutation of a block
     */
    interface Mutation {
        /**
         * Get the unique identifier for this type of mutation
         */
        getMutationType(): string;
        /**
         * Compile the mutation of the block into a node representation
         */
        compileMutation(e: Environment, comments: string[]): JsNode;
        /**
         * Get a mapping of variables that were declared by this mutation and their types.
         */
        getDeclaredVariables(): pxt.Map<string>;
        /**
         * Returns true if a variable with the given name was declared in the mutation's compiled node
         */
        isDeclaredByMutation(varName: string): boolean;
    }
    namespace MutatorTypes {
        const ObjectDestructuringMutator = "objectdestructuring";
        const RestParameterMutator = "restparameter";
        const DefaultInstanceMutator = "defaultinstance";
    }
    function addMutation(b: MutatingBlock, info: pxtc.SymbolInfo, mutationType: string): void;
    function mutateToolboxBlock(block: Node, mutationType: string, mutation: string): void;
}
declare namespace pxt.blocks {
    enum BlockLayout {
        Align = 1,
        Clean = 3,
        Flow = 4,
    }
    interface BlocksRenderOptions {
        emPixels?: number;
        layout?: BlockLayout;
        clean?: boolean;
        aspectRatio?: number;
        packageId?: string;
        package?: string;
        snippetMode?: boolean;
        useViewWidth?: boolean;
        splitSvg?: boolean;
        forceCompilation?: boolean;
    }
    function initRenderingWorkspace(): Blockly.WorkspaceSvg;
    function cleanRenderingWorkspace(): void;
    function renderWorkspace(options?: BlocksRenderOptions): Element;
    function render(blocksXml: string, options?: BlocksRenderOptions): Element;
    function blocksMetrics(ws: Blockly.WorkspaceSvg): {
        width: number;
        height: number;
    };
}
declare namespace pxt.blocks {
    function findRootBlocks(xmlDOM: Element, type?: string): Element[];
    function findRootBlock(xmlDOM: Element, type?: string): Element;
}
declare namespace pxt.docs.codeCard {
    interface CodeCardRenderOptions {
        hideHeader?: boolean;
        shortName?: boolean;
    }
    function render(card: pxt.CodeCard, options?: CodeCardRenderOptions): HTMLElement;
}
declare namespace Blockly.Xml {
    function domToBlock(xml: Element, workspace: Blockly.Workspace): Blockly.Block;
}
declare namespace pxt.blocks {
    interface ComposableMutation {
        mutationToDom(mutationElement: Element): Element;
        domToMutation(savedElement: Element): void;
    }
    function appendMutation(block: Blockly.Block, mutation: ComposableMutation): void;
    function initVariableArgsBlock(b: Blockly.Block, handlerArgs: pxt.blocks.HandlerArg[]): void;
    function initExpandableBlock(info: pxtc.BlocksInfo, b: Blockly.Block, def: pxtc.ParsedBlockDef, comp: BlockCompileInfo, toggle: boolean, addInputs: () => void): void;
}
declare namespace Blockly {
    interface Block {
        moveInputBefore(nameToMove: string, refName: string): void;
        getInput(inputName: string): Blockly.Input;
    }
}
declare namespace pxt.blocks {
    function initMathOpBlock(): void;
}
declare namespace pxt.blocks {
    function initMathRoundBlock(): void;
}
declare namespace pxtblockly {
    class FieldBreakpoint extends Blockly.FieldNumber implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private params;
        private state_;
        private checkElement_;
        private toggleThumb_;
        CURSOR: string;
        private type_;
        constructor(state: string, params: Blockly.FieldCustomOptions, opt_validator?: Function);
        init(): void;
        updateSize_(): void;
        /**
         * Return 'TRUE' if the toggle is ON, 'FALSE' otherwise.
         * @return {string} Current state.
         */
        getValue(): string;
        /**
         * Set the checkbox to be checked if newBool is 'TRUE' or true,
         * unchecks otherwise.
         * @param {string|boolean} newBool New state.
         */
        setValue(newBool: string): void;
        switchToggle(newState: boolean): void;
        updateTextNode_(): void;
        render_(): void;
        /**
         * Toggle the state of the toggle.
         * @private
         */
        showEditor_(): void;
        private toVal(newState);
        private fromVal(val);
    }
}
declare namespace pxtblockly {
    class FieldColorWheel extends Blockly.FieldSlider implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private params;
        private channel_;
        /**
         * Class for a color wheel field.
         * @param {number|string} value The initial content of the field.
         * @param {Function=} opt_validator An optional function that is called
         *     to validate any constraints on what the user entered.  Takes the new
         *     text as an argument and returns either the accepted text, a replacement
         *     text, or null to abort the change.
         * @extends {Blockly.FieldNumber}
         * @constructor
         */
        constructor(value_: any, params: any, opt_validator?: Function);
        /**
         * Set the gradient CSS properties for the given node and channel
         * @param {Node} node - The DOM node the gradient will be set on.
         * @private
         */
        setBackground_(node: Element): void;
        setReadout_(readout: Element, value: string): void;
        createColourStops_(): string[];
        colorWheel(wheelPos: number, channel?: string): string;
        hsvFast(hue: number, sat: number, val: number): string;
        private hex(red, green, blue);
        private componentToHex(c);
    }
}
declare namespace pxtblockly {
    /**
     * The value modes:
     *     hex - Outputs an HTML color string: "#ffffff" (with quotes)
     *     rgb - Outputs an RGB number in hex: 0xffffff
     *     index - Outputs the index of the color in the list of colors: 0
     */
    type FieldColourValueMode = "hex" | "rgb" | "index";
    interface FieldColourNumberOptions extends Blockly.FieldCustomOptions {
        colours?: string;
        columns?: string;
        className?: string;
        valueMode?: FieldColourValueMode;
    }
    class FieldColorNumber extends Blockly.FieldColour implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        protected colour_: string;
        private valueMode_;
        constructor(text: string, params: FieldColourNumberOptions, opt_validator?: Function);
        /**
         * Return the current colour.
         * @param {boolean} opt_asHex optional field if the returned value should be a hex
         * @return {string} Current colour in '#rrggbb' format.
         */
        getValue(opt_asHex?: boolean): any;
        /**
         * Set the colour.
         * @param {string} colour The new colour in '#rrggbb' format.
         */
        setValue(colour: string): void;
        showEditor_(): void;
        getColours_(): string[];
    }
}
declare namespace pxtblockly {
    interface FieldGridPickerToolTipConfig {
        yOffset?: number;
        xOffset?: number;
    }
    interface FieldGridPickerOptions extends Blockly.FieldCustomDropdownOptions {
        columns?: string;
        maxRows?: string;
        width?: string;
        tooltips?: string;
        tooltipsXOffset?: string;
        tooltipsYOffset?: string;
        hasSearchBar?: boolean;
        hideRect?: boolean;
    }
    class FieldGridPicker extends Blockly.FieldDropdown implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private width_;
        private columns_;
        private maxRows_;
        protected backgroundColour_: string;
        protected borderColour_: string;
        private tooltipConfig_;
        private gridTooltip_;
        private firstItem_;
        private hasSearchBar_;
        private hideRect_;
        private observer;
        private selectedItemDom;
        private closeModal_;
        private selectedBar_;
        private selectedImg_;
        private selectedBarText_;
        private selectedBarValue_;
        private static DEFAULT_IMG;
        constructor(text: string, options: FieldGridPickerOptions, validator?: Function);
        /**
         * When disposing the grid picker, make sure the tooltips are disposed too.
         * @public
         */
        dispose(): void;
        private createTooltip_();
        /**
         * Create blocklyGridPickerRows and add them to table container
         * @param options
         * @param tableContainer
         */
        private populateTableContainer(options, tableContainer, scrollContainer);
        /**
         * Populate a single row and add it to table container
         * @param row
         * @param options
         * @param tableContainer
         */
        private populateRow(row, options, tableContainer);
        /**
         * Callback for when a button is clicked inside the drop-down.
         * Should be bound to the FieldIconMenu.
         * @param {Event} e DOM event for the click/touch
         * @private
         */
        protected buttonClick_: (e: any) => void;
        protected buttonClickAndClose_: (e: any) => void;
        /**
         * Whether or not to show a box around the dropdown menu.
         * @return {boolean} True if we should show a box (rect) around the dropdown menu. Otherwise false.
         * @private
         */
        shouldShowRect_(): boolean;
        /**
         * Set the language-neutral value for this dropdown menu.
         * We have to override this from field.js because the grid picker needs to redraw the selected item's image.
         * @param {string} newValue New value to set.
         */
        setValue(newValue: string): void;
        /**
         * Closes the gridpicker.
         */
        private close();
        /**
         * Getter method
         */
        private getFirstItem();
        /**
         * Highlight first item in menu, de-select and de-highlight all others
         */
        private highlightFirstItem(tableContainerDom);
        /**
         * Scroll menu to item that equals current value of gridpicker
         */
        private highlightAndScrollSelected(tableContainerDom, scrollContainerDom);
        /**
         * Create a dropdown menu under the text.
         * @private
         */
        showEditor_(): void;
        private positionMenu_(tableContainer);
        private shouldShowTooltips();
        private getAnchorDimensions_();
        private createWidget_(tableContainer);
        private createSearchBar_(tableContainer, scrollContainer, options);
        private createSelectedBar_();
        private updateSelectedBar_(content, value);
        private setupIntersectionObserver_();
        private disposeIntersectionObserver();
        /**
         * Disposes the tooltip DOM.
         * @private
         */
        private disposeTooltip();
        private onClose_();
        /**
         * Sets the text in this field.  Trigger a rerender of the source block.
         * @param {?string} text New text.
         */
        setText(text: string): void;
        /**
         * Updates the width of the field. This calls getCachedWidth which won't cache
         * the approximated width on IE/Microsoft Edge when `getComputedTextLength` fails. Once
         * it eventually does succeed, the result will be cached.
         **/
        updateSize_(): void;
        /**
         * Update the text node of this field to display the current text.
         * @private
         */
        updateTextNode_(): void;
    }
}
declare namespace pxtblockly {
    interface FieldImageDropdownOptions extends Blockly.FieldCustomDropdownOptions {
        columns?: string;
        maxRows?: string;
        width?: string;
    }
    class FieldImageDropdown extends Blockly.FieldDropdown implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        protected width_: number;
        protected columns_: number;
        protected maxRows_: number;
        protected backgroundColour_: string;
        protected borderColour_: string;
        protected savedPrimary_: string;
        constructor(text: string, options: FieldImageDropdownOptions, validator?: Function);
        /**
         * Create a dropdown menu under the text.
         * @private
         */
        showEditor_(): void;
        /**
         * Callback for when a button is clicked inside the drop-down.
         * Should be bound to the FieldIconMenu.
         * @param {Event} e DOM event for the click/touch
         * @private
         */
        protected buttonClick_: (e: any) => void;
        /**
         * Callback for when the drop-down is hidden.
         */
        protected onHide_(): void;
        /**
         * Sets the text in this field.  Trigger a rerender of the source block.
         * @param {?string} text New text.
         */
        setText(text: string): void;
        /**
         * Updates the width of the field. This calls getCachedWidth which won't cache
         * the approximated width on IE/Microsoft Edge when `getComputedTextLength` fails. Once
         * it eventually does succeed, the result will be cached.
         **/
        updateSize_(): void;
        /**
         * Update the text node of this field to display the current text.
         * @private
         */
        updateTextNode_(): void;
    }
}
declare namespace pxtblockly {
    interface FieldImagesOptions extends pxtblockly.FieldImageDropdownOptions {
        sort?: boolean;
        addLabel?: string;
    }
    class FieldImages extends pxtblockly.FieldImageDropdown implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private shouldSort_;
        protected addLabel_: boolean;
        constructor(text: string, options: FieldImagesOptions, validator?: Function);
        /**
         * Create a dropdown menu under the text.
         * @private
         */
        showEditor_(): void;
        protected createTextNode_(text: string): HTMLSpanElement;
    }
}
declare namespace pxtblockly {
    class FieldKind extends Blockly.FieldDropdown {
        private opts;
        constructor(opts: pxtc.KindInfo);
        init(): void;
        onItemSelected(menu: goog.ui.Menu, menuItem: goog.ui.MenuItem): void;
        private initVariables();
    }
}
declare const rowRegex: RegExp;
declare enum LabelMode {
    None = 0,
    Number = 1,
    Letter = 2,
}
declare namespace pxtblockly {
    class FieldMatrix extends Blockly.Field implements Blockly.FieldCustom {
        private static CELL_WIDTH;
        private static CELL_HORIZONTAL_MARGIN;
        private static CELL_VERTICAL_MARGIN;
        private static CELL_CORNER_RADIUS;
        private static BOTTOM_MARGIN;
        private static Y_AXIS_WIDTH;
        private static X_AXIS_HEIGHT;
        private static TAB;
        isFieldCustom_: boolean;
        private params;
        private onColor;
        private offColor;
        private static DEFAULT_OFF_COLOR;
        private matrixWidth;
        private matrixHeight;
        private yAxisLabel;
        private xAxisLabel;
        private cellState;
        private cells;
        private elt;
        private currentDragState_;
        constructor(text: string, params: any, validator?: Function);
        /**
         * Show the inline free-text editor on top of the text.
         * @private
         */
        showEditor_(): void;
        private initMatrix();
        private getLabel(index, mode);
        private dontHandleMouseEvent_;
        private clearLedDragHandler;
        private createCell(x, y);
        private toggleRect;
        private handleRootMouseMoveListener;
        private getColor(x, y);
        private getOpacity(x, y);
        private updateCell(x, y);
        setValue(newValue: string | number, restoreState?: boolean): void;
        render_(): void;
        getValue(): string;
        private restoreStateFromString();
        private updateValue();
        private getYAxisWidth();
        private getXAxisHeight();
    }
}
declare namespace pxtblockly {
    const HEADER_HEIGHT = 50;
    const TOTAL_WIDTH = 300;
    class FieldCustomMelody<U extends Blockly.FieldCustomOptions> extends Blockly.Field implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        SERIALIZABLE: boolean;
        protected params: U;
        private melody;
        private soundingKeys;
        private numRow;
        private numCol;
        private tempo;
        private stringRep;
        private isPlaying;
        private timeouts;
        private invalidString;
        private prevString;
        private topDiv;
        private editorDiv;
        private gridDiv;
        private bottomDiv;
        private doneButton;
        private playButton;
        private playIcon;
        private tempoInput;
        private static CELL_WIDTH;
        private static CELL_HORIZONTAL_MARGIN;
        private static CELL_VERTICAL_MARGIN;
        private static CELL_CORNER_RADIUS;
        private elt;
        private cells;
        private static VIEWBOX_WIDTH;
        private static VIEWBOX_HEIGHT;
        private static COLOR_BLOCK_WIDTH;
        private static COLOR_BLOCK_HEIGHT;
        private static COLOR_BLOCK_X;
        private static COLOR_BLOCK_Y;
        private static COLOR_BLOCK_SPACING;
        private static MUSIC_ICON_WIDTH;
        private toggle;
        private root;
        private gallery;
        constructor(value: string, params: U, validator?: Function);
        init(): void;
        showEditor_(): void;
        getValue(): string;
        doValueUpdate_(newValue: string): void;
        protected onInit(): void;
        render_(): void;
        protected renderEditor(div: HTMLDivElement): void;
        protected onEditorClose(): void;
        private onDone();
        private clearDomReferences();
        protected getTypeScriptValue(): string;
        protected parseTypeScriptValue(value: string): void;
        private isValidNote(note);
        protected getPreviewWidth(): number;
        protected getPreviewHeight(): number;
        protected getDropdownBackgroundColour(): string;
        protected getDropdownBorderColour(): string;
        private updateFieldLabel();
        private setTempo(tempo);
        private syncTempoField(blockToEditor);
        private getDuration();
        private createMelodyIfDoesntExist();
        private onNoteSelect(row, col);
        private updateGrid();
        private playNote(rowNumber, colNumber?);
        protected queueToneForColumn(column: number, delay: number, duration: number): void;
        protected playToneCore(row: number): void;
        private highlightColumn(col, on);
        private createGridDisplay();
        private createCell(x, y);
        private togglePlay();
        private updatePlayButton();
        private playMelody();
        private stopMelody();
        private showGallery();
        private hideGallery();
    }
}
declare namespace pxtblockly {
    interface FieldNoteOptions extends Blockly.FieldCustomOptions {
        editorColour?: string;
        minNote?: string;
        maxNote?: string;
    }
    class FieldNote extends Blockly.FieldNumber implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private note_;
        private colour_;
        private colourBorder_;
        /**
         * default number of piano keys
         * @type {number}
         * @private
         */
        private nKeys_;
        private minNote_;
        private maxNote_;
        /**
         * Absolute error for note frequency identification (Hz)
         * @type {number}
         */
        eps: number;
        /**
         * array of notes frequency
         * @type {Array.<number>}
         * @private
         */
        private noteFreq_;
        /**
         * array of notes names
         * @type {Array.<string>}
         * @private
         */
        private noteName_;
        constructor(text: string, params: FieldNoteOptions, validator?: Function);
        /**
         * Ensure that only a non negative number may be entered.
         * @param {string} text The user's text.
         * @return {?string} A string representing a valid positive number, or null if invalid.
         */
        classValidator(text: string): string;
        /**
         * Install this field on a block.
         */
        init(): void;
        /**
         * Return the current note frequency.
         * @return {string} Current note in string format.
         */
        getValue(): string;
        /**
         * Called by setValue if the text input is valid. Updates the value of the
         * field, and updates the text of the field if it is not currently being
         * edited (i.e. handled by the htmlInput_).
         * @param {string} note The new note in string format.
         */
        doValueUpdate_(note: string): void;
        /**
         * Get the text from this field.  Used when the block is collapsed.
         * @return {string} Current text.
         */
        getText(): string;
        /**
         * Set the text in this field and NOT fire a change event.
         * @param {*} newText New text.
         */
        setText(newText: string): void;
        /**
        * get the note name to be displayed in the field
        * @return {string} note name
        * @private
        */
        private getNoteName_();
        /**
         * Set a custom number of keys for this field.
         * @param {number} nkeys Number of keys for this block,
         *     or 26 to use default.
         * @return {!Blockly.FieldNote} Returns itself (for method chaining).
         */
        setNumberOfKeys(size: number): FieldNote;
        onHtmlInputChange_(e: any): void;
        /**
         * Create a piano under the note field.
         */
        showEditor_(e: Event): void;
        /**
         * Callback for when the drop-down is hidden.
         */
        private onHide();
        /**
         * Close the note picker if this input is being deleted.
         */
        dispose(): void;
        private updateColor();
    }
}
declare namespace pxtblockly {
    interface FieldNumberDropdownOptions extends Blockly.FieldCustomDropdownOptions {
        min?: number;
        max?: number;
        precision?: any;
    }
    class FieldNumberDropdown extends Blockly.FieldNumberDropdown implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private menuGenerator_;
        constructor(value: number | string, options: FieldNumberDropdownOptions, opt_validator?: Function);
        getOptions(): string[][];
    }
}
declare namespace pxtblockly {
    interface FieldPositionOptions extends Blockly.FieldCustomOptions {
        min?: string;
        max?: string;
        screenWidth?: number;
        screenHeight?: number;
        xInputName?: string;
        yInputName?: string;
    }
    class FieldPosition extends Blockly.FieldSlider implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private params;
        private selectorDiv_;
        private static eyedropper_DATAURI;
        private static eyedropperEventKey_;
        constructor(text: string, params: FieldPositionOptions, validator?: Function);
        showEditor_(): void;
        private activeEyedropper_();
        private resizeHandler();
        private setXY(x, y);
        private getFieldByName(name);
        private getXY();
        private getTargetField(input);
        private getSimFrame();
        widgetDispose_(): () => void;
        dispose(): void;
        private close(skipWidget?);
    }
}
declare namespace pxtblockly {
    class FieldProcedure extends Blockly.FieldDropdown {
        constructor(funcname: string, opt_validator?: Function);
        getOptions(): string[][];
        init(): void;
        setSourceBlock(block: Blockly.Block): void;
        getValue(): string;
        doValueUpdate_(newValue: string): void;
        /**
         * Return a sorted list of variable names for procedure dropdown menus.
         * Include a special option at the end for creating a new function name.
         * @return {!Array.<string>} Array of procedure names.
         * @this {pxtblockly.FieldProcedure}
         */
        dropdownCreate(): string[][];
        onItemSelected(menu: any, menuItem: any): void;
    }
}
declare namespace pxtblockly {
    interface FieldProtractorOptions extends Blockly.FieldCustomOptions {
    }
    class FieldProtractor extends Blockly.FieldSlider implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private params;
        private circleSVG;
        private circleBar;
        private reporter;
        /**
         * Class for a color wheel field.
         * @param {number|string} value The initial content of the field.
         * @param {Function=} opt_validator An optional function that is called
         *     to validate any constraints on what the user entered.  Takes the new
         *     text as an argument and returns either the accepted text, a replacement
         *     text, or null to abort the change.
         * @extends {Blockly.FieldNumber}
         * @constructor
         */
        constructor(value_: any, params: FieldProtractorOptions, opt_validator?: Function);
        createLabelDom_(labelText: string): HTMLSpanElement[];
        setReadout_(readout: Element, value: string): void;
        private updateAngle(angle);
    }
}
declare namespace pxtblockly {
    interface FieldSpeedOptions extends Blockly.FieldCustomOptions {
        min?: string;
        max?: string;
        format?: string;
        label?: string;
    }
    class FieldSpeed extends Blockly.FieldSlider implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private params;
        private speedSVG;
        private circleBar;
        private reporter;
        /**
         * Class for a color wheel field.
         * @param {number|string} value The initial content of the field.
         * @param {Function=} opt_validator An optional function that is called
         *     to validate any constraints on what the user entered.  Takes the new
         *     text as an argument and returns either the accepted text, a replacement
         *     text, or null to abort the change.
         * @extends {Blockly.FieldNumber}
         * @constructor
         */
        constructor(value_: any, params: FieldSpeedOptions, opt_validator?: Function);
        createLabelDom_(labelText: string): HTMLSpanElement[];
        setReadout_(readout: Element, value: string): void;
        private updateSpeed(speed);
        private sign(num);
    }
}
declare namespace pxtblockly {
    interface FieldSpriteEditorOptions {
        sizes: string;
        initColor: string;
        initWidth: string;
        initHeight: string;
        filter?: string;
    }
    class FieldSpriteEditor extends Blockly.Field implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        SERIALIZABLE: boolean;
        private params;
        private blocksInfo;
        private editor;
        private state;
        private lightMode;
        private undoStack;
        private redoStack;
        constructor(text: string, params: any, validator?: Function);
        init(): void;
        /**
         * Show the inline free-text editor on top of the text.
         * @private
         */
        showEditor_(): void;
        private isInFlyout();
        render_(): void;
        getValue(): string;
        doValueUpdate_(newValue: string): void;
        private redrawPreview();
        private parseBitmap(newText);
        /**
         * Scales the image to 32x32 and returns a data uri. In light mode the preview
         * is drawn with no transparency (alpha is filled with background color)
         */
        private renderPreview();
    }
}
declare namespace pxtblockly {
    interface StyleOptions extends Blockly.FieldCustomOptions {
        bold: boolean;
        italics: boolean;
    }
    class FieldStyledLabel extends Blockly.FieldLabel implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(value: string, options?: StyleOptions, opt_validator?: Function);
    }
}
declare namespace pxtblockly {
    interface FieldTextDropdownOptions extends Blockly.FieldCustomOptions {
        values: any;
    }
    class FieldTextDropdown extends Blockly.FieldTextDropdown implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(text: string, options: FieldTextDropdownOptions, opt_validator?: Function);
    }
}
declare namespace pxtblockly {
    class FieldTextInput extends Blockly.FieldTextInput implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(value: string, options: Blockly.FieldCustomOptions, opt_validator?: Function);
    }
}
declare namespace pxtblockly {
    class FieldToggle extends Blockly.FieldNumber implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private params;
        private state_;
        private checkElement_;
        private toggleThumb_;
        CURSOR: string;
        private type_;
        constructor(state: string, params: Blockly.FieldCustomOptions, opt_validator?: Function);
        init(): void;
        getDisplayText_(): string;
        getTrueText(): string;
        getFalseText(): string;
        updateSize_(): void;
        getInnerWidth(): number;
        getMaxLength(): number;
        getOutputShape(): any;
        /**
         * Return 'TRUE' if the toggle is ON, 'FALSE' otherwise.
         * @return {string} Current state.
         */
        getValue(): string;
        /**
         * Set the checkbox to be checked if newBool is 'TRUE' or true,
         * unchecks otherwise.
         * @param {string|boolean} newBool New state.
         */
        setValue(newBool: string): void;
        switchToggle(newState: boolean): void;
        updateTextNode_(): void;
        render_(): void;
        /**
         * Toggle the state of the toggle.
         * @private
         */
        showEditor_(): void;
        private toVal(newState);
        private fromVal(val);
    }
}
declare namespace pxtblockly {
    class FieldToggleHighLow extends FieldToggle implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(state: string, params: Blockly.FieldCustomOptions, opt_validator?: Function);
        getTrueText(): string;
        getFalseText(): string;
    }
}
declare namespace pxtblockly {
    class FieldToggleOnOff extends FieldToggle implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(state: string, params: Blockly.FieldCustomOptions, opt_validator?: Function);
        getTrueText(): string;
        getFalseText(): string;
    }
}
declare namespace pxtblockly {
    class FieldToggleUpDown extends FieldToggle implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(state: string, params: Blockly.FieldCustomOptions, opt_validator?: Function);
        getTrueText(): string;
        getFalseText(): string;
    }
    class FieldToggleDownUp extends FieldToggle implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(state: string, params: Blockly.FieldCustomOptions, opt_validator?: Function);
        getTrueText(): string;
        getFalseText(): string;
    }
}
declare namespace pxtblockly {
    class FieldToggleWinLose extends FieldToggle implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(state: string, params: Blockly.FieldCustomOptions, opt_validator?: Function);
        getTrueText(): string;
        getFalseText(): string;
    }
}
declare namespace pxtblockly {
    class FieldToggleYesNo extends FieldToggle implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        constructor(state: string, params: Blockly.FieldCustomOptions, opt_validator?: Function);
        getTrueText(): string;
        getFalseText(): string;
    }
}
declare namespace pxtblockly {
    class FieldTsExpression extends Blockly.FieldTextInput implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        /**
         * Same as parent, but adds a different class to text when disabled
         */
        updateEditable(): void;
    }
}
declare namespace pxtblockly {
    interface FieldTurnRatioOptions extends Blockly.FieldCustomOptions {
    }
    class FieldTurnRatio extends Blockly.FieldSlider implements Blockly.FieldCustom {
        isFieldCustom_: boolean;
        private params;
        private path_;
        private reporter_;
        /**
         * Class for a color wheel field.
         * @param {number|string} value The initial content of the field.
         * @param {Function=} opt_validator An optional function that is called
         *     to validate any constraints on what the user entered.  Takes the new
         *     text as an argument and returns either the accepted text, a replacement
         *     text, or null to abort the change.
         * @extends {Blockly.FieldNumber}
         * @constructor
         */
        constructor(value_: any, params: FieldTurnRatioOptions, opt_validator?: Function);
        static HALF: number;
        static HANDLE_RADIUS: number;
        static RADIUS: number;
        createLabelDom_(labelText: string): HTMLSpanElement[];
        updateGraph_(): void;
        setReadout_(readout: Element, value: string): void;
    }
}
declare namespace pxtblockly {
    class FieldUserEnum extends Blockly.FieldDropdown {
        private opts;
        constructor(opts: pxtc.EnumInfo);
        init(): void;
        onItemSelected(menu: goog.ui.Menu, menuItem: goog.ui.MenuItem): void;
        private initVariables();
    }
    function getNextValue(members: [string, number][], opts: pxtc.EnumInfo): number;
}
declare namespace pxtblockly {
    namespace svg {
        function hasClass(el: SVGElement, cls: string): boolean;
        function addClass(el: SVGElement, cls: string): void;
        function removeClass(el: SVGElement, cls: string): void;
    }
    function parseColour(colour: string | number): string;
}
