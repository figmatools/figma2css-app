<script>
  export let label
  export let value
  export let css
  export let placeholder
</script>

<div class="flex flex-column mr3 f7 w6">
  <label class="mb2">{label}</label>
  <input class={`border-box h2 input-reset ba br2 b--moon-gray pa0 pl2 ${css}`}
    placeholder={placeholder} bind:value={value} required>
</div>
