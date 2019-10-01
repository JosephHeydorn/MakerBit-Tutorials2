/// <reference path="../../node_modules/pxt-core/localtypings/blockly.d.ts" />
/// <reference path="../../node_modules/pxt-core/built/pxtblocks.d.ts" />
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts" />
export interface FieldGesturesOptions extends pxtblockly.FieldImagesOptions {
    columns?: string;
    width?: string;
}
export declare class FieldGestures extends pxtblockly.FieldImages implements Blockly.FieldCustom {
    isFieldCustom_: boolean;
    constructor(text: string, options: FieldGesturesOptions, validator?: Function);
    trimOptions_(): void;
    protected buttonClick_: (e: any) => void;
}
