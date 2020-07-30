<script>
  export let id 
  export let label
  export let value
  export let placeholder
  export let error
  export let css
</script>

<div class={`flex flex-column mr3 f7 w6 ${css}`}>
  <label class="mb2">{label}</label>
  <input  id={id} class={`border-box h2 input-reset ba br2 b--moon-gray pa0 pl2`}
    placeholder={placeholder} bind:value={value} required >
  <p className="ma0 pt1">{error}</p>
</div>
