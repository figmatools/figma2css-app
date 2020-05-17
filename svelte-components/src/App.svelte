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
				result = JSON.parse(ajax.responseText);
			} else if (ajax.readyState === 4 && ajax.status !== 200) {
				result = {msg: "Request Error! Please check file ID and access token :)", type: "ERROR"};
			}
		}
	}

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
			<TreeView bind:treeData={result}/>
		</main>
		<footer>

		</footer>
	</div>
</main>

<style>
</style>
