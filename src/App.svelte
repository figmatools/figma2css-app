<script>
  import baseUrl from './base-url.js'
	import TreeView from './TreeView.svelte';
  import Input from './Input.svelte'
  import Button from './Button.svelte'
	import { onMount } from 'svelte';
	import CSSGenerator from "./CSSGenerator.svelte";

  let filePath = ''

  let isWatching = false

  let loading = false,
      treeData = '',
      data = '',
      figmaToken = '',
      fileId = '',
      resultCss

  const loadData = async () => {
    try {
      data = (
        await (
          await fetch(`${baseUrl}/data?fileId=${fileId}&figmaToken=${figmaToken}`)
        ).json()
      )
      return data;
    } catch(err) { console.error(err) }
  }


  const loadTreeView = async () => {
    if(!fileId || !figmaToken) return
    loading = true
    treeData = await loadData(); 
    loading = false
	}

  const getCheckedIds = (data) => {
    let checkedIds = []
    if(data.isChecked)
      checkedIds.push(data)
    if(data.children) {
      data.children.forEach(child => {
        checkedIds = checkedIds.concat(getCheckedIds(child))
      })
    }
    return checkedIds
  }

  const testFileName = (name) => {
    let regex = new RegExp(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$|([<>:"\\/\\\\|?*])|(\\.|\\s)$/ig);
    return !regex.test(name);
  };

  const getCheckedNodes = (data) => {
    let result = []
    data.forEach(child => {
      result = getCheckedIds(child)
    })
    return result
  }

	let lastModified = new Date("1900-05-24T02:34:14.475592Z")

  let watchInterval = false;
  const watch = async () => {
    if(isWatching) {
      clearInterval(watchInterval)
      isWatching = false
      return;
    }
    let i = 0;
    isWatching = true
    watchInterval = setInterval(async () => {
      if(i < 1) {
        i++
        return;
      }
      if(await shouldUpdateData()) {
        await generateCss()
      }
    }, 5000)
  } 

  const shouldUpdateData = async () => {
    try {
      let result = (
        await (
          await fetch(`${baseUrl}/data?figmaToken=${figmaToken}&fileId=${fileId}&depth=1`)
        ).json()
      )

      let currentLastModified = new Date(result.lastModified)
      if(currentLastModified > lastModified) {
        lastModified = currentLastModified
        return true;
      } else {
        return false;
      }
    } catch(err) { 
      console.error(err) 
      return false
    }
  }

  const generateCss = async () => {
    loading = true
    if(await shouldUpdateData()) {
      await loadData();
    }
    if(!data) return;
    let checkedNodes = getCheckedNodes(treeData.document.children)
    if(!checkedNodes.length) {
      console.error('No checked items!')
      loading = false
      return
    }

    let url = `${baseUrl}/css`;
    if(filePath) 
      url += `?filePath=${filePath}`

    try {
      resultCss = (
        await (
          await fetch(url, {
            method: 'post',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              nodes: checkedNodes 
            })
          })
        ).text()
      )
    } catch(err) { console.error(err) }
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
</script>

<main>
  <header>
  </header>
  {#if loading}
    <div class="bg-white-50 fixed w-100 h-100 z-999 flex justify-center items-center">
      <img class="w2 h2"
        src='https://i.ya-webdesign.com/images/loading-png-gif.gif'
        alt="loading"/>
    </div>
  {/if}

  <div class="flex justify-between items-end bb b--light-gray ph4 pv3">
    <div class="flex">
      <Input id={'figmaToken'} label={'Figma Access Token*'} 
        bind:value={figmaToken} placeholder="Figma Access Token"  />
      <Input id={'fileId'} label={'File Id*'} 
        bind:value={fileId} placeholder="File Id*" />
    </div>
    <button on:click={loadTreeView} class="bn bg-green white br2 h2 f7 w5 pointer">
      Load Data
    </button>
  </div>
  <div class="flex items-center justify-between bb b--light-gray ph4 pv2">
    <Input  id={'output-path'} label={'Full Output Path'} 
      bind:value={filePath} placeholder="Full Output Path" />
    <p class="pa0 ma0 f7">Name the destination file, select the nodes in the treeview and click generate</p>
    <button on:click={generateCss}
      class="bn bg-green white br2 h2 f7 w5 pointer">
      Generate CSS
    </button>
    <button on:click={watch}
      class={`${isWatching ? 'bg-red' : 'bg-green'} bn white br2 h2 f7 w5 pointer`}>
      {isWatching ? 'Stop Watching!' : 'Watch'}
    </button>
  </div>
  <div class="flex relative h-100 w-100">
    <div class="w7 bg-light-gray overflow-auto">
      <TreeView treeData={treeData} />
    </div>
    <div class="w-100 h-100 pa3 flex justify-center">
      <textarea class="w-100 h-100" bind:value={resultCss}></textarea>
    </div>
  </div>
  <CSSGenerator/>
  <footer>
  </footer>
</main>

<style>
</style>
