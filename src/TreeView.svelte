<script>
  export let treeData = '';
  let treeString = ''
  const loadData = (data) => {
    if(!data) return
    treeString = `<ul>`
    const pages = data.document.children
    const generateTreeview = (node) => {
      treeString += `<li>${node.name}`
      if(node.children) {
        treeString += `<ul>`
        for(let child of node.children) 
          generateTreeview(child)
        treeString += `</ul>`
      }
      treeString += `</li>`
      return
    }
    for(let page of pages) 
      generateTreeview(page)
    treeString += `</ul>`
  } 

  $: loadData(treeData);
</script>

<div id="treeview">
  {@html treeString}
</div>

<style>
</style>
