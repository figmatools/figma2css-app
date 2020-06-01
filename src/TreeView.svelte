<script>
	import Node from './Node.svelte'

  export let treeData = ''
  let roots = []
  const loadData = (data) => {
    if(!data) return
    let transformTreeView = (child) => {
      child.isOpen = true
      child.isChecked = false
      if(child.children) 
        child.children = child.children.map(child => transformTreeView(child))
      return child
    }
    roots = data.document.children.map(child => transformTreeView(child))
  }

  $: loadData(treeData);
</script>

<ul class="list pa0 pl3">
  {#each roots as root}
    <Node data={root} isParentChecked={root.isChecked}/>
  {/each}
</ul>

<style>
</style>
