
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var baseUrl = `http://localhost:4200`;

    /* src/TreeView.svelte generated by Svelte v3.23.0 */

    const { console: console_1 } = globals;
    const file = "src/TreeView.svelte";

    function create_fragment(ctx) {
    	let div5;
    	let html_tag;
    	let t;
    	let div4;
    	let div0;
    	let div1;
    	let div2;
    	let div3;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			t = space();
    			div4 = element("div");
    			div0 = element("div");
    			div1 = element("div");
    			div2 = element("div");
    			div3 = element("div");
    			html_tag = new HtmlTag(t);
    			attr_dev(div0, "class", "svelte-662e0g");
    			add_location(div0, file, 228, 54, 7887);
    			attr_dev(div1, "class", "svelte-662e0g");
    			add_location(div1, file, 228, 65, 7898);
    			attr_dev(div2, "class", "svelte-662e0g");
    			add_location(div2, file, 228, 76, 7909);
    			attr_dev(div3, "class", "svelte-662e0g");
    			add_location(div3, file, 228, 87, 7920);
    			attr_dev(div4, "class", "lds-ring svelte-662e0g");
    			toggle_class(div4, "active", /*requestLoading*/ ctx[0]);
    			add_location(div4, file, 228, 2, 7835);
    			attr_dev(div5, "id", "treeview");
    			attr_dev(div5, "class", "svelte-662e0g");
    			add_location(div5, file, 226, 0, 7798);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			html_tag.m(/*tree*/ ctx[1], div5);
    			append_dev(div5, t);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, div1);
    			append_dev(div4, div2);
    			append_dev(div4, div3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tree*/ 2) html_tag.p(/*tree*/ ctx[1]);

    			if (dirty & /*requestLoading*/ 1) {
    				toggle_class(div4, "active", /*requestLoading*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { treeData = "" } = $$props;
    	let { requestLoading = "" } = $$props;
    	let tree = "";
    	let selectedNodes = [];
    	let defaultLineHeight = 31; // in px
    	let defaultCollapseTransitionTime = 500; // in milliseconds

    	const generateTreeview = data => {
    		console.log("treeData: ", data);
    		$$invalidate(1, tree = "");

    		let treeString = `<div id="tree"><div class="treeTooltip">Click on elements to see their children.
                      <br>Click on the input beside them to select for CSS generation.</div>
                      <button type="button" id="generateCSS" class="btn-primary">Get CSS</button>`;

    		if (!data) return;

    		if (data.type === "ERROR") {
    			$$invalidate(1, tree = data.msg);
    			return;
    		}

    		let nodes = data.nodes;

    		for (let node in nodes) {
    			let nodeRoot = nodes[node].document;
    			let children = nodeRoot.children;

    			if (children) {
    				treeString += `<ul>`;

    				for (let child of children) {
    					treeString += generateTreeviewRecursive(child);
    				}

    				treeString += `</ul>`;
    			}

    			treeString += `</div>`;
    			$$invalidate(1, tree = treeString);
    		}
    	};

    	const generateTreeviewRecursive = child => {
    		// TODO: only add accordionControl if has children;
    		// TODO: accordion-control should be a downward arrow, add span before for child.name;
    		// TODO: selectable childs for CSS generation;
    		let children = child.children;

    		let treeString = `<li class="${children ? "isParent" : ""}" data-childrenAmmount="${children ? children.length.toString() : "0"}" data-child-id="${child.id}" data-child-type="${child.type}">
                        <span class="accordionControl">${child.name}</span>
                        <input type=checkbox class="selectionControl">
                        ${children
		? "<input type=checkbox class='childSelectionControl'>"
		: ""}`;

    		if (children) {
    			treeString += `<ul>`;

    			for (let child of children) {
    				treeString += generateTreeviewRecursive(child);
    			}

    			treeString += `</ul>`;
    		}

    		treeString += `</li>`;
    		return treeString;
    	};

    	const propagateLineHeightAdjustment = (element, isExpanding = true, offset = 0) => {
    		let childrenAmmount = element.dataset.childrenammount;
    		let listItemChildrenContainer = element.querySelector("ul");
    		let heightAdjustment = childrenAmmount * defaultLineHeight;
    		let containerList = element.parentNode.closest("li");

    		if (containerList && containerList.classList.contains("isParent")) {
    			propagateLineHeightAdjustment(containerList, isExpanding, heightAdjustment);
    		}

    		if (isExpanding) {
    			listItemChildrenContainer.style.maxHeight = listItemChildrenContainer.offsetHeight + heightAdjustment + offset + "px";
    		}
    	};

    	const propagateCollapse = element => {
    		let openChildren = element.querySelectorAll("ul.open");

    		for (let child of openChildren) {
    			child.classList.remove("open");
    			child.style.maxHeight = "0px";
    		}
    	};

    	const toggleChildrenDisplay = element => {
    		let clickedListItem = element.parentNode;
    		let listItemChildrenContainer = clickedListItem.querySelector("ul");
    		let listItemChildrenAmount = clickedListItem.dataset.childrenammount;

    		if (listItemChildrenContainer) {
    			if (listItemChildrenContainer.classList.toggle("open")) {
    				listItemChildrenContainer.style.maxHeight = defaultLineHeight * listItemChildrenAmount + "px";
    				propagateLineHeightAdjustment(clickedListItem, true);
    			} else {
    				listItemChildrenContainer.style.maxHeight = "0px";
    				propagateLineHeightAdjustment(clickedListItem, false);
    				propagateCollapse(clickedListItem);
    			}
    		}
    	};

    	const propagateSelectedCount = (element, value) => {
    		let ul = element.closest("ul");

    		if (ul) {
    			let span = ul.parentElement.querySelector(":scope > span");

    			if (span) {
    				if (!span.dataset.selectedCount) {
    					span.dataset.selectedCount = "0";
    				}

    				span.dataset.selectedCount = parseInt(span.dataset.selectedCount) + value;
    				propagateSelectedCount(ul.parentElement, value);
    			}
    		}
    	};

    	const selectElement = element => {
    		selectedNodes.push(element.parentNode.dataset.childId);
    	};

    	const deselectElement = element => {
    		let id = element.parentNode.dataset.childId;
    		let index = selectedNodes.indexOf(id);
    		selectedNodes.splice(index, 1);
    	};

    	const toggleAllChildren = element => {
    		let ul = element.parentNode.querySelector(":scope > ul");
    		let liList = ul.children;
    		let children;

    		for (let i = 0; i < liList.length; i++) {
    			children = liList[i].children;

    			for (let j = 0; j < children.length; j++) {
    				if (children[j].className == "selectionControl") {
    					toggleElementSelected(children[j]);
    				}

    				if (children[j].className == "childSelectionControl") {
    					children[j].checked = !children[j].checked;
    					toggleAllChildren(children[j]);
    				}
    			}
    		}
    	};

    	const toggleElementSelected = element => {
    		let span = element.closest("ul").parentElement.querySelector(":scope > span");

    		if (span) {
    			if (!span.dataset.selectedCount) {
    				span.dataset.selectedCount = "0";
    			}
    		}

    		if (element.parentNode.dataset.selected == "true") {
    			element.parentNode.dataset.selected = "false";
    			element.checked = false;
    			deselectElement(element);
    			propagateSelectedCount(element, -1);
    		} else {
    			element.parentNode.dataset.selected = "true";
    			element.checked = true;
    			selectElement(element);
    			propagateSelectedCount(element, 1);
    		}
    	};

    	const defineLineWidth = () => {
    		let lines = document.querySelectorAll("span.accordionControl");
    		let largestLineWidth = 0;

    		for (let line of lines) {
    			if (line.offsetWidth > largestLineWidth) {
    				largestLineWidth = line.offsetWidth;
    			}
    		}

    		for (let line of lines) {
    			line.style.width = largestLineWidth + "px";
    			line.style.display = "inline-block";
    		}
    	};

    	const generateCSS = () => {
    		console.log("generating");
    	};

    	afterUpdate(() => {
    		let accordionControls = document.querySelectorAll(".accordionControl");
    		let selectionControls = document.querySelectorAll(".selectionControl");
    		let childSelectionControl = document.querySelectorAll(".childSelectionControl");

    		for (let control of accordionControls) {
    			control.addEventListener("click", evt => {
    				toggleChildrenDisplay(evt.target);
    			});
    		}

    		for (let control of selectionControls) {
    			control.addEventListener("click", evt => {
    				toggleElementSelected(evt.target);
    			});
    		}

    		if (document.querySelector("#generateCSS")) {
    			document.querySelector("#generateCSS").addEventListener("click", generateCSS);
    		}

    		for (let control of childSelectionControl) {
    			control.addEventListener("click", evt => {
    				toggleAllChildren(evt.target);
    			});
    		}

    		defineLineWidth();
    	});

    	beforeUpdate(() => {
    		let accordionControls = document.querySelectorAll(".accordionControl");
    		let selectionControls = document.querySelectorAll(".selectionControl");
    		let childSelectionControl = document.querySelectorAll(".childSelectionControl");

    		for (let control of selectionControls) {
    			control.removeEventListener("click");
    		}

    		for (let control of accordionControls) {
    			control.removeEventListener("click");
    		}

    		for (let control of childSelectionControl) {
    			control.removeEventListener("click");
    		}

    		if (document.querySelector("#generateCSS")) {
    			document.querySelector("#generateCSS").removeEventListener("click");
    		}
    	});

    	const writable_props = ["treeData", "requestLoading"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TreeView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TreeView", $$slots, []);

    	$$self.$set = $$props => {
    		if ("treeData" in $$props) $$invalidate(2, treeData = $$props.treeData);
    		if ("requestLoading" in $$props) $$invalidate(0, requestLoading = $$props.requestLoading);
    	};

    	$$self.$capture_state = () => ({
    		treeData,
    		requestLoading,
    		afterUpdate,
    		beforeUpdate,
    		onMount,
    		tree,
    		selectedNodes,
    		defaultLineHeight,
    		defaultCollapseTransitionTime,
    		generateTreeview,
    		generateTreeviewRecursive,
    		propagateLineHeightAdjustment,
    		propagateCollapse,
    		toggleChildrenDisplay,
    		propagateSelectedCount,
    		selectElement,
    		deselectElement,
    		toggleAllChildren,
    		toggleElementSelected,
    		defineLineWidth,
    		generateCSS
    	});

    	$$self.$inject_state = $$props => {
    		if ("treeData" in $$props) $$invalidate(2, treeData = $$props.treeData);
    		if ("requestLoading" in $$props) $$invalidate(0, requestLoading = $$props.requestLoading);
    		if ("tree" in $$props) $$invalidate(1, tree = $$props.tree);
    		if ("selectedNodes" in $$props) selectedNodes = $$props.selectedNodes;
    		if ("defaultLineHeight" in $$props) defaultLineHeight = $$props.defaultLineHeight;
    		if ("defaultCollapseTransitionTime" in $$props) defaultCollapseTransitionTime = $$props.defaultCollapseTransitionTime;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*treeData*/ 4) {
    			 generateTreeview(treeData);
    		}
    	};

    	return [requestLoading, tree, treeData];
    }

    class TreeView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { treeData: 2, requestLoading: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TreeView",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get treeData() {
    		throw new Error("<TreeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set treeData(value) {
    		throw new Error("<TreeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get requestLoading() {
    		throw new Error("<TreeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set requestLoading(value) {
    		throw new Error("<TreeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CSSGenerator.svelte generated by Svelte v3.23.0 */

    const file$1 = "src/CSSGenerator.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "generator");
    			add_location(div, file$1, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CSSGenerator> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CSSGenerator", $$slots, []);
    	return [];
    }

    class CSSGenerator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CSSGenerator",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.0 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let main1;
    	let div6;
    	let header;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let main0;
    	let form;
    	let div2;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let div3;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let div4;
    	let label2;
    	let t11;
    	let input2;
    	let t12;
    	let div5;
    	let label3;
    	let t14;
    	let input3;
    	let t15;
    	let button;
    	let t17;
    	let t18;
    	let t19;
    	let footer;
    	let current;
    	let mounted;
    	let dispose;

    	const treeview = new TreeView({
    			props: {
    				treeData: /*result*/ ctx[0],
    				requestLoading: /*treeLoading*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const cssgenerator = new CSSGenerator({ $$inline: true });

    	const block = {
    		c: function create() {
    			main1 = element("main");
    			div6 = element("div");
    			header = element("header");
    			div0 = element("div");
    			div0.textContent = "Figma2CSS";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Generate CSS from Figma Layouts";
    			t3 = space();
    			main0 = element("main");
    			form = element("form");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Figma Access Token*";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "File ID*";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			div4 = element("div");
    			label2 = element("label");
    			label2.textContent = "Node IDs";
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			div5 = element("div");
    			label3 = element("label");
    			label3.textContent = "Depth";
    			t14 = space();
    			input3 = element("input");
    			t15 = space();
    			button = element("button");
    			button.textContent = "Generate!";
    			t17 = space();
    			create_component(treeview.$$.fragment);
    			t18 = space();
    			create_component(cssgenerator.$$.fragment);
    			t19 = space();
    			footer = element("footer");
    			attr_dev(div0, "class", "title svelte-yapxji");
    			add_location(div0, file$2, 57, 3, 1413);
    			attr_dev(div1, "class", "subtitle svelte-yapxji");
    			add_location(div1, file$2, 58, 3, 1451);
    			attr_dev(header, "class", "svelte-yapxji");
    			add_location(header, file$2, 56, 2, 1401);
    			attr_dev(label0, "for", "figmaToken");
    			attr_dev(label0, "class", "svelte-yapxji");
    			add_location(label0, file$2, 63, 5, 1663);
    			attr_dev(input0, "id", "figmaToken");
    			attr_dev(input0, "name", "figmaToken");
    			attr_dev(input0, "placeholder", "Access Token");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-yapxji");
    			add_location(input0, file$2, 64, 5, 1720);
    			attr_dev(div2, "class", "label-input-container svelte-yapxji");
    			add_location(div2, file$2, 62, 4, 1622);
    			attr_dev(label1, "for", "fileId");
    			attr_dev(label1, "class", "svelte-yapxji");
    			add_location(label1, file$2, 67, 5, 1878);
    			attr_dev(input1, "id", "fileId");
    			attr_dev(input1, "name", "fileId");
    			attr_dev(input1, "placeholder", "File ID");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-yapxji");
    			add_location(input1, file$2, 68, 5, 1920);
    			attr_dev(div3, "class", "label-input-container svelte-yapxji");
    			add_location(div3, file$2, 66, 4, 1837);
    			attr_dev(label2, "for", "nodeIds");
    			attr_dev(label2, "class", "svelte-yapxji");
    			add_location(label2, file$2, 71, 5, 2072);
    			attr_dev(input2, "id", "nodeIds");
    			attr_dev(input2, "name", "nodeIds");
    			attr_dev(input2, "placeholder", "Comma Separated IDs");
    			attr_dev(input2, "class", "svelte-yapxji");
    			add_location(input2, file$2, 72, 5, 2115);
    			attr_dev(div4, "class", "label-input-container smallInput svelte-yapxji");
    			add_location(div4, file$2, 70, 4, 2020);
    			attr_dev(label3, "for", "depth");
    			attr_dev(label3, "class", "svelte-yapxji");
    			add_location(label3, file$2, 75, 5, 2273);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "id", "depth");
    			attr_dev(input3, "name", "depth");
    			attr_dev(input3, "placeholder", "Depth");
    			attr_dev(input3, "class", "svelte-yapxji");
    			add_location(input3, file$2, 76, 5, 2311);
    			attr_dev(div5, "class", "label-input-container smallInput svelte-yapxji");
    			add_location(div5, file$2, 74, 4, 2221);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "id", "generateButton");
    			attr_dev(button, "class", "btn-primary svelte-yapxji");
    			add_location(button, file$2, 78, 4, 2411);
    			attr_dev(form, "class", "auth-form svelte-yapxji");
    			attr_dev(form, "id", "generateForm");
    			add_location(form, file$2, 61, 3, 1535);
    			attr_dev(main0, "class", "svelte-yapxji");
    			add_location(main0, file$2, 60, 2, 1525);
    			attr_dev(footer, "class", "svelte-yapxji");
    			add_location(footer, file$2, 83, 2, 2596);
    			attr_dev(div6, "class", "container svelte-yapxji");
    			add_location(div6, file$2, 55, 1, 1375);
    			attr_dev(main1, "class", "svelte-yapxji");
    			add_location(main1, file$2, 54, 0, 1367);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main1, anchor);
    			append_dev(main1, div6);
    			append_dev(div6, header);
    			append_dev(header, div0);
    			append_dev(header, t1);
    			append_dev(header, div1);
    			append_dev(div6, t3);
    			append_dev(div6, main0);
    			append_dev(main0, form);
    			append_dev(form, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t5);
    			append_dev(div2, input0);
    			set_input_value(input0, /*figmaToken*/ ctx[1]);
    			append_dev(form, t6);
    			append_dev(form, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t8);
    			append_dev(div3, input1);
    			set_input_value(input1, /*fileId*/ ctx[2]);
    			append_dev(form, t9);
    			append_dev(form, div4);
    			append_dev(div4, label2);
    			append_dev(div4, t11);
    			append_dev(div4, input2);
    			set_input_value(input2, /*nodeIds*/ ctx[3]);
    			append_dev(form, t12);
    			append_dev(form, div5);
    			append_dev(div5, label3);
    			append_dev(div5, t14);
    			append_dev(div5, input3);
    			set_input_value(input3, /*depth*/ ctx[4]);
    			append_dev(form, t15);
    			append_dev(form, button);
    			append_dev(main0, t17);
    			mount_component(treeview, main0, null);
    			append_dev(main0, t18);
    			mount_component(cssgenerator, main0, null);
    			append_dev(div6, t19);
    			append_dev(div6, footer);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[10]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[11]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[6]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*figmaToken*/ 2 && input0.value !== /*figmaToken*/ ctx[1]) {
    				set_input_value(input0, /*figmaToken*/ ctx[1]);
    			}

    			if (dirty & /*fileId*/ 4 && input1.value !== /*fileId*/ ctx[2]) {
    				set_input_value(input1, /*fileId*/ ctx[2]);
    			}

    			if (dirty & /*nodeIds*/ 8 && input2.value !== /*nodeIds*/ ctx[3]) {
    				set_input_value(input2, /*nodeIds*/ ctx[3]);
    			}

    			if (dirty & /*depth*/ 16 && to_number(input3.value) !== /*depth*/ ctx[4]) {
    				set_input_value(input3, /*depth*/ ctx[4]);
    			}

    			const treeview_changes = {};
    			if (dirty & /*result*/ 1) treeview_changes.treeData = /*result*/ ctx[0];
    			if (dirty & /*treeLoading*/ 32) treeview_changes.requestLoading = /*treeLoading*/ ctx[5];
    			treeview.$set(treeview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(treeview.$$.fragment, local);
    			transition_in(cssgenerator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(treeview.$$.fragment, local);
    			transition_out(cssgenerator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main1);
    			destroy_component(treeview);
    			destroy_component(cssgenerator);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let result = "";
    	let figmaToken = "";
    	let fileId = "";
    	let nodeIds = [];
    	let depth = "";
    	let treeLoading = false;
    	console.log("baseUrl: ", baseUrl);

    	function handleSubmit() {
    		$$invalidate(5, treeLoading = true);
    		$$invalidate(0, result = "");
    		let ajax = new XMLHttpRequest();
    		ajax.open("GET", `${baseUrl}/data?fileId=${fileId}&figmaToken=${figmaToken}`, true);
    		ajax.send();

    		ajax.onreadystatechange = () => {
    			if (ajax.readyState === 4 && ajax.status === 200) {
    				$$invalidate(0, result = JSON.parse(ajax.responseText));
    				$$invalidate(5, treeLoading = false);
    			} else if (ajax.readyState === 4 && ajax.status !== 200) {
    				$$invalidate(0, result = {
    					msg: "Request Error! Please check file ID and access token :)",
    					type: "ERROR"
    				});

    				$$invalidate(5, treeLoading = false);
    			}
    		};
    	}

    	const getSavedCredentials = () => {
    		let ajax = new XMLHttpRequest();
    		ajax.open("GET", `${baseUrl}/cached-credentials`, true);
    		ajax.send();

    		ajax.onreadystatechange = () => {
    			if (ajax.readyState === 4 && ajax.status === 200) {
    				let response = JSON.parse(ajax.responseText);

    				if (response.id) {
    					$$invalidate(2, fileId = response.id);
    				}

    				if (response.token) {
    					$$invalidate(1, figmaToken = response.token);
    				}
    			}
    		};
    	};

    	onMount(() => {
    		getSavedCredentials();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input0_input_handler() {
    		figmaToken = this.value;
    		$$invalidate(1, figmaToken);
    	}

    	function input1_input_handler() {
    		fileId = this.value;
    		$$invalidate(2, fileId);
    	}

    	function input2_input_handler() {
    		nodeIds = this.value;
    		$$invalidate(3, nodeIds);
    	}

    	function input3_input_handler() {
    		depth = to_number(this.value);
    		$$invalidate(4, depth);
    	}

    	$$self.$capture_state = () => ({
    		baseUrl,
    		TreeView,
    		onMount,
    		CSSGenerator,
    		result,
    		figmaToken,
    		fileId,
    		nodeIds,
    		depth,
    		treeLoading,
    		handleSubmit,
    		getSavedCredentials
    	});

    	$$self.$inject_state = $$props => {
    		if ("result" in $$props) $$invalidate(0, result = $$props.result);
    		if ("figmaToken" in $$props) $$invalidate(1, figmaToken = $$props.figmaToken);
    		if ("fileId" in $$props) $$invalidate(2, fileId = $$props.fileId);
    		if ("nodeIds" in $$props) $$invalidate(3, nodeIds = $$props.nodeIds);
    		if ("depth" in $$props) $$invalidate(4, depth = $$props.depth);
    		if ("treeLoading" in $$props) $$invalidate(5, treeLoading = $$props.treeLoading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		result,
    		figmaToken,
    		fileId,
    		nodeIds,
    		depth,
    		treeLoading,
    		handleSubmit,
    		getSavedCredentials,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
