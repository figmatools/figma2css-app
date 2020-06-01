<script>
  export let data
  export let isParentChecked

  const toggleOpen = () => data.isOpen = !data.isOpen
  const isChecked = (isParentChecked) => data.isChecked = isParentChecked
  $: isChecked(isParentChecked)
</script>

<li class="list">
  <span 
    class="pointer {data.children ? 'o-100' : 'o-0'}"
    on:click={toggleOpen}>
    {#if data.isOpen}&#8593;{:else}&#8595;{/if}
  </span>
  <span><input type=checkbox bind:checked={data.isChecked}></span>
  <span>{data.name}</span>
  {#if data.children}
    <ul class="list pa0 pl3 { data.isOpen ? 'db' : 'dn'}">
      {#each data.children as child}
        <svelte:self data={child} isParentChecked={data.isChecked}/>
      {/each}
    </ul>
  {/if}
</li>
