<script>
	import TreeView from './TreeView.svelte';
	let result = '';
	let figmaAccessToken = '';
	let fileId = '';

	function handleSubmit(){
		let ajax = new XMLHttpRequest();
		ajax.open("GET", `/data?fileId=${fileId}&figmaAccessToken=${figmaAccessToken}`, true);
		ajax.send();
		ajax.onreadystatechange = () => {
			if (ajax.readyState === 4 && ajax.status === 200) {
				result = generateTreeview(JSON.parse(ajax.responseText));
			}else {
				result = "Request Error! Please check file ID and access token :)";
			}
		}
	}

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
		let treeString = `<li data-child-id="${child.id}" data-child-type="${child.type}"><span class="accordionControl" on:click={toggleChildrenDisplay(this)}>${child.name}</span>`
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
	};

</script>

<main>
	<div class="container">
		<header>
			<div class="title">Figma2CSS App</div>
			<div class="subtitle">Generate CSS from Figma Layouts!</div>
		</header>
		<main>
			<form class="auth-form" id="generateForm" on:submit|preventDefault={handleSubmit}>
				<div class="label-input-container">
					<label for="figmaAccessToken">Figma Access Token</label>
					<input id="figmaAccessToken" name="figmaAccessToken" placeholder="Access Token" bind:value={figmaAccessToken} required>
				</div>
				<div class="label-input-container">
					<label for="fileId">File ID</label>
					<input id="fileId" name="fileId" placeholder="ID" bind:value={fileId} required>
				</div>
				<button type="submit" id="generateButton">Generate!</button>
			</form>
			<TreeView bind:tree={result}/>
		</main>
		<footer>

		</footer>
	</div>
</main>

<style>
</style>
