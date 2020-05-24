<script>
    export let treeData = '';
    export let requestLoading = '';
    import { afterUpdate, beforeUpdate } from 'svelte';
    let tree = '';

    const generateTreeview = (data) => {
        tree = '';
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
    };

    const generateTreeviewRecursive = (child) => {
        // TODO: only add accordionControl if has children;
        // TODO: ul list style is none, add image before li according to data-child-type (map child types first);
        // TODO: accordion-control should be a downward arrow, add span before for child.name;
        // TODO: selectable childs for CSS generation;
        let treeString = `<li data-child-id="${child.id}" data-child-type="${child.type}"><span class="accordionControl">${child.name}</span>`;
        let children = child.children;
        if(children) {
            treeString += `<ul>`;
            for(let child of children) {
                treeString += generateTreeviewRecursive(child);
            }
            treeString += `</ul>`;
        }
        treeString += `</li>`;

        return treeString;
    };

    const toggleChildrenDisplay = (element) => {
        let childrenNodes = element.parentNode.querySelectorAll("li");
        for(let child of childrenNodes) {
            child.classList.toggle("expanded");
        }
    };

    const toggleElementSelected = (element) => {
        let span = element.closest('ul').parentElement.firstChild;
        if(!span.dataset.selectedCount){
            span.dataset.selectedCount = "0";
        }
        if (element.parentNode.dataset.selected  == 'true'){
            element.parentNode.dataset.selected = ('false');
            span.dataset.selectedCount = parseInt(span.dataset.selectedCount)-1;
        }else{
            element.parentNode.dataset.selected = ('true');
            span.dataset.selectedCount = parseInt(span.dataset.selectedCount)+1;
        }
    };

    afterUpdate(() => {
        let accordionControls = document.querySelectorAll(".accordionControl");
        for(let control of accordionControls) {
            control.addEventListener("click", (evt) => {
                toggleChildrenDisplay(evt.target);
                toggleElementSelected(evt.target);
            })
        }
    });

    beforeUpdate(() =>{
        let accordionControls = document.querySelectorAll(".accordionControl");
        for(let control of accordionControls) {
            control.removeEventListener("click");
        }
    });

    $: generateTreeview(treeData);
</script>

<div id="treeview">
    {@html tree}
    <div class="lds-ring" class:active={requestLoading}><div></div><div></div><div></div><div></div></div>
</div>

<style>
    .lds-ring:not(.active) {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    .lds-ring {
        margin-top: 50px;
        opacity: 1;
        transition: opacity 0.5s ease;
        display: inline-block;
        position: relative;
        width: 80px;
        height: 80px;
    }
    .lds-ring div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 64px;
        height: 64px;
        margin: 8px;
        border: 8px solid #fff;
        border-radius: 50%;
        animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: #fff transparent transparent transparent;
    }
    .lds-ring div:nth-child(1) {
        animation-delay: -0.45s;
    }
    .lds-ring div:nth-child(2) {
        animation-delay: -0.3s;
    }
    .lds-ring div:nth-child(3) {
        animation-delay: -0.15s;
    }
    @keyframes lds-ring {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
