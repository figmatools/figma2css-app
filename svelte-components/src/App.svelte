<script>
</script>

<main>
	<div class="container">
		<header>
			<div class="title">Figma2CSS App</div>
			<div class="subtitle">Generate CSS from Figma Layouts!</div>
		</header>
		<main>
			<form class="auth-form" id="generateForm">
				<div class="label-input-container">
					<label for="figmaAccessToken">Figma Access Token</label>
					<input id="figmaAccessToken" name="figmaAccessToken" placeholder="Access Token" required>
				</div>
				<div class="label-input-container">
					<label for="fileId">File ID</label>
					<input id="fileId" name="fileId" placeholder="ID" required>
				</div>
				<button type="submit" id="generateButton">Generate!</button>
			</form>
			<div id="testResults">

			</div>
		</main>
		<footer>

		</footer>
	</div>
</main>

<style>
</style>
