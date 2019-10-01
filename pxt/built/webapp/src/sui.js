"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var ReactDOM = require("react-dom");
var ReactModal = require("react-modal");
var ReactTooltip = require("react-tooltip");
var data = require("./data");
var core = require("./core");
exports.appElement = document.getElementById('content');
function cx(classes) {
    return classes.filter(function (c) { return !!c && c.trim() != ''; }).join(' ');
}
exports.cx = cx;
function genericClassName(cls, props, ignoreIcon) {
    if (ignoreIcon === void 0) { ignoreIcon = false; }
    return cls + " " + (ignoreIcon ? '' : props.icon && props.text ? 'icon icon-and-text' : props.icon ? 'icon' : "") + " " + (props.className || "");
}
function genericContent(props) {
    var retVal = [
        props.icon ? (React.createElement(exports.Icon, { key: 'iconkey', icon: props.icon + (props.text ? " icon-and-text " : "") + (props.iconClass ? " " + props.iconClass : '') })) : null,
        props.text ? (React.createElement("span", { key: 'textkey', className: 'ui text' + (props.textClass ? ' ' + props.textClass : '') }, props.text)) : null,
    ];
    if (props.icon && props.rightIcon)
        retVal = retVal.reverse();
    return retVal;
}
function fireClickOnEnter(e) {
    var charCode = core.keyCodeFromEvent(e);
    if (charCode === core.ENTER_KEY || charCode === core.SPACE_KEY) {
        e.preventDefault();
        e.currentTarget.click();
    }
}
exports.fireClickOnEnter = fireClickOnEnter;
var UIElement = /** @class */ (function (_super) {
    __extends(UIElement, _super);
    function UIElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UIElement;
}(data.Component));
exports.UIElement = UIElement;
var StatelessUIElement = /** @class */ (function (_super) {
    __extends(StatelessUIElement, _super);
    function StatelessUIElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return StatelessUIElement;
}(data.PureComponent));
exports.StatelessUIElement = StatelessUIElement;
var DropdownMenu = /** @class */ (function (_super) {
    __extends(DropdownMenu, _super);
    function DropdownMenu() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.navigateToNextElement = function (e, prev, next) {
            var dropdown = _this.refs["dropdown"];
            var charCode = core.keyCodeFromEvent(e);
            var current = e.currentTarget;
            if (charCode === 40 /* Down arrow */) {
                e.preventDefault();
                e.stopPropagation();
                if (next) {
                    _this.focus(next);
                }
            }
            else if (charCode === 38 /* Up arrow */) {
                e.preventDefault();
                e.stopPropagation();
                if (prev) {
                    _this.focus(prev);
                }
                else {
                    // Prev is undefined, go to dropdown
                    dropdown.focus();
                    _this.setState({ open: false });
                }
            }
            else if (charCode === core.SPACE_KEY || charCode === core.ENTER_KEY) {
                // Trigger click
                e.preventDefault();
                e.stopPropagation();
                current.click();
            }
        };
        _this.closeOnEscape = function (e) {
            var charCode = core.keyCodeFromEvent(e);
            if (charCode === core.ESC_KEY) {
                e.preventDefault();
                var dropdown = _this.refs["dropdown"];
                dropdown.focus();
                // Reset the focus handlers
                _this.isMouseDown = true;
                _this.hide();
            }
        };
        _this.handleClick = function (e) {
            _this.toggle();
            e.stopPropagation();
        };
        _this.handleClose = function () {
            _this.isMouseDown = false;
            var hasFocus = document.activeElement === _this.refs['dropdown'];
            _this.setState({ focus: hasFocus });
        };
        _this.handleMouseDown = function (e) {
            _this.isMouseDown = true;
            document.addEventListener(pxsim.pointerEvents.up, _this.handleDocumentMouseUp);
        };
        _this.handleDocumentMouseUp = function (e) {
            _this.isMouseDown = false;
            document.removeEventListener(pxsim.pointerEvents.up, _this.handleDocumentMouseUp);
        };
        _this.handleFocus = function (e) {
            var focus = _this.state.focus;
            if (focus)
                return;
            _this.setState({ focus: true });
        };
        _this.handleBlur = function (e) {
            if (_this.isMouseDown)
                return;
            // Use timeout to delay examination of activeElement until after blur/focus 
            // events have been processed.
            setTimeout(function () {
                var open = _this.isChildFocused();
                _this.setState({ focus: open });
            }, 1);
        };
        _this.handleKeyDown = function (e) {
            var charCode = core.keyCodeFromEvent(e);
            if (charCode === 40 /* Down arrow key */) {
                e.preventDefault();
                _this.focusFirst = true;
                _this.show();
            }
            else if (charCode === core.SPACE_KEY || charCode === core.ENTER_KEY) {
                e.preventDefault();
                _this.toggle();
            }
        };
        return _this;
    }
    DropdownMenu.prototype.show = function () {
        this.setState({ open: true, focus: true });
    };
    DropdownMenu.prototype.hide = function () {
        this.setState({ open: false });
    };
    DropdownMenu.prototype.toggle = function () {
        if (this.state.open) {
            this.hide();
        }
        else {
            this.show();
        }
    };
    DropdownMenu.prototype.focus = function (el) {
        this.setActive(el);
        el.focus();
    };
    DropdownMenu.prototype.blur = function (el) {
        if (this.isActive(el)) {
            pxt.BrowserUtils.removeClass(el, "active");
        }
    };
    DropdownMenu.prototype.setActive = function (el) {
        if (!this.isActive(el)) {
            pxt.BrowserUtils.addClass(el, "active");
        }
    };
    DropdownMenu.prototype.isActive = function (el) {
        return el && pxt.BrowserUtils.containsClass(el, "active");
    };
    DropdownMenu.prototype.getChildren = function () {
        var menu = this.refs["menu"];
        var children = [];
        for (var i = 0; i < menu.childNodes.length; i++) {
            var child = menu.childNodes[i];
            // Remove separators
            if (pxt.BrowserUtils.containsClass(child, "divider"))
                continue;
            // Check if item is intended for mobile only views
            if (pxt.BrowserUtils.containsClass(child, "mobile") && !pxt.BrowserUtils.isMobile())
                continue;
            children.push(child);
        }
        return children;
    };
    DropdownMenu.prototype.isChildFocused = function () {
        var children = this.getChildren();
        for (var i = 0; i < children.length; i++) {
            if (document.activeElement === children[i])
                return true;
        }
        return false;
    };
    DropdownMenu.prototype.componentDidMount = function () {
        var _this = this;
        var children = this.getChildren();
        var _loop_1 = function (i) {
            var prev = i > 0 ? children[i - 1] : undefined;
            var child = children[i];
            var next = i < children.length ? children[i + 1] : undefined;
            child.addEventListener('keydown', function (e) {
                _this.navigateToNextElement(e, prev, next);
            });
            child.addEventListener('focus', function (e) {
                _this.setActive(child);
            });
            child.addEventListener('blur', function (e) {
                _this.blur(child);
            });
            if (i == children.length - 1) {
                // set tab on last child to clear focus
                child.addEventListener('keydown', function (e) {
                    var charCode = core.keyCodeFromEvent(e);
                    if (!e.shiftKey && charCode === core.TAB_KEY) {
                        _this.hide();
                    }
                });
            }
        };
        for (var i = 0; i < children.length; i++) {
            _loop_1(i);
        }
    };
    DropdownMenu.prototype.componentDidUpdate = function (prevProps, prevState) {
        // Remove active from all menu items on any update
        var children = this.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            // On allow tabbing to valid child nodes (ie: no separators or mobile only items)
            child.tabIndex = this.state.open ? 0 : -1;
        }
        // Check if dropdown width exceeds the bounds, add the left class to the menu
        if (prevState.open != this.state.open && this.state.open) {
            var dropdown = this.refs["dropdown"];
            var menu = this.refs["menu"];
            if (dropdown.offsetLeft + menu.offsetWidth > window.innerWidth) {
                // Add left class to the menu
                pxt.BrowserUtils.addClass(menu, 'left');
            }
        }
        if (!prevState.focus && this.state.focus) {
            // Dropdown focused
        }
        else if (prevState.focus && !this.state.focus) {
            // Dropdown blurred
            if (!this.isMouseDown) {
                this.hide();
            }
        }
        if (!prevState.open && this.state.open) {
            // Dropdown opened
            document.addEventListener('keydown', this.closeOnEscape);
        }
        else if (prevState.open && !this.state.open) {
            // Dropdown closed
            document.removeEventListener('keydown', this.closeOnEscape);
            this.handleClose();
        }
        if (this.focusFirst && children.length > 0) {
            // Focus the first child
            this.focus(children[0]);
            this.focusFirst = false;
        }
    };
    DropdownMenu.prototype.renderCore = function () {
        var _a = this.props, disabled = _a.disabled, title = _a.title, role = _a.role, icon = _a.icon, className = _a.className, children = _a.children;
        var open = this.state.open;
        var aria = {
            'role': role || 'combobox',
            'aria-disabled': disabled,
            'aria-haspopup': !!disabled,
            'aria-expanded': open
        };
        var menuAria = {
            'role': 'menu',
            'aria-label': lf("Dropdown menu {0}", title),
            'aria-hidden': !!open
        };
        var classes = cx([
            'ui',
            open ? 'active visible' : '',
            'dropdown',
            icon ? 'icon' : '',
            className || '',
        ]);
        var menuClasses = cx([
            'menu',
            open ? 'visible transition' : ''
        ]);
        return (React.createElement("div", __assign({ role: "listbox", ref: "dropdown", title: title }, aria, { id: this.props.id, className: classes, onMouseDown: this.handleMouseDown, onClick: this.handleClick, onKeyDown: this.handleKeyDown, onFocus: this.handleFocus, onBlur: this.handleBlur, tabIndex: 0 }),
            genericContent(this.props),
            React.createElement("div", __assign({ ref: "menu" }, menuAria, { className: menuClasses, role: "menu" }), children)));
    };
    return DropdownMenu;
}(UIElement));
exports.DropdownMenu = DropdownMenu;
var Item = /** @class */ (function (_super) {
    __extends(Item, _super);
    function Item() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Item.prototype.renderCore = function () {
        var _a = this.props, text = _a.text, title = _a.title, ariaLabel = _a.ariaLabel;
        return (React.createElement("div", { className: genericClassName("ui item link", this.props, true) + (" " + (this.props.active ? 'active' : '')), role: this.props.role, "aria-label": ariaLabel || title || text, title: title || text, tabIndex: this.props.tabIndex || 0, key: this.props.value, "data-value": this.props.value, onClick: this.props.onClick, onKeyDown: this.props.onKeyDown || fireClickOnEnter },
            genericContent(this.props),
            this.props.children));
    };
    return Item;
}(data.Component));
exports.Item = Item;
var ButtonMenuItem = /** @class */ (function (_super) {
    __extends(ButtonMenuItem, _super);
    function ButtonMenuItem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ButtonMenuItem.prototype.renderCore = function () {
        return (React.createElement("div", { className: genericClassName("ui item link", this.props, true) + (" " + (this.props.active ? 'active' : '')), role: this.props.role, title: this.props.title || this.props.text, tabIndex: this.props.tabIndex || 0, key: this.props.value, "data-value": this.props.value, onClick: this.props.onClick, onKeyDown: this.props.onKeyDown || fireClickOnEnter },
            React.createElement("div", { className: genericClassName("ui button", this.props) },
                genericContent(this.props),
                this.props.children)));
    };
    return ButtonMenuItem;
}(UIElement));
exports.ButtonMenuItem = ButtonMenuItem;
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    function Button() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Button.prototype.renderCore = function () {
        var _a = this.props, labelPosition = _a.labelPosition, color = _a.color, size = _a.size, disabled = _a.disabled, loading = _a.loading;
        var classes = cx([
            color,
            size,
            (disabled || loading) ? 'disabled' : '',
            loading ? 'loading' : '',
            genericClassName("ui button", this.props)
        ]);
        var button = React.createElement("button", { className: classes, id: this.props.id, role: this.props.role, title: this.props.title, tabIndex: this.props.tabIndex || 0, "aria-label": this.props.ariaLabel, "aria-expanded": this.props.ariaExpanded, onClick: this.props.onClick, onKeyDown: this.props.onKeyDown, autoFocus: this.props.autoFocus },
            genericContent(this.props),
            this.props.children);
        // Tooltips don't work great on IOS, disabling them
        return this.props.tooltipId && !pxt.BrowserUtils.isIOS() ? React.createElement(Tooltip, { id: this.props.tooltipId, content: this.props.tooltip || this.props.title, place: this.props.tooltipPlace, delayShow: this.props.tooltipDelayShow }, button) : button;
    };
    return Button;
}(StatelessUIElement));
exports.Button = Button;
var CloseButton = /** @class */ (function (_super) {
    __extends(CloseButton, _super);
    function CloseButton() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CloseButton.prototype.renderCore = function () {
        var onClick = this.props.onClick;
        return React.createElement("div", { role: "button", className: "closeIcon", tabIndex: 0, onClick: onClick, onKeyDown: fireClickOnEnter, "aria-label": lf("Close") },
            React.createElement(exports.Icon, { icon: "close remove circle" }));
    };
    return CloseButton;
}(StatelessUIElement));
exports.CloseButton = CloseButton;
var Link = /** @class */ (function (_super) {
    __extends(Link, _super);
    function Link() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Link.prototype.renderCore = function () {
        return (React.createElement("a", { className: genericClassName("ui", this.props) + " " + (this.props.disabled ? "disabled" : ""), id: this.props.id, href: this.props.href, target: this.props.target, rel: this.props.rel || (this.props.target ? "noopener noreferrer" : ""), download: this.props.download, role: this.props.role, title: this.props.title, tabIndex: this.props.tabIndex || 0, "aria-label": this.props.ariaLabel, "aria-expanded": this.props.ariaExpanded, onClick: this.props.onClick, onKeyDown: this.props.onKeyDown || fireClickOnEnter },
            genericContent(this.props),
            this.props.children));
    };
    return Link;
}(StatelessUIElement));
exports.Link = Link;
function helpIconLink(url, title) {
    return React.createElement(Link, { href: url, icon: "help circle", target: "_blank", role: "button", title: title });
}
exports.helpIconLink = helpIconLink;
///////////////////////////////////////////////////////////
////////////           FormField              /////////////
///////////////////////////////////////////////////////////
var Field = /** @class */ (function (_super) {
    __extends(Field, _super);
    function Field() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Field.prototype.renderCore = function () {
        return (React.createElement("div", { className: "field" },
            this.props.label ? React.createElement("label", { htmlFor: !this.props.ariaLabel ? this.props.htmlFor : undefined }, this.props.label) : null,
            this.props.ariaLabel && this.props.htmlFor ? (React.createElement("label", { htmlFor: this.props.htmlFor, className: "accessible-hidden" }, this.props.ariaLabel)) : "",
            this.props.children));
    };
    return Field;
}(data.Component));
exports.Field = Field;
var Input = /** @class */ (function (_super) {
    __extends(Input, _super);
    function Input(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            value: props.value
        };
        _this.copy = _this.copy.bind(_this);
        _this.handleClick = _this.handleClick.bind(_this);
        _this.handleChange = _this.handleChange.bind(_this);
        return _this;
    }
    Input.prototype.componentDidMount = function () {
        var _a = this.props, selectOnMount = _a.selectOnMount, autoFocus = _a.autoFocus;
        if (selectOnMount && autoFocus) {
            var input = this.refs['inputField'];
            input.select();
        }
    };
    Input.prototype.componentWillReceiveProps = function (newProps) {
        this.setState({ value: newProps.value });
    };
    Input.prototype.clearValue = function () {
        this.setState({ value: undefined });
    };
    Input.prototype.copy = function () {
        var p = this.props;
        var el = ReactDOM.findDOMNode(this);
        if (!p.lines || p.lines == 1) {
            var inp = el.getElementsByTagName("input")[0];
            inp.focus();
            inp.setSelectionRange(0, 9999);
        }
        else {
            var inp = el.getElementsByTagName("textarea")[0];
            inp.focus();
            inp.setSelectionRange(0, 9999);
        }
        try {
            var success = document.execCommand("copy");
            pxt.debug('copy: ' + success);
        }
        catch (e) {
        }
    };
    Input.prototype.handleClick = function (e) {
        if (this.props.selectOnClick) {
            e.target.setSelectionRange(0, 9999);
        }
    };
    Input.prototype.handleChange = function (e) {
        var newValue = e.target.value;
        if (!this.props.readOnly && (!this.state || this.state.value !== newValue)) {
            this.setState({ value: newValue });
        }
        if (this.props.onChange) {
            this.props.onChange(newValue);
        }
    };
    Input.prototype.renderCore = function () {
        var p = this.props;
        var copyBtn = p.copy && document.queryCommandSupported('copy')
            ? React.createElement(Button, { className: "ui right labeled primary icon button", text: lf("Copy"), icon: "copy", onClick: this.copy })
            : null;
        var error = this.props.error;
        var value = this.state.value;
        return (React.createElement(Field, { ariaLabel: p.ariaLabel, htmlFor: p.id, label: p.label },
            React.createElement("div", { className: "ui input" + (p.inputLabel ? " labelled" : "") + (p.copy ? " action fluid" : "") + (p.disabled ? " disabled" : "") },
                p.inputLabel ? (React.createElement("div", { className: "ui label" }, p.inputLabel)) : "",
                !p.lines || p.lines == 1 ? React.createElement("input", { ref: 'inputField', autoFocus: p.autoFocus, id: p.id, className: p.class || "", type: p.type || "text", placeholder: p.placeholder, value: value || '', readOnly: !!p.readOnly, onClick: this.handleClick, onChange: this.handleChange, autoComplete: p.autoComplete ? "" : "off", autoCorrect: p.autoComplete ? "" : "off", autoCapitalize: p.autoComplete ? "" : "off", spellCheck: p.autoComplete })
                    : React.createElement("textarea", { id: p.id, className: "ui input " + (p.class || "") + (p.inputLabel ? " labelled" : ""), rows: p.lines, placeholder: p.placeholder, value: value || '', readOnly: !!p.readOnly, onClick: this.handleClick, onChange: this.handleChange }),
                copyBtn),
            error ? React.createElement("div", { className: "ui yellow message" }, error) : undefined));
    };
    return Input;
}(data.Component));
exports.Input = Input;
var Checkbox = /** @class */ (function (_super) {
    __extends(Checkbox, _super);
    function Checkbox(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.handleChange = _this.handleChange.bind(_this);
        return _this;
    }
    Checkbox.prototype.handleChange = function (v) {
        this.props.onChange(v.currentTarget.checked);
    };
    Checkbox.prototype.renderCore = function () {
        var p = this.props;
        return React.createElement(Field, { label: p.label },
            React.createElement("div", { className: "ui toggle checkbox" },
                React.createElement("input", { type: "checkbox", checked: p.checked, "aria-checked": p.checked, "aria-label": p.label || p.inputLabel, onChange: this.handleChange }),
                p.inputLabel ? React.createElement("label", null, p.inputLabel) : undefined));
    };
    return Checkbox;
}(data.Component));
exports.Checkbox = Checkbox;
exports.Icon = function (props) {
    var icon = props.icon, className = props.className, onClick = props.onClick, onKeyDown = props.onKeyDown, children = props.children, rest = __rest(props, ["icon", "className", "onClick", "onKeyDown", "children"]);
    return React.createElement("i", __assign({ className: "icon " + icon + " " + (className ? className : ''), onClick: onClick, onKeyDown: onKeyDown || fireClickOnEnter, "aria-hidden": true, role: "presentation" }, rest), children);
};
var MenuItem = /** @class */ (function (_super) {
    __extends(MenuItem, _super);
    function MenuItem(props) {
        var _this = _super.call(this, props) || this;
        _this.handleClick = function (e) {
            var onClick = _this.props.onClick;
            if (onClick)
                onClick(e, _this.props);
        };
        return _this;
    }
    MenuItem.prototype.renderCore = function () {
        var _a = this.props, active = _a.active, children = _a.children, className = _a.className, color = _a.color, content = _a.content, fitted = _a.fitted, header = _a.header, icon = _a.icon, link = _a.link, name = _a.name, onClick = _a.onClick, position = _a.position, ariaControls = _a.ariaControls, id = _a.id;
        var classes = cx([
            color,
            position,
            active ? 'active' : '',
            icon === true || icon && !(name || content) ? 'icon' : '',
            header ? 'header' : '',
            link || onClick ? 'link' : '',
            fitted ? (fitted == true ? "" + fitted : "fitted " + fitted) : '',
            'item',
            className
        ]);
        if (children) {
            return React.createElement("div", { role: "menuitem", className: classes, onClick: this.handleClick }, children);
        }
        return (React.createElement("div", { id: id, tabIndex: active ? 0 : -1, className: classes, onClick: this.handleClick, role: "tab", "aria-controls": ariaControls, "aria-selected": active, "aria-label": content || name },
            icon ? React.createElement(exports.Icon, { icon: icon }) : undefined,
            content || name));
    };
    return MenuItem;
}(data.Component));
exports.MenuItem = MenuItem;
var Menu = /** @class */ (function (_super) {
    __extends(Menu, _super);
    function Menu(props) {
        var _this = _super.call(this, props) || this;
        _this.handleKeyboardNavigation = function (e) {
            var charCode = core.keyCodeFromEvent(e);
            var leftOrUpKey = charCode === 37 || charCode === 38;
            var rightorBottomKey = charCode === 39 || charCode === 40;
            if (!leftOrUpKey && !rightorBottomKey) {
                return;
            }
            var menuItems = _this.child(".item");
            var activeNodeIndex = -1;
            var i = 0;
            while (activeNodeIndex === -1 && i < menuItems.length) {
                if (pxt.BrowserUtils.containsClass(menuItems[i], "active")) {
                    activeNodeIndex = i;
                }
                i++;
            }
            if (activeNodeIndex === -1) {
                return;
            }
            var selectedTab;
            if ((leftOrUpKey && !pxt.Util.isUserLanguageRtl()) || (rightorBottomKey && pxt.Util.isUserLanguageRtl())) {
                if (activeNodeIndex === 0) {
                    selectedTab = menuItems[menuItems.length - 1];
                }
                else {
                    selectedTab = menuItems[activeNodeIndex - 1];
                }
            }
            else if ((rightorBottomKey && !pxt.Util.isUserLanguageRtl()) || (leftOrUpKey && pxt.Util.isUserLanguageRtl())) {
                if (activeNodeIndex === menuItems.length - 1) {
                    selectedTab = menuItems[0];
                }
                else {
                    selectedTab = menuItems[activeNodeIndex + 1];
                }
            }
            if (selectedTab !== undefined) {
                selectedTab.click();
                selectedTab.focus();
            }
        };
        return _this;
    }
    Menu.prototype.componentDidMount = function () {
        var _this = this;
        var menuItems = this.child(".item");
        menuItems.forEach(function (elem, index) {
            elem.onkeydown = _this.handleKeyboardNavigation;
        });
    };
    Menu.prototype.renderCore = function () {
        var _a = this.props, attached = _a.attached, borderless = _a.borderless, children = _a.children, className = _a.className, color = _a.color, compact = _a.compact, fixed = _a.fixed, floated = _a.floated, fluid = _a.fluid, icon = _a.icon, inverted = _a.inverted, pagination = _a.pagination, pointing = _a.pointing, secondary = _a.secondary, size = _a.size, stackable = _a.stackable, tabular = _a.tabular, text = _a.text, vertical = _a.vertical;
        var classes = cx([
            'ui',
            color,
            size,
            borderless ? 'borderless' : '',
            compact ? 'compact' : '',
            fluid ? 'fluid' : '',
            inverted ? 'inverted' : '',
            pagination ? 'pagination' : '',
            pointing ? 'pointing' : '',
            secondary ? 'secondary' : '',
            stackable ? 'stackable' : '',
            text ? 'text' : '',
            vertical ? 'vertical' : '',
            attached ? (attached == true ? 'attached' : attached + " attached ") : '',
            floated ? (floated == true ? 'floated' : floated + " floated") : '',
            icon ? (icon == true ? 'icon' : icon + " icon") : '',
            tabular ? (tabular == true ? 'tabular' : tabular + " tabular") : '',
            fixed ? "tabular " + tabular : '',
            className,
            'menu'
        ]);
        return (React.createElement("div", { className: classes, role: "tablist" }, children));
    };
    return Menu;
}(data.Component));
exports.Menu = Menu;
var Modal = /** @class */ (function (_super) {
    __extends(Modal, _super);
    function Modal(props) {
        var _this = _super.call(this, props) || this;
        _this.setPositionAndClassNames = function () {
            var dimmer = _this.props.dimmer;
            var classes;
            if (dimmer) {
                classes = 'dimmable dimmed';
                if (dimmer === 'blurring') {
                    classes += ' blurring';
                }
            }
            var newState = {};
            var ref = _this.getRef();
            if (ref) {
                var height = ref.getBoundingClientRect().height;
                var marginTop = -Math.round(height / 2);
                var scrolling = height >= window.innerHeight;
                if (_this.state.marginTop !== marginTop) {
                    newState.marginTop = marginTop;
                }
                if (_this.state.scrolling !== scrolling) {
                    newState.scrolling = scrolling;
                }
                if (scrolling)
                    classes += ' scrolling';
            }
            if (_this.state.mountClasses !== classes)
                newState.mountClasses = classes;
            if (Object.keys(newState).length > 0) {
                _this.setState(newState);
                if (_this.props.onPositionChanged)
                    _this.props.onPositionChanged(_this.props);
            }
            _this.animationRequestId = requestAnimationFrame(_this.setPositionAndClassNames);
        };
        _this.id = ts.pxtc.Util.guidGen();
        _this.state = {};
        _this.onRequestClose = _this.onRequestClose.bind(_this);
        _this.afterOpen = _this.afterOpen.bind(_this);
        return _this;
    }
    Modal.prototype.afterOpen = function () {
        var modalDidOpen = this.props.modalDidOpen;
        this.setState({ scrolling: false });
        this.setPositionAndClassNames();
        if (modalDidOpen)
            modalDidOpen(this.getRef());
    };
    Modal.prototype.onClose = function () {
        cancelAnimationFrame(this.animationRequestId);
    };
    Modal.prototype.getRef = function () {
        var modal = this.refs["modal"];
        var ref = modal && modal.node
            && modal.node.firstChild && modal.node.firstChild.firstChild;
        return ref;
    };
    Modal.prototype.componentWillUnmount = function () {
        cancelAnimationFrame(this.animationRequestId);
    };
    Modal.prototype.onRequestClose = function () {
        var onClose = this.props.onClose;
        this.onClose();
        onClose();
    };
    Modal.prototype.render = function () {
        var _a = this.props, isOpen = _a.isOpen, size = _a.size, longer = _a.longer, basic = _a.basic, className = _a.className, onClose = _a.onClose, closeIcon = _a.closeIcon, children = _a.children, onKeyDown = _a.onKeyDown, header = _a.header, headerClass = _a.headerClass, headerActions = _a.headerActions, helpUrl = _a.helpUrl, description = _a.description, closeOnDimmerClick = _a.closeOnDimmerClick, closeOnDocumentClick = _a.closeOnDocumentClick, closeOnEscape = _a.closeOnEscape, shouldCloseOnEsc = _a.shouldCloseOnEsc, shouldCloseOnOverlayClick = _a.shouldCloseOnOverlayClick, shouldFocusAfterRender = _a.shouldFocusAfterRender, overlayClassName = _a.overlayClassName, rest = __rest(_a, ["isOpen", "size", "longer", "basic", "className", "onClose", "closeIcon", "children", "onKeyDown", "header", "headerClass", "headerActions", "helpUrl", "description", "closeOnDimmerClick", "closeOnDocumentClick", "closeOnEscape", "shouldCloseOnEsc", "shouldCloseOnOverlayClick", "shouldFocusAfterRender", "overlayClassName"]);
        var _b = this.state, marginTop = _b.marginTop, scrolling = _b.scrolling, mountClasses = _b.mountClasses;
        var isFullscreen = size == 'fullscreen';
        var showBack = isFullscreen && !!closeIcon;
        var classes = cx([
            'ui',
            size,
            longer ? 'longer' : '',
            basic ? 'basic' : '',
            scrolling ? 'scrolling' : '',
            closeIcon ? 'closable' : '',
            'modal transition visible active',
            className
        ]);
        var portalClassName = cx([
            core.highContrast ? 'hc' : '',
            mountClasses
        ]);
        var aria = {
            labelledby: header ? this.id + 'title' : undefined,
            describedby: (!isFullscreen && description) ? this.id + 'description' : this.id + 'desc',
            modal: 'true'
        };
        var customStyles = {
            content: {
                marginTop: marginTop
            }
        };
        return React.createElement(ReactModal, __assign({ isOpen: isOpen, ref: "modal", appElement: exports.appElement, onRequestClose: this.onRequestClose, onAfterOpen: this.afterOpen, shouldReturnFocusAfterClose: true, shouldFocusAfterRender: shouldFocusAfterRender, shouldCloseOnEsc: shouldCloseOnEsc || closeOnEscape, shouldCloseOnOverlayClick: shouldCloseOnOverlayClick || (closeOnDocumentClick || closeOnDimmerClick), portalClassName: portalClassName, overlayClassName: "ui page modals dimmer transition " + overlayClassName + " " + (isOpen ? 'visible active' : ''), className: classes, style: customStyles, aria: aria }, rest),
            header || showBack || helpUrl ? React.createElement("div", { id: this.id + 'title', className: "header " + (headerClass || "") },
                React.createElement("span", { className: "header-title", style: { margin: "0 " + (helpUrl ? '-20rem' : '0') + " 0 " + (showBack ? '-20rem' : '0') } }, header),
                showBack ? React.createElement("div", { className: "header-close" },
                    React.createElement(Button, { className: "back-button large", title: lf("Go back"), onClick: onClose, tabIndex: 0, onKeyDown: fireClickOnEnter },
                        React.createElement(exports.Icon, { icon: "arrow left" }),
                        React.createElement("span", { className: "ui text landscape only" }, lf("Go back")))) : undefined,
                helpUrl ?
                    React.createElement("div", { className: "header-help" },
                        React.createElement("a", { className: "ui icon help-button", href: helpUrl, target: "_docs", role: "button", "aria-label": lf("Help on {0} dialog", header) },
                            React.createElement(exports.Icon, { icon: "help" })))
                    : undefined) : undefined,
            isFullscreen && headerActions ? React.createElement("div", { className: "header-actions" }, headerActions) : undefined,
            !isFullscreen && description ? React.createElement("label", { id: this.id + 'description', className: "accessible-hidden" }, description) : undefined,
            React.createElement("div", { id: this.id + 'desc', className: (longer ? 'scrolling' : '') + " " + (headerActions ? 'has-actions' : '') + " content" }, children),
            !isFullscreen && this.props.buttons && this.props.buttons.length > 0 ?
                React.createElement("div", { className: "actions" }, this.props.buttons.map(function (action) {
                    return action.url ?
                        React.createElement(Link, { key: "action_" + action.label, icon: action.icon, text: action.label, className: "ui button approve " + (action.icon ? 'icon right labeled' : '') + " " + (action.className || '') + " " + (action.loading ? "loading disabled" : "") + " " + (action.disabled ? "disabled" : ""), href: action.url, target: !action.fileName ? '_blank' : undefined, download: action.fileName ? pxt.Util.htmlEscape(action.fileName) : undefined })
                        : React.createElement(ModalButtonElement, __assign({ key: "action_" + action.label }, action, { labelPosition: action.labelPosition }));
                })) : undefined,
            !isFullscreen && closeIcon && React.createElement(CloseButton, { onClick: onClose }));
    };
    return Modal;
}(React.Component));
exports.Modal = Modal;
var ModalButtonElement = /** @class */ (function (_super) {
    __extends(ModalButtonElement, _super);
    function ModalButtonElement(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    ModalButtonElement.prototype.handleClick = function () {
        if (!this.props.disabled)
            this.props.onclick();
    };
    ModalButtonElement.prototype.renderCore = function () {
        var action = this.props;
        return React.createElement(Button, { icon: action.icon, text: action.label, labelPosition: action.labelPosition, className: "approve " + (action.icon ? "icon " + (action.labelPosition ? action.labelPosition : 'right') + " labeled" : '') + " " + (action.className || '') + " " + (action.loading ? "loading disabled" : "") + " " + (action.disabled ? "disabled" : ""), onClick: this.handleClick, onKeyDown: fireClickOnEnter });
    };
    return ModalButtonElement;
}(data.PureComponent));
var Dimmer = /** @class */ (function (_super) {
    __extends(Dimmer, _super);
    function Dimmer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Dimmer.prototype.render = function () {
        var _a = this.props, disabled = _a.disabled, inverted = _a.inverted, page = _a.page, simple = _a.simple, closable = _a.closable, onClose = _a.onClose, active = _a.active, children = _a.children, rest = __rest(_a, ["disabled", "inverted", "page", "simple", "closable", "onClose", "active", "children"]);
        var portalClasses = cx([
            'ui dimmer',
            active ? 'active transition visible' : '',
            disabled ? 'disabled' : '',
            inverted ? 'inverted' : '',
            page ? 'page' : '',
            simple ? 'simple' : ''
        ]);
        var customStyles = {
            content: {
                background: 'none',
                border: '0'
            }
        };
        return React.createElement(ReactModal, __assign({ appElement: exports.appElement, style: customStyles, shouldCloseOnOverlayClick: closable, onRequestClose: onClose, overlayClassName: portalClasses }, rest), children);
    };
    return Dimmer;
}(UIElement));
exports.Dimmer = Dimmer;
var Loader = /** @class */ (function (_super) {
    __extends(Loader, _super);
    function Loader() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Loader.prototype.render = function () {
        var _a = this.props, active = _a.active, children = _a.children, disabled = _a.disabled, inverted = _a.inverted, size = _a.size, className = _a.className;
        var classes = cx([
            'ui loader',
            size,
            active ? 'active' : '',
            disabled ? 'disabled' : '',
            inverted ? 'inverted' : '',
            children ? 'text' : '',
            className
        ]);
        return React.createElement("div", { className: classes }, children);
    };
    return Loader;
}(UIElement));
exports.Loader = Loader;
var Tooltip = /** @class */ (function (_super) {
    __extends(Tooltip, _super);
    function Tooltip(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        return _this;
    }
    Tooltip.prototype.render = function () {
        var _a = this.props, id = _a.id, content = _a.content, className = _a.className, rest = __rest(_a, ["id", "content", "className"]);
        return React.createElement("div", null,
            React.createElement("div", { "data-tip": 'tooltip', "data-for": id }, this.props.children),
            React.createElement(ReactTooltip, __assign({ id: id, className: "pxt-tooltip " + (className || ''), effect: 'solid' }, rest), content));
    };
    return Tooltip;
}(React.Component));
exports.Tooltip = Tooltip;
var ProgressCircle = /** @class */ (function (_super) {
    __extends(ProgressCircle, _super);
    function ProgressCircle(props) {
        var _this = _super.call(this, props) || this;
        _this.radius = 100 / (2 * Math.PI); // 100 steps in circle
        _this.view = _this.radius * 2 + _this.props.stroke;
        return _this;
    }
    ProgressCircle.prototype.getPathStyle = function () {
        return { strokeWidth: this.props.stroke };
    };
    ProgressCircle.prototype.render = function () {
        var props = this.props;
        var r = this.radius;
        return React.createElement("div", { className: "progresscircle" },
            React.createElement("svg", { viewBox: "0 0 " + this.view + " " + this.view, "aria-labelledby": "circletitle", role: "img" },
                React.createElement("title", { id: "circletitle" },
                    "Currently on step ",
                    props.progress,
                    " of ",
                    props.steps),
                React.createElement("path", { style: this.getPathStyle(), strokeDasharray: Math.round(100 * props.progress / props.steps) + ", 100", d: "M" + this.view / 2 + " " + props.stroke / 2 + " a " + r + " " + r + " 0 0 1 0 " + r * 2 + " a " + r + " " + r + " 0 0 1 0 -" + r * 2 })));
    };
    return ProgressCircle;
}(React.Component));
exports.ProgressCircle = ProgressCircle;
var PlainCheckbox = /** @class */ (function (_super) {
    __extends(PlainCheckbox, _super);
    function PlainCheckbox(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            isChecked: false
        };
        _this.setCheckedBit = _this.setCheckedBit.bind(_this);
        return _this;
    }
    PlainCheckbox.prototype.setCheckedBit = function () {
        var val = !this.state.isChecked;
        this.props.onChange(val);
        this.setState({ isChecked: val });
    };
    PlainCheckbox.prototype.renderCore = function () {
        return React.createElement(Checkbox, { inputLabel: this.props.label, checked: this.state.isChecked, onChange: this.setCheckedBit });
    };
    return PlainCheckbox;
}(data.Component));
exports.PlainCheckbox = PlainCheckbox;
