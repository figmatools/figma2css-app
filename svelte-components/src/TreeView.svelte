<script>
    export let treeData = '';
    import { afterUpdate } from 'svelte';
    let tree = '';

    const generateTreeview = (data) => {
        let treeString = `<div id="tree">`;
        if(!data) {
            console.log("Error building treeview: invalid data");
            return;
        }
        if(data.type === "ERROR") {
            tree = data.msg;
            return;
        }

        let root = data.document;
        let children = root.children;
        if(children) {
            treeString += `<ul>`;
            for(let child of children) {
                treeString += generateTreeviewRecursive(child);
            }
            treeString += `</ul>`;
        }
        treeString += `</div>`;

        tree = treeString;
    }

    const generateTreeviewRecursive = (child) => {
        let treeString = `<li data-child-id="${child.id}" data-child-type="${child.type}"><span class="accordionControl">${child.name}</span>`
        let children = child.children;
        if(children) {
            treeString += `<ul>`;
            for(let child of children) {
                treeString += generateTreeviewRecursive(child);
            }
            treeString += `</ul>`;
        }
        treeString += `</li>`

        return treeString;
    }

    const toggleChildrenDisplay = (element) => {
        console.log("hi");
        let childrenNodes = element.parentNode.querySelectorAll("li");
        for(let child of childrenNodes) {
            child.classList.toggle("expanded");
        }
    };

    afterUpdate(() => {
        let accordionControls = document.querySelectorAll(".accordionControl");
        for(let control of accordionControls) {
            control.addEventListener("click", (evt) => {
                toggleChildrenDisplay(evt.target);
            })
        }
    });

    $: generateTreeview(treeData);
</script>

<div id="treeview">
    {@html tree}
</div>

<style>
</style>
