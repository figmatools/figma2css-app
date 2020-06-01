<script>
  import baseUrl from './base-url.js'
	import TreeView from './TreeView.svelte';
  import Input from './Input.svelte'
  import Button from './Button.svelte'
	import { onMount } from 'svelte';
	import CSSGenerator from "./CSSGenerator.svelte";

  let files;

  let loading = false,
      data = '',
      figmaToken = '',
      fileId = '',
      resultCss


  const loadTreeView = async (fileId, figmaToken) => {
    if(!fileId && !figmaToken) return
    loading = true
    try {
      data = ( 
        await ( 
          await fetch(`${baseUrl}/data?fileId=${fileId}&figmaToken=${figmaToken}`) 
        ).json() 
      )
    }catch(err) { console.error(err) }
    loading = false
	}

  const getCheckedIds = (data) => {
    let checkedIds = []
    if(data.isChecked) 
      checkedIds.push(data.id)
    if(data.children) {
      data.children.forEach(child => {
        checkedIds = checkedIds.concat(getCheckedIds(child))
      })
    }
    return checkedIds
  }

  const getIds = (data) => {
    let result = []
    data.forEach(child => {
      result = getCheckedIds(child)
    })
    return result
  }

  const generateCss = async () => {
    if(!data) return;
    loading = true
    let checkedIds = getIds(data.document.children)
    if(!checkedIds.length) return
    try {
      resultCss = ( 
        await ( 
          await fetch(`${baseUrl}/css?figmaToken=${figmaToken}&fileId=${fileId}&nodeIds=${checkedIds.join(',')}&filePath=${files[0]}`) 
        ).text() 
      )
    }catch(err) { console.error(err) }
    loading = false
  }

  const getSavedCredentials = async () => {
    loading = true
    try {
      let result = await fetch(`${baseUrl}/cached-credentials`)
      result = await result.json()
			fileId = result.id
			figmaToken = result.token
    }catch(err) { console.error(err) }
    loading = false
  }

	onMount(async () => {
    await getSavedCredentials();
	})

  $: loadTreeView(fileId, figmaToken)
</script>

<main>
  <header>
  </header>
  {#if loading}
    <div class="fixed w-100 h-100 z-999 flex justify-center items-center">
      <img class="w2 h2" 
        src='https://i.ya-webdesign.com/images/loading-png-gif.gif' 
        alt="loaging"/> 
    </div>
  {/if}
    
  <div class="flex items-end bb b--light-gray ph4 pv3">
    <Input label={'Figma Acess Token*'} value={figmaToken} /> 
    <Input label={'File Id*'} value={fileId} /> 
  </div>
  <div class="flex items-end bb b--light-gray ph4 pv2">
    <input css={'border-box h2 input-reset ba br2 b--moon-gray pa0 pl2'} 
      type="file" bind:files>
  </div>
  <div class="flex relative h-100 w-100">
    <div class="h-100 bg-light-gray overflow-auto">
      <div class="w5 flex pa2 items-center justify-between bg-washed-yellow">
        <p class="pa0 ma0 f7">Select a node and click generate!</p>
        <button on:click={generateCss} 
          class="bn bg-green white br2 h2 f7 w3 pointer">
          generate
        </button>
      </div>
      <div>
        <TreeView treeData={data} />
      </div>
    </div>
    <div class="w-100 h-100 pa3">
      <textarea class="w5 h5" bind:value={resultCss}></textarea>
    </div>
  </div>
  <CSSGenerator/>
  <footer>
  </footer>
</main>

<style>
</style>
