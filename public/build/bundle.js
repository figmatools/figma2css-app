
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
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
    			add_location(ul, file, 18, 4, 541);
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
    			add_location(span0, file, 10, 2, 251);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file, 15, 8, 405);
    			add_location(span1, file, 15, 2, 399);
    			attr_dev(span2, "class", "w4 dib truncate");
    			add_location(span2, file, 16, 2, 466);
    			attr_dev(li, "class", "list w7");
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
    	let t2;
    	let p;
    	let t3;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[2]);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			p = element("p");
    			t3 = text(/*error*/ ctx[4]);
    			attr_dev(label_1, "class", "mb2");
    			add_location(label_1, file$2, 10, 2, 188);
    			attr_dev(input, "id", /*id*/ ctx[1]);
    			attr_dev(input, "class", input_class_value = `border-box h2 input-reset ba br2 b--moon-gray pa0 pl2`);
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			input.required = true;
    			add_location(input, file$2, 11, 2, 225);
    			attr_dev(p, "classname", "ma0 pt1");
    			add_location(p, file$2, 13, 2, 367);
    			attr_dev(div, "class", div_class_value = `flex flex-column mr3 f7 w6 ${/*css*/ ctx[5]}`);
    			add_location(div, file$2, 9, 0, 136);
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
    			append_dev(div, t2);
    			append_dev(div, p);
    			append_dev(p, t3);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[6]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 4) set_data_dev(t0, /*label*/ ctx[2]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*placeholder*/ 8) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (dirty & /*error*/ 16) set_data_dev(t3, /*error*/ ctx[4]);

    			if (dirty & /*css*/ 32 && div_class_value !== (div_class_value = `flex flex-column mr3 f7 w6 ${/*css*/ ctx[5]}`)) {
    				attr_dev(div, "class", div_class_value);
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
    	let { id } = $$props;
    	let { label } = $$props;
    	let { value } = $$props;
    	let { placeholder } = $$props;
    	let { error } = $$props;
    	let { css } = $$props;
    	const writable_props = ["id", "label", "value", "placeholder", "error", "css"];

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
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("placeholder" in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    		if ("error" in $$props) $$invalidate(4, error = $$props.error);
    		if ("css" in $$props) $$invalidate(5, css = $$props.css);
    	};

    	$$self.$capture_state = () => ({
    		id,
    		label,
    		value,
    		placeholder,
    		error,
    		css
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("placeholder" in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    		if ("error" in $$props) $$invalidate(4, error = $$props.error);
    		if ("css" in $$props) $$invalidate(5, css = $$props.css);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, id, label, placeholder, error, css, input_input_handler];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			id: 1,
    			label: 2,
    			value: 0,
    			placeholder: 3,
    			error: 4,
    			css: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<Input> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[2] === undefined && !("label" in props)) {
    			console.warn("<Input> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Input> was created without expected prop 'value'");
    		}

    		if (/*placeholder*/ ctx[3] === undefined && !("placeholder" in props)) {
    			console.warn("<Input> was created without expected prop 'placeholder'");
    		}

    		if (/*error*/ ctx[4] === undefined && !("error" in props)) {
    			console.warn("<Input> was created without expected prop 'error'");
    		}

    		if (/*css*/ ctx[5] === undefined && !("css" in props)) {
    			console.warn("<Input> was created without expected prop 'css'");
    		}
    	}

    	get id() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CSSGenerator.svelte generated by Svelte v3.23.0 */

    const file$3 = "src/CSSGenerator.svelte";

    function create_fragment$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "generator");
    			add_location(div, file$3, 3, 0, 20);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CSSGenerator",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.0 */

    const { console: console_1 } = globals;
    const file$4 = "src/App.svelte";

    // (195:2) {#if loading}
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
    			attr_dev(img, "alt", "loading");
    			add_location(img, file$4, 196, 6, 4520);
    			attr_dev(div, "class", "bg-white-50 fixed w-100 h-100 z-999 flex justify-center items-center");
    			add_location(div, file$4, 195, 4, 4431);
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
    		source: "(195:2) {#if loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let header;
    	let t0;
    	let t1;
    	let div1;
    	let div0;
    	let updating_value;
    	let t2;
    	let updating_value_1;
    	let t3;
    	let button0;
    	let t5;
    	let div3;
    	let updating_value_2;
    	let t6;
    	let p;
    	let t8;
    	let div2;
    	let button1;
    	let t10;
    	let button2;
    	let t11_value = (/*isWatching*/ ctx[1] ? "Stop Watching!" : "Watch") + "";
    	let t11;
    	let button2_class_value;
    	let t12;
    	let div6;
    	let div4;
    	let t13;
    	let div5;
    	let textarea;
    	let t14;
    	let t15;
    	let footer;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*loading*/ ctx[2] && create_if_block$1(ctx);

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[26].call(null, value);
    	}

    	let input0_props = {
    		id: "figmaToken",
    		label: "Figma Access Token*",
    		placeholder: "Figma Access Token",
    		error: /*figmaTokenError*/ ctx[8]
    	};

    	if (/*figmaToken*/ ctx[4] !== void 0) {
    		input0_props.value = /*figmaToken*/ ctx[4];
    	}

    	const input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[27].call(null, value);
    	}

    	let input1_props = {
    		css: "ew8",
    		id: "fileURL",
    		label: "File URL*",
    		placeholder: "File URL*",
    		error: /*fileURLError*/ ctx[7]
    	};

    	if (/*fileURL*/ ctx[5] !== void 0) {
    		input1_props.value = /*fileURL*/ ctx[5];
    	}

    	const input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[28].call(null, value);
    	}

    	let input2_props = {
    		css: "ew8",
    		id: "output-path",
    		label: "Full Output Path",
    		placeholder: "Full Output Path",
    		error: /*outputPathError*/ ctx[9]
    	};

    	if (/*filePath*/ ctx[0] !== void 0) {
    		input2_props.value = /*filePath*/ ctx[0];
    	}

    	const input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	const treeview = new TreeView({
    			props: { treeData: /*treeData*/ ctx[3] },
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
    			div1 = element("div");
    			div0 = element("div");
    			create_component(input0.$$.fragment);
    			t2 = space();
    			create_component(input1.$$.fragment);
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Load Data";
    			t5 = space();
    			div3 = element("div");
    			create_component(input2.$$.fragment);
    			t6 = space();
    			p = element("p");
    			p.textContent = "Select the css file output, select the nodes in the treeview and click generate";
    			t8 = space();
    			div2 = element("div");
    			button1 = element("button");
    			button1.textContent = "Generate CSS";
    			t10 = space();
    			button2 = element("button");
    			t11 = text(t11_value);
    			t12 = space();
    			div6 = element("div");
    			div4 = element("div");
    			create_component(treeview.$$.fragment);
    			t13 = space();
    			div5 = element("div");
    			textarea = element("textarea");
    			t14 = space();
    			create_component(cssgenerator.$$.fragment);
    			t15 = space();
    			footer = element("footer");
    			add_location(header, file$4, 192, 2, 4390);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$4, 203, 4, 4730);
    			attr_dev(button0, "class", "bn bg-green white br2 h2 f7 w4 pointer");
    			add_location(button0, file$4, 212, 4, 5079);
    			attr_dev(div1, "class", "flex justify-between items-center bb b--light-gray ph4 pv3");
    			add_location(div1, file$4, 202, 2, 4653);
    			attr_dev(p, "class", "pa0 ma0 f7");
    			add_location(p, file$4, 221, 4, 5444);
    			attr_dev(button1, "class", "mr3 bn bg-green white br2 h2 f7 w4 pointer");
    			add_location(button1, file$4, 223, 6, 5579);
    			attr_dev(button2, "class", button2_class_value = `${/*isWatching*/ ctx[1] ? "bg-red" : "bg-green"} bn white br2 h2 f7 w4 pointer`);
    			add_location(button2, file$4, 227, 6, 5710);
    			attr_dev(div2, "class", "flex");
    			add_location(div2, file$4, 222, 4, 5554);
    			attr_dev(div3, "class", "flex items-center justify-between bb b--light-gray ph4 pv2");
    			add_location(div3, file$4, 216, 2, 5200);
    			attr_dev(div4, "class", "w7 bg-light-gray overflow-auto");
    			add_location(div4, file$4, 234, 4, 5954);
    			attr_dev(textarea, "class", "w-100 h-100");
    			add_location(textarea, file$4, 238, 6, 6109);
    			attr_dev(div5, "class", "w-100 h-100 pa3 flex justify-center");
    			add_location(div5, file$4, 237, 4, 6053);
    			attr_dev(div6, "class", "flex relative h-100 w-100");
    			add_location(div6, file$4, 233, 2, 5910);
    			add_location(footer, file$4, 242, 2, 6214);
    			add_location(main, file$4, 191, 0, 4381);
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
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			mount_component(input0, div0, null);
    			append_dev(div0, t2);
    			mount_component(input1, div0, null);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(main, t5);
    			append_dev(main, div3);
    			mount_component(input2, div3, null);
    			append_dev(div3, t6);
    			append_dev(div3, p);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			append_dev(div2, t10);
    			append_dev(div2, button2);
    			append_dev(button2, t11);
    			append_dev(main, t12);
    			append_dev(main, div6);
    			append_dev(div6, div4);
    			mount_component(treeview, div4, null);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, textarea);
    			set_input_value(textarea, /*resultCss*/ ctx[6]);
    			append_dev(main, t14);
    			mount_component(cssgenerator, main, null);
    			append_dev(main, t15);
    			append_dev(main, footer);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*loadTreeView*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*generate*/ ctx[12], false, false, false),
    					listen_dev(button2, "click", /*watch*/ ctx[11], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[29])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*loading*/ ctx[2]) {
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

    			if (!updating_value && dirty & /*figmaToken*/ 16) {
    				updating_value = true;
    				input0_changes.value = /*figmaToken*/ ctx[4];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};
    			if (dirty & /*fileURLError*/ 128) input1_changes.error = /*fileURLError*/ ctx[7];

    			if (!updating_value_1 && dirty & /*fileURL*/ 32) {
    				updating_value_1 = true;
    				input1_changes.value = /*fileURL*/ ctx[5];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty & /*filePath*/ 1) {
    				updating_value_2 = true;
    				input2_changes.value = /*filePath*/ ctx[0];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    			if ((!current || dirty & /*isWatching*/ 2) && t11_value !== (t11_value = (/*isWatching*/ ctx[1] ? "Stop Watching!" : "Watch") + "")) set_data_dev(t11, t11_value);

    			if (!current || dirty & /*isWatching*/ 2 && button2_class_value !== (button2_class_value = `${/*isWatching*/ ctx[1] ? "bg-red" : "bg-green"} bn white br2 h2 f7 w4 pointer`)) {
    				attr_dev(button2, "class", button2_class_value);
    			}

    			const treeview_changes = {};
    			if (dirty & /*treeData*/ 8) treeview_changes.treeData = /*treeData*/ ctx[3];
    			treeview.$set(treeview_changes);

    			if (dirty & /*resultCss*/ 64) {
    				set_input_value(textarea, /*resultCss*/ ctx[6]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(treeview.$$.fragment, local);
    			transition_in(cssgenerator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(treeview.$$.fragment, local);
    			transition_out(cssgenerator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(treeview);
    			destroy_component(cssgenerator);
    			mounted = false;
    			run_all(dispose);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let filePath = "";
    	let isWatching = false;

    	let loading = false,
    		treeData = "",
    		data = "",
    		figmaToken = "",
    		fileURL = "",
    		resultCss;

    	let figmaTokenError = "", fileURLError = "", outputPathError = "";

    	const extractFileId = fileURL => {
    		let result = fileURL.match(/file\/(.*?)\//);
    		if (result[1]) return result[1]; else return false;
    	};

    	const isURLValid = fileURL => {
    		let result = fileURL.match(/file\/(.*?)\//);
    		if (result[1]) return true; else return false;
    	};

    	const loadData = async () => {
    		saveInputValuesInLocalStorage();

    		try {
    			data = await (await fetch(`${baseUrl}/data?fileURL=${fileURL}&figmaToken=${figmaToken}&writeData=true`)).json();
    			return data;
    		} catch(err) {
    			console.error(err);
    		}
    	};

    	const loadTreeView = async () => {
    		if (!fileURL || !figmaToken) return;
    		$$invalidate(2, loading = true);
    		$$invalidate(3, treeData = await loadData());
    		$$invalidate(2, loading = false);
    	};

    	const getCheckedIds = data => {
    		let checkedIds = [];
    		if (data.isChecked) checkedIds.push(data);

    		if (data.children) {
    			data.children.forEach(child => {
    				checkedIds = checkedIds.concat(getCheckedIds(child));
    			});
    		}

    		return checkedIds;
    	};

    	const testFileName = name => {
    		let regex = new RegExp(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$|([<>:"\\/\\\\|?*])|(\\.|\\s)$/ig);
    		return !regex.test(name);
    	};

    	const getCheckedNodes = data => {
    		let result = [];

    		data.forEach(child => {
    			result = getCheckedIds(child);
    		});

    		return result;
    	};

    	let lastModified = new Date("1900-05-24T02:34:14.475592Z");
    	let watchInterval = false;

    	const watch = async () => {
    		if (isWatching) {
    			clearInterval(watchInterval);
    			$$invalidate(1, isWatching = false);
    			return;
    		}

    		let i = 0;
    		$$invalidate(1, isWatching = true);

    		watchInterval = setInterval(
    			async () => {
    				if (i < 1) {
    					i++;
    					return;
    				}

    				if (await shouldUpdateData()) {
    					$$invalidate(2, loading = true);
    					await loadData();
    					await generateCss();
    					$$invalidate(2, loading = false);
    				}
    			},
    			1000
    		);
    	};

    	const shouldUpdateData = async () => {
    		if (!fileURL) {
    			$$invalidate(7, fileURLError = "Invalid file");
    			return;
    		}

    		try {
    			let result = await (await fetch(`${baseUrl}/data?figmaToken=${figmaToken}&fileURL=${fileURL}&depth=1&writeData=false`)).json();
    			let currentLastModified = new Date(result.lastModified);

    			if (currentLastModified > lastModified) {
    				lastModified = currentLastModified;
    				return true;
    			} else {
    				return false;
    			}
    		} catch(err) {
    			console.error(err);
    			return false;
    		}
    	};

    	const generate = async () => {
    		$$invalidate(2, loading = true);

    		if (await shouldUpdateData()) {
    			await loadData();
    		}

    		await generateCss();
    		$$invalidate(2, loading = false);
    	};

    	const generateCss = async () => {
    		if (!data) return;
    		let checkedNodes = getCheckedNodes(treeData.document.children);

    		if (!checkedNodes.length) {
    			console.error("No checked items!");
    			return;
    		}

    		let url = `${baseUrl}/css`;
    		if (filePath) url += `?filePath=${filePath}`;

    		try {
    			$$invalidate(6, resultCss = await (await fetch(url, {
    				method: "post",
    				headers: {
    					"Accept": "application/json",
    					"Content-Type": "application/json"
    				},
    				body: JSON.stringify({ ids: checkedNodes.map(node => node.id) })
    			})).text());
    		} catch(err) {
    			console.error(err);
    		}
    	};

    	const saveInputValuesInLocalStorage = () => {
    		window.localStorage.setItem("figmaToken", figmaToken);
    		window.localStorage.setItem("fileURL", fileURL);
    		window.localStorage.setItem("filePath", filePath);
    	};

    	const loadCachedValues = () => {
    		$$invalidate(4, figmaToken = window.localStorage.getItem("figmaToken"));
    		$$invalidate(5, fileURL = window.localStorage.getItem("fileURL"));
    		$$invalidate(0, filePath = window.localStorage.getItem("filePath"));
    		return { figmaToken, fileURL, filePath };
    	};

    	onMount(async () => {
    		loadCachedValues();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input0_value_binding(value) {
    		figmaToken = value;
    		$$invalidate(4, figmaToken);
    	}

    	function input1_value_binding(value) {
    		fileURL = value;
    		$$invalidate(5, fileURL);
    	}

    	function input2_value_binding(value) {
    		filePath = value;
    		$$invalidate(0, filePath);
    	}

    	function textarea_input_handler() {
    		resultCss = this.value;
    		$$invalidate(6, resultCss);
    	}

    	$$self.$capture_state = () => ({
    		baseUrl,
    		TreeView,
    		Input,
    		onMount,
    		CSSGenerator,
    		filePath,
    		isWatching,
    		loading,
    		treeData,
    		data,
    		figmaToken,
    		fileURL,
    		resultCss,
    		figmaTokenError,
    		fileURLError,
    		outputPathError,
    		extractFileId,
    		isURLValid,
    		loadData,
    		loadTreeView,
    		getCheckedIds,
    		testFileName,
    		getCheckedNodes,
    		lastModified,
    		watchInterval,
    		watch,
    		shouldUpdateData,
    		generate,
    		generateCss,
    		saveInputValuesInLocalStorage,
    		loadCachedValues
    	});

    	$$self.$inject_state = $$props => {
    		if ("filePath" in $$props) $$invalidate(0, filePath = $$props.filePath);
    		if ("isWatching" in $$props) $$invalidate(1, isWatching = $$props.isWatching);
    		if ("loading" in $$props) $$invalidate(2, loading = $$props.loading);
    		if ("treeData" in $$props) $$invalidate(3, treeData = $$props.treeData);
    		if ("data" in $$props) data = $$props.data;
    		if ("figmaToken" in $$props) $$invalidate(4, figmaToken = $$props.figmaToken);
    		if ("fileURL" in $$props) $$invalidate(5, fileURL = $$props.fileURL);
    		if ("resultCss" in $$props) $$invalidate(6, resultCss = $$props.resultCss);
    		if ("figmaTokenError" in $$props) $$invalidate(8, figmaTokenError = $$props.figmaTokenError);
    		if ("fileURLError" in $$props) $$invalidate(7, fileURLError = $$props.fileURLError);
    		if ("outputPathError" in $$props) $$invalidate(9, outputPathError = $$props.outputPathError);
    		if ("lastModified" in $$props) lastModified = $$props.lastModified;
    		if ("watchInterval" in $$props) watchInterval = $$props.watchInterval;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		filePath,
    		isWatching,
    		loading,
    		treeData,
    		figmaToken,
    		fileURL,
    		resultCss,
    		fileURLError,
    		figmaTokenError,
    		outputPathError,
    		loadTreeView,
    		watch,
    		generate,
    		data,
    		lastModified,
    		watchInterval,
    		extractFileId,
    		isURLValid,
    		loadData,
    		getCheckedIds,
    		testFileName,
    		getCheckedNodes,
    		shouldUpdateData,
    		generateCss,
    		saveInputValuesInLocalStorage,
    		loadCachedValues,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		textarea_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
