window.onload = () => {
    document.getElementById("generateForm").addEventListener('submit', (evt) => {
        evt.preventDefault();
    });
    document.getElementById("generateButton").addEventListener('click', async (evt) => {
        let fileId = document.getElementById("fileId").value;
        let accessToken = document.getElementById("figmaAccessToken").value;
        let ajax = new XMLHttpRequest();
        ajax.open("GET", `/data?fileId=${fileId}&figmaAccessToken=${accessToken}`, true);
        ajax.send();
        ajax.onreadystatechange = () => {
            if (ajax.readyState === 4 && ajax.status === 200) {
                document.getElementById("treeview").innerHTML = generateTreeview(JSON.parse(ajax.responseText));
            }
            else {
                document.getElementById("treeview").innerHTML = "Request Error! Please check file ID and access token :)";
            }
        }
    });
};

const generateTreeview = (data) => {
    let treeString = `<div id="tree">`;
    if(!data) {
        console.log("Error building treeview: invalid data");
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

    return treeString;
}

const generateTreeviewRecursive = (child) => {
    let treeString = `<li data-child-id="${child.id}" data-child-type="${child.type}"><span class="accordionControl" onclick="toggleChildrenDisplay(this)">${child.name}</span>`
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
    let childrenNodes = element.parentNode.querySelectorAll("li");
    for(let child of childrenNodes) {
        child.classList.toggle("expanded");
    }
}
