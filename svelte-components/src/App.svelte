<script>
  import baseUrl from './base-url.js'
	import TreeView from './TreeView.svelte';
	import {onMount} from 'svelte';
	import CSSGenerator from "./CSSGenerator.svelte";

	let result = '';
	let figmaAccessToken = '';
	let fileId = '';
	let nodeIds = [];
	let depth = '';
	let treeLoading = false;

	function handleSubmit() {
		treeLoading = true;
		result = '';
		let ajax = new XMLHttpRequest();
		ajax.open("GET", `${baseUrl}/data?fileId=${fileId}&figmaAccessToken=${figmaAccessToken}`, true);
		ajax.send();
		ajax.onreadystatechange = () => {
			if (ajax.readyState === 4 && ajax.status === 200) {
				result = JSON.parse(ajax.responseText);
				treeLoading = false;
			} else if (ajax.readyState === 4 && ajax.status !== 200) {
				result = {msg: "Request Error! Please check file ID and access token :)", type: "ERROR"};
				treeLoading = false;
			}
		}
	}

	const getSavedCredentials = () => {
		let ajax = new XMLHttpRequest();
		ajax.open("GET", `${baseUrl}/cached-credentials`, true);
		ajax.send();
		ajax.onreadystatechange = () => {
			if (ajax.readyState === 4 && ajax.status === 200) {
				let response = JSON.parse(ajax.responseText);
				if (response.id) {
					fileId = response.id;
				}
				if (response.token) {
					figmaAccessToken = response.token;
				}
			}
		}
	};

	onMount(() => {
		getSavedCredentials();
	})
</script>

<main>
	<div class="container">
		<header>
			<div class="title">Figma2CSS</div>
			<div class="subtitle">Generate CSS from Figma Layouts!</div>
		</header>
		<main>
			<form class="auth-form" id="generateForm" on:submit|preventDefault={handleSubmit}>
				<div class="label-input-container">
					<label for="figmaAccessToken">Figma Access Token*</label>
					<input id="figmaAccessToken" name="figmaAccessToken" placeholder="Access Token" bind:value={figmaAccessToken} required>
				</div>
				<div class="label-input-container">
					<label for="fileId">File ID*</label>
					<input id="fileId" name="fileId" placeholder="File ID" bind:value={fileId} required>
				</div>
				<div class="label-input-container smallInput">
					<label for="nodeIds">Node IDs</label>
					<input id="nodeIds" name="nodeIds" placeholder="Comma Separated IDs" bind:value={nodeIds}>
				</div>
				<div class="label-input-container smallInput">
					<label for="depth">Depth</label>
					<input type="number" id="depth" name="depth" placeholder="Depth" bind:value={depth}>
				</div>
				<button type="submit" id="generateButton" class="btn-primary">Generate!</button>
			</form>
			<TreeView treeData={result} requestLoading={treeLoading}/>
			<CSSGenerator/>
		</main>
		<footer>

		</footer>
	</div>
</main>

<style>
	html {
		box-sizing: border-box;
		font-size: 16px;
		background-color: #1b1b2f;
	}

	*, *:before, *:after {
		font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		box-sizing: inherit;
	}

	body, h1, h2, h3, h4, h5, h6, p, ol, ul {
		margin: 0;
		padding: 0;
		font-weight: normal;
	}

	input {
		background-color: transparent;
	}

	ol, ul {
		list-style: none;
	}

	img {
		max-width: 100%;
		height: auto;
	}

	/* END CSS RESET */

	.container {
		margin: 0 auto;
		min-height: 100vh;
		max-width: 1280px;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		text-align: center;
	}

	.title {
		font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		display: block;
		font-weight: 300;
		font-size: 100px;
		color: var(--main-color);
		letter-spacing: 1px;
	}

	.subtitle {
		font-weight: 300;
		font-size: 42px;
		color: var(--secondary-color);
		word-spacing: 5px;
		padding-bottom: 15px;
	}

	main {
		width: 100%;
		color: rgba(255, 255, 255, 0.61);
	}

	.auth-form {
		width: 100%;
		display: flex;
		justify-content: space-around;
		flex-wrap: wrap;
		align-items: center;
		align-content: center;
	}

	.label-input-container {
		display: flex;
		flex-direction: column;
		width: 50%;
		padding: 5px 30px;
	}

	.label-input-container input {
		border: 0;
		border-bottom: 1px solid var(--light-grey);
		color: var(--font-black);
		outline: none;
		padding: 5px 10px;
		font-size: 16px;
	}

	.label-input-container label {
		margin-bottom: 5px;
		font-size: 20px;
	}

	.auth-form button {
		font-size: 20px;
		line-height: 20px;
		padding: 14px 24px;
		margin-bottom: 0;
		display: inline-block;
		text-decoration: none;
		text-align: center;
		white-space: nowrap;
		vertical-align: middle;
		-ms-touch-action: manipulation;
		touch-action: manipulation;
		cursor: pointer;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		border: 1px solid transparent;
		background-color: #28a745;
		color: white;
		border-radius: 5px;
		transition: all 0.6s ease;
		margin-top: 20px;
	}

	.auth-form button:hover {
		background-color: #218838;
		border-color: #1e7e34;
	}

	.auth-form button:focus {
		box-shadow: 0 0 0 0.2rem rgba(40,167,69,.5);
	}

	.smallInput {

	}


	input:-webkit-autofill,
	input:-webkit-autofill:hover,
	input:-webkit-autofill:focus,
	textarea:-webkit-autofill,
	textarea:-webkit-autofill:hover,
	textarea:-webkit-autofill:focus,
	select:-webkit-autofill,
	select:-webkit-autofill:hover,
	select:-webkit-autofill:focus {
		border-bottom: 1px solid var(--light-grey);
		-webkit-text-fill-color: var(--light-grey);
		-webkit-box-shadow: transparent;
		transition: background-color 5000s ease-in-out 0s;
	}
</style>
