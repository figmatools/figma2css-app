<script>
    export let treeData = '';
    export let requestLoading = '';
    import { afterUpdate, beforeUpdate } from 'svelte';
    let tree = '';
    let selectedNodes = [];

    let defaultLineHeight = 31; // in px
    let defaultCollapseTransitionTime = 500; // in milliseconds

    const generateTreeview = (data) => {
        tree = '';
        let treeString = `<div id="tree"><div class="treeTooltip">Click on elements to see their children.
                          <br>Click on the input beside them to select for CSS generation.</div>
                          <button type="button" id="generateCSS">Get CSS</button>`;
        if(!data) {
            return;
        }
        if(data.type === "ERROR") {
            tree = data.msg;
            return;
        }
        let nodes = data.nodes;
        for(let node in nodes) {
            let nodeRoot = nodes[node].document;
            let children = nodeRoot.children;
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
    };

    const generateTreeviewRecursive = (child) => {
        // TODO: only add accordionControl if has children;
        // TODO: accordion-control should be a downward arrow, add span before for child.name;
        // TODO: selectable childs for CSS generation;
        let children = child.children;
        let treeString = `<li class="${children ? 'isParent' : ''}" data-childrenAmmount="${children ? children.length.toString() : '0'}" data-child-id="${child.id}" data-child-type="${child.type}">
                            <span class="accordionControl">${child.name}</span>
                            <input type=checkbox class="selectionControl">
                            ${children ? "<input type=checkbox class='childSelectionControl'>" : ""}`
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

    const propagateLineHeightAdjustment = (element, isExpanding = true, offset = 0) => {
        let childrenAmmount = element.dataset.childrenammount;
        let listItemChildrenContainer = element.querySelector("ul");
        let heightAdjustment = childrenAmmount * defaultLineHeight;
        let containerList = element.parentNode.closest("li");
        if(containerList && containerList.classList.contains("isParent")) {
            propagateLineHeightAdjustment(containerList, isExpanding, heightAdjustment);
        }
        if(isExpanding) {
            listItemChildrenContainer.style.maxHeight = (listItemChildrenContainer.offsetHeight + heightAdjustment + offset) + "px";
        }
    }

    const propagateCollapse = (element) => {
        let openChildren = element.querySelectorAll("ul.open");
        for(let child of openChildren) {
            child.classList.remove("open");
            child.style.maxHeight = "0px";
        }
    }

    const toggleChildrenDisplay = (element) => {
        let clickedListItem = element.parentNode;
        let listItemChildrenContainer = clickedListItem.querySelector("ul");
        let listItemChildrenAmount = clickedListItem.dataset.childrenammount;
        if(listItemChildrenContainer) {
            if (listItemChildrenContainer.classList.toggle("open")) {
                listItemChildrenContainer.style.maxHeight = (defaultLineHeight * listItemChildrenAmount) + "px";
                propagateLineHeightAdjustment(clickedListItem, true);
            } else {
                listItemChildrenContainer.style.maxHeight = "0px";
                propagateLineHeightAdjustment(clickedListItem, false);
                propagateCollapse(clickedListItem);
            }
        }
    };

    const propagateSelectedCount = (element, value) =>{
        let ul = element.closest('ul');
        if(ul){
            let span = ul.parentElement.querySelector(":scope > span");
            if(span){
                if(!span.dataset.selectedCount){
                    span.dataset.selectedCount = "0";
                }
                span.dataset.selectedCount = parseInt(span.dataset.selectedCount)+value;
                propagateSelectedCount(ul.parentElement,value)
            }
        }
    };

    const selectElement = (element) =>{
        selectedNodes.push(element.parentNode.dataset.childId);
    };

    const deselectElement = (element) =>{
        let id = element.parentNode.dataset.childId;
        let index = selectedNodes.indexOf(id);
        selectedNodes.splice(index, 1);
    };

    const toggleAllChildren = (element) => {
        let ul = element.parentNode.querySelector(":scope > ul");
        let liList = ul.children;
        let children;
        for(let i = 0; i < liList.length; i++){
            children = liList[i].children;
            for (let j = 0; j < children.length; j++){
                if (children[j].className == 'selectionControl'){
                    toggleElementSelected(children[j])
                }
                if (children[j].className == 'childSelectionControl'){
                    children[j].checked = !children[j].checked;
                    toggleAllChildren(children[j])
                }
            }
        }
    };

    const toggleElementSelected = (element) => {
        let span = element.closest('ul').parentElement.querySelector(":scope > span");
        if(span) {
            if (!span.dataset.selectedCount) {
                span.dataset.selectedCount = "0";
            }
        }
            if (element.parentNode.dataset.selected == 'true') {
                element.parentNode.dataset.selected = ('false');
                element.checked = false;
                deselectElement(element);
                propagateSelectedCount(element, -1)
            } else {
                element.parentNode.dataset.selected = ('true');
                element.checked = true;
                selectElement(element);
                propagateSelectedCount(element, 1)
            }
    };

    const defineLineWidth = () => {
        console.log("defining line width");
        let lines = document.querySelectorAll("span.accordionControl");
        let largestLineWidth = 0;
        let largestLine;
        console.log(lines);
        for(let line of lines) {
            if(line.offsetWidth > largestLineWidth) {
                largestLine = line;
                largestLineWidth = line.offsetWidth;
            }
        }
        console.log(largestLineWidth);
        console.log(largestLine);
        for(let line of lines) {
            line.style.width = largestLineWidth + "px";
            line.style.display = "inline-block";
        }
    }

    afterUpdate(() => {
        let accordionControls = document.querySelectorAll(".accordionControl");
        let selectionControls = document.querySelectorAll(".selectionControl");
        let childSelectionControl = document.querySelectorAll('.childSelectionControl');
        for(let control of accordionControls) {
            control.addEventListener("click", (evt) => {
                toggleChildrenDisplay(evt.target);
            })
        }
        for(let control of selectionControls) {
            control.addEventListener("click", (evt) => {
                toggleElementSelected(evt.target);
            })
        }
        for(let control of childSelectionControl){
            control.addEventListener("click", (evt) => {
                toggleAllChildren(evt.target);
            })
        }
        defineLineWidth();
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
    #treeview {
        position: relative;
    }

    .lds-ring:not(.active) {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    .lds-ring {
        opacity: 1;
        transition: opacity 0.5s ease;
        display: inline-block;
        position: fixed;
        top: 50%;
        left: calc(50% - 40px);
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
