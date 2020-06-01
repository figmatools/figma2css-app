<script>
  export let label
  export let value
</script>

<div class="flex flex-column mr3 f7 w4">
  <label class="mb2">{label}</label>
  <input class="border-box h2 input-reset ba br2 b--moon-gray pa0 pl2" 
    placeholder="Access Token" bind:value={value} required>
</div>
