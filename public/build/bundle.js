
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /* src/Node.svelte generated by Svelte v3.23.0 */

    const file = "src/Node.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (14:28) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("↓");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(14:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#if data.isOpen}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("↑");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(14:4) {#if data.isOpen}",
    		ctx
    	});

    	return block;
    }

    // (18:2) {#if data.children}
    function create_if_block(ctx) {
    	let ul;
    	let ul_class_value;
    	let current;
    	let each_value = /*data*/ ctx[0].children;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", ul_class_value = "list pa0 pl3 " + (/*data*/ ctx[0].isOpen ? "db" : "dn"));
    			add_location(ul, file, 18, 4, 514);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				each_value = /*data*/ ctx[0].children;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*data*/ 1 && ul_class_value !== (ul_class_value = "list pa0 pl3 " + (/*data*/ ctx[0].isOpen ? "db" : "dn"))) {
    				attr_dev(ul, "class", ul_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:2) {#if data.children}",
    		ctx
    	});

    	return block;
    }

    // (20:6) {#each data.children as child}
    function create_each_block(ctx) {
    	let current;

    	const node = new Node({
    			props: {
    				data: /*child*/ ctx[5],
    				isParentChecked: /*data*/ ctx[0].isChecked
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(node.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(node, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const node_changes = {};
    			if (dirty & /*data*/ 1) node_changes.data = /*child*/ ctx[5];
    			if (dirty & /*data*/ 1) node_changes.isParentChecked = /*data*/ ctx[0].isChecked;
    			node.$set(node_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(node.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(node.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(node, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(20:6) {#each data.children as child}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let li;
    	let span0;
    	let span0_class_value;
    	let t0;
    	let span1;
    	let input;
    	let t1;
    	let span2;
    	let t2_value = /*data*/ ctx[0].name + "";
    	let t2;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].isOpen) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*data*/ ctx[0].children && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			span0 = element("span");
    			if_block0.c();
    			t0 = space();
    			span1 = element("span");
    			input = element("input");
    			t1 = space();
    			span2 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(span0, "class", span0_class_value = "pointer " + (/*data*/ ctx[0].children ? "o-100" : "o-0"));
    			add_location(span0, file, 10, 2, 248);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file, 15, 8, 402);
    			add_location(span1, file, 15, 2, 396);
    			add_location(span2, file, 16, 2, 463);
    			attr_dev(li, "class", "list");
    			add_location(li, file, 9, 0, 228);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span0);
    			if_block0.m(span0, null);
    			append_dev(li, t0);
    			append_dev(li, span1);
    			append_dev(span1, input);
    			input.checked = /*data*/ ctx[0].isChecked;
    			append_dev(li, t1);
    			append_dev(li, span2);
    			append_dev(span2, t2);
    			append_dev(li, t3);
    			if (if_block1) if_block1.m(li, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*toggleOpen*/ ctx[1], false, false, false),
    					listen_dev(input, "change", /*input_change_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(span0, null);
    				}
    			}

    			if (!current || dirty & /*data*/ 1 && span0_class_value !== (span0_class_value = "pointer " + (/*data*/ ctx[0].children ? "o-100" : "o-0"))) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*data*/ 1) {
    				input.checked = /*data*/ ctx[0].isChecked;
    			}

    			if ((!current || dirty & /*data*/ 1) && t2_value !== (t2_value = /*data*/ ctx[0].name + "")) set_data_dev(t2, t2_value);

    			if (/*data*/ ctx[0].children) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*data*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(li, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
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
    	let { data } = $$props;
    	let { isParentChecked } = $$props;
    	const toggleOpen = () => $$invalidate(0, data.isOpen = !data.isOpen, data);
    	const isChecked = isParentChecked => $$invalidate(0, data.isChecked = isParentChecked, data);
    	const writable_props = ["data", "isParentChecked"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Node> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Node", $$slots, []);

    	function input_change_handler() {
    		data.isChecked = this.checked;
    		$$invalidate(0, data);
    	}

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("isParentChecked" in $$props) $$invalidate(2, isParentChecked = $$props.isParentChecked);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		isParentChecked,
    		toggleOpen,
    		isChecked
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("isParentChecked" in $$props) $$invalidate(2, isParentChecked = $$props.isParentChecked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isParentChecked*/ 4) {
    			 isChecked(isParentChecked);
    		}
    	};

    	return [data, toggleOpen, isParentChecked, isChecked, input_change_handler];
    }

    class Node extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { data: 0, isParentChecked: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Node",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Node> was created without expected prop 'data'");
    		}

    		if (/*isParentChecked*/ ctx[2] === undefined && !("isParentChecked" in props)) {
    			console.warn("<Node> was created without expected prop 'isParentChecked'");
    		}
    	}

    	get data() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isParentChecked() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isParentChecked(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TreeView.svelte generated by Svelte v3.23.0 */
    const file$1 = "src/TreeView.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (22:2) {#each roots as root}
    function create_each_block$1(ctx) {
    	let current;

    	const node = new Node({
    			props: {
    				data: /*root*/ ctx[3],
    				isParentChecked: /*root*/ ctx[3].isChecked
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(node.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(node, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const node_changes = {};
    			if (dirty & /*roots*/ 1) node_changes.data = /*root*/ ctx[3];
    			if (dirty & /*roots*/ 1) node_changes.isParentChecked = /*root*/ ctx[3].isChecked;
    			node.$set(node_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(node.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(node.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(node, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(22:2) {#each roots as root}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ul;
    	let current;
    	let each_value = /*roots*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "list pa0 pl3");
    			add_location(ul, file$1, 20, 0, 482);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*roots*/ 1) {
    				each_value = /*roots*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { treeData = "" } = $$props;
    	let roots = [];

    	const loadData = data => {
    		if (!data) return;

    		let transformTreeView = child => {
    			child.isOpen = true;
    			child.isChecked = false;
    			if (child.children) child.children = child.children.map(child => transformTreeView(child));
    			return child;
    		};

    		$$invalidate(0, roots = data.document.children.map(child => transformTreeView(child)));
    	};

    	const writable_props = ["treeData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TreeView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TreeView", $$slots, []);

    	$$self.$set = $$props => {
    		if ("treeData" in $$props) $$invalidate(1, treeData = $$props.treeData);
    	};

    	$$self.$capture_state = () => ({ Node, treeData, roots, loadData });

    	$$self.$inject_state = $$props => {
    		if ("treeData" in $$props) $$invalidate(1, treeData = $$props.treeData);
    		if ("roots" in $$props) $$invalidate(0, roots = $$props.roots);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*treeData*/ 2) {
    			 loadData(treeData);
    		}
    	};

    	return [roots, treeData];
    }

    class TreeView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { treeData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TreeView",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get treeData() {
    		throw new Error("<TreeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set treeData(value) {
    		throw new Error("<TreeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Input.svelte generated by Svelte v3.23.0 */

    const file$2 = "src/Input.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let label_1;
    	let t0;
    	let t1;
    	let input;
    	let input_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			input = element("input");
    			attr_dev(label_1, "class", "mb2");
    			add_location(label_1, file$2, 8, 2, 143);
    			attr_dev(input, "class", input_class_value = `border-box h2 input-reset ba br2 b--moon-gray pa0 pl2 ${/*css*/ ctx[2]}`);
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			input.required = true;
    			add_location(input, file$2, 9, 2, 180);
    			attr_dev(div, "class", "flex flex-column mr3 f7 w4");
    			add_location(div, file$2, 7, 0, 100);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label_1);
    			append_dev(label_1, t0);
    			append_dev(div, t1);
    			append_dev(div, input);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (dirty & /*css*/ 4 && input_class_value !== (input_class_value = `border-box h2 input-reset ba br2 b--moon-gray pa0 pl2 ${/*css*/ ctx[2]}`)) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*placeholder*/ 8) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
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
    	let { label } = $$props;
    	let { value } = $$props;
    	let { css } = $$props;
    	let { placeholder } = $$props;
    	const writable_props = ["label", "value", "css", "placeholder"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Input", $$slots, []);

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("css" in $$props) $$invalidate(2, css = $$props.css);
    		if ("placeholder" in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => ({ label, value, css, placeholder });

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("css" in $$props) $$invalidate(2, css = $$props.css);
    		if ("placeholder" in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, css, placeholder, input_input_handler];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			label: 1,
    			value: 0,
    			css: 2,
    			placeholder: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !("label" in props)) {
    			console.warn("<Input> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Input> was created without expected prop 'value'");
    		}

    		if (/*css*/ ctx[2] === undefined && !("css" in props)) {
    			console.warn("<Input> was created without expected prop 'css'");
    		}

    		if (/*placeholder*/ ctx[3] === undefined && !("placeholder" in props)) {
    			console.warn("<Input> was created without expected prop 'placeholder'");
    		}
    	}

    	get label() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Button.svelte generated by Svelte v3.23.0 */

    const file$3 = "src/Button.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(button, "type", /*type*/ ctx[1]);
    			attr_dev(button, "class", "bn bg-green white br2 h2 f7 w3 pointer");
    			add_location(button, file$3, 5, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);

    			if (dirty & /*type*/ 2) {
    				attr_dev(button, "type", /*type*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { text } = $$props;
    	let { type } = $$props;
    	const writable_props = ["text", "type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, []);

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({ text, type });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, type];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { text: 0, type: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<Button> was created without expected prop 'text'");
    		}

    		if (/*type*/ ctx[1] === undefined && !("type" in props)) {
    			console.warn("<Button> was created without expected prop 'type'");
    		}
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CSSGenerator.svelte generated by Svelte v3.23.0 */

    const file$4 = "src/CSSGenerator.svelte";

    function create_fragment$4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "generator");
    			add_location(div, file$4, 3, 0, 20);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CSSGenerator",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.0 */

    const { console: console_1 } = globals;
    const file$5 = "src/App.svelte";

    // (87:2) {#if loading}
    function create_if_block$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			attr_dev(img, "class", "w2 h2");
    			if (img.src !== (img_src_value = "https://i.ya-webdesign.com/images/loading-png-gif.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "loaging");
    			add_location(img, file$5, 88, 6, 2080);
    			attr_dev(div, "class", "fixed w-100 h-100 z-999 flex justify-center items-center");
    			add_location(div, file$5, 87, 4, 2003);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(87:2) {#if loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let header;
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let t3;
    	let div1;
    	let input2;
    	let input2_css_value;
    	let t4;
    	let p;
    	let t6;
    	let button;
    	let t8;
    	let div4;
    	let div2;
    	let t9;
    	let div3;
    	let textarea;
    	let t10;
    	let t11;
    	let footer;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*loading*/ ctx[1] && create_if_block$1(ctx);

    	const input0 = new Input({
    			props: {
    				label: "Figma Acess Token*",
    				value: /*figmaToken*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const input1 = new Input({
    			props: {
    				label: "File Id*",
    				value: /*fileId*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const treeview = new TreeView({
    			props: { treeData: /*data*/ ctx[2] },
    			$$inline: true
    		});

    	const cssgenerator = new CSSGenerator({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			div0 = element("div");
    			create_component(input0.$$.fragment);
    			t2 = space();
    			create_component(input1.$$.fragment);
    			t3 = space();
    			div1 = element("div");
    			input2 = element("input");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Choose the destination file(*.css), select the nodes in the treeview and click generate";
    			t6 = space();
    			button = element("button");
    			button.textContent = "generate";
    			t8 = space();
    			div4 = element("div");
    			div2 = element("div");
    			create_component(treeview.$$.fragment);
    			t9 = space();
    			div3 = element("div");
    			textarea = element("textarea");
    			t10 = space();
    			create_component(cssgenerator.$$.fragment);
    			t11 = space();
    			footer = element("footer");
    			add_location(header, file$5, 84, 2, 1962);
    			attr_dev(div0, "class", "flex items-end bb b--light-gray ph4 pv3");
    			add_location(div0, file$5, 94, 2, 2220);
    			attr_dev(input2, "css", input2_css_value = "border-box h2 input-reset ba br2 b--moon-gray pa0 pl2");
    			attr_dev(input2, "type", "file");
    			add_location(input2, file$5, 99, 4, 2474);
    			attr_dev(p, "class", "pa0 ma0 f7");
    			add_location(p, file$5, 101, 4, 2578);
    			attr_dev(button, "class", "bn bg-green white br2 h2 f7 w5 pointer");
    			add_location(button, file$5, 102, 4, 2696);
    			attr_dev(div1, "class", "flex items-center justify-between bb b--light-gray ph4 pv2");
    			add_location(div1, file$5, 98, 2, 2397);
    			attr_dev(div2, "class", "min-w6 bg-light-gray overflow-auto");
    			add_location(div2, file$5, 108, 4, 2866);
    			attr_dev(textarea, "class", "w-100 h-100");
    			add_location(textarea, file$5, 112, 6, 3021);
    			attr_dev(div3, "class", "w-100 h-100 pa3 flex justify-center");
    			add_location(div3, file$5, 111, 4, 2965);
    			attr_dev(div4, "class", "flex relative h-100 w-100");
    			add_location(div4, file$5, 107, 2, 2822);
    			add_location(footer, file$5, 116, 2, 3126);
    			add_location(main, file$5, 83, 0, 1953);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(main, t0);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			mount_component(input0, div0, null);
    			append_dev(div0, t2);
    			mount_component(input1, div0, null);
    			append_dev(main, t3);
    			append_dev(main, div1);
    			append_dev(div1, input2);
    			append_dev(div1, t4);
    			append_dev(div1, p);
    			append_dev(div1, t6);
    			append_dev(div1, button);
    			append_dev(main, t8);
    			append_dev(main, div4);
    			append_dev(div4, div2);
    			mount_component(treeview, div2, null);
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, textarea);
    			set_input_value(textarea, /*resultCss*/ ctx[5]);
    			append_dev(main, t10);
    			mount_component(cssgenerator, main, null);
    			append_dev(main, t11);
    			append_dev(main, footer);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[11]),
    					listen_dev(button, "click", /*generateCss*/ ctx[6], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[12])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*loading*/ ctx[1]) {
    				if (if_block) ; else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(main, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const input0_changes = {};
    			if (dirty & /*figmaToken*/ 8) input0_changes.value = /*figmaToken*/ ctx[3];
    			input0.$set(input0_changes);
    			const input1_changes = {};
    			if (dirty & /*fileId*/ 16) input1_changes.value = /*fileId*/ ctx[4];
    			input1.$set(input1_changes);
    			const treeview_changes = {};
    			if (dirty & /*data*/ 4) treeview_changes.treeData = /*data*/ ctx[2];
    			treeview.$set(treeview_changes);

    			if (dirty & /*resultCss*/ 32) {
    				set_input_value(textarea, /*resultCss*/ ctx[5]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(treeview.$$.fragment, local);
    			transition_in(cssgenerator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(treeview.$$.fragment, local);
    			transition_out(cssgenerator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(treeview);
    			destroy_component(cssgenerator);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let files;
    	let loading = false, data = "", figmaToken = "", fileId = "", resultCss;

    	const loadTreeView = async (fileId, figmaToken) => {
    		if (!fileId && !figmaToken) return;
    		$$invalidate(1, loading = true);

    		try {
    			$$invalidate(2, data = await (await fetch(`${baseUrl}/data?fileId=${fileId}&figmaToken=${figmaToken}`)).json());
    		} catch(err) {
    			console.error(err);
    		}

    		$$invalidate(1, loading = false);
    	};

    	const getCheckedIds = data => {
    		let checkedIds = [];
    		if (data.isChecked) checkedIds.push(data.id);

    		if (data.children) {
    			data.children.forEach(child => {
    				checkedIds = checkedIds.concat(getCheckedIds(child));
    			});
    		}

    		return checkedIds;
    	};

    	const getIds = data => {
    		let result = [];

    		data.forEach(child => {
    			result = getCheckedIds(child);
    		});

    		return result;
    	};

    	const generateCss = async () => {
    		if (!data) return;
    		$$invalidate(1, loading = true);
    		let checkedIds = getIds(data.document.children);
    		if (!checkedIds.length) return;

    		try {
    			$$invalidate(5, resultCss = await (await fetch(`${baseUrl}/css?figmaToken=${figmaToken}&fileId=${fileId}&nodeIds=${checkedIds.join(",")}&filePath=${files[0]}`)).text());
    		} catch(err) {
    			console.error(err);
    		}

    		$$invalidate(1, loading = false);
    	};

    	const getSavedCredentials = async () => {
    		$$invalidate(1, loading = true);

    		try {
    			let result = await fetch(`${baseUrl}/cached-credentials`);
    			result = await result.json();
    			$$invalidate(4, fileId = result.id);
    			$$invalidate(3, figmaToken = result.token);
    		} catch(err) {
    			console.error(err);
    		}

    		$$invalidate(1, loading = false);
    	};

    	onMount(async () => {
    		await getSavedCredentials();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input2_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	function textarea_input_handler() {
    		resultCss = this.value;
    		$$invalidate(5, resultCss);
    	}

    	$$self.$capture_state = () => ({
    		baseUrl,
    		TreeView,
    		Input,
    		Button,
    		onMount,
    		CSSGenerator,
    		files,
    		loading,
    		data,
    		figmaToken,
    		fileId,
    		resultCss,
    		loadTreeView,
    		getCheckedIds,
    		getIds,
    		generateCss,
    		getSavedCredentials
    	});

    	$$self.$inject_state = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    		if ("loading" in $$props) $$invalidate(1, loading = $$props.loading);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("figmaToken" in $$props) $$invalidate(3, figmaToken = $$props.figmaToken);
    		if ("fileId" in $$props) $$invalidate(4, fileId = $$props.fileId);
    		if ("resultCss" in $$props) $$invalidate(5, resultCss = $$props.resultCss);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*fileId, figmaToken*/ 24) {
    			 loadTreeView(fileId, figmaToken);
    		}
    	};

    	return [
    		files,
    		loading,
    		data,
    		figmaToken,
    		fileId,
    		resultCss,
    		generateCss,
    		loadTreeView,
    		getCheckedIds,
    		getIds,
    		getSavedCredentials,
    		input2_change_handler,
    		textarea_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
