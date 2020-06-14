<script>
  import baseUrl from './base-url.js'
	import TreeView from './TreeView.svelte';
  import Input from './Input.svelte'
  import Button from './Button.svelte'
	import { onMount } from 'svelte';
	import CSSGenerator from "./CSSGenerator.svelte";

  let filePath = ''

  let loading = false,
      data = '',
      figmaToken = '',
      fileId = '',
      resultCss


  const loadTreeView = async () => {
    if(!fileId || !figmaToken) return
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

  const testFileName = (name) => {
    let regex = new RegExp(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$|([<>:"\\/\\\\|?*])|(\\.|\\s)$/ig);
    return !regex.test(name);
  };

  const getIds = (data) => {
    let result = []
    data.forEach(child => {
      result = getCheckedIds(child)
    })
    return result
  }

  const watch = async () => {
    console.log('watch!')
		let lastModified = new Date("1900-05-24T02:34:14.475592Z")
    setInterval(async () => {
      try {
        let result = (
          await (
            await fetch(`${baseUrl}/data?figmaToken=${figmaToken}&fileId=${fileId}&depth=1`)
          ).json()
        )
				let currentLastModified = new Date(result.lastModified)
        if(currentLastModified > lastModified) {
          await generateCss()
          lastModified = currentLastModified
        }
      } catch(err) { console.error(err) }
    }, 500)
  } 

  const generateCss = async () => {
    if(!data) return;
    loading = true
    let checkedIds = getIds(data.document.children)
    if(!checkedIds.length) return
    // TODO: parametrize filePath and cssAttributes. Both should be adv configs on the interface.
    try {
      resultCss = (
        await (
          await fetch(`${baseUrl}/css?figmaToken=${figmaToken}&fileId=${fileId}&nodeIds=${checkedIds.join(',')}&filePath=${filePath}`)
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
      <Input label={'Figma Acess Token*'} bind:value={figmaToken} id={'figmaToken'} />
      <Input label={'File Id*'} bind:value={fileId} id={'fileId'} />
    </div>
    <button on:click={loadTreeView} class="bn bg-green white br2 h2 f7 w5 pointer">
      Load Data
    </button>
  </div>
  <div class="flex items-center justify-between bb b--light-gray ph4 pv2">
    <Input label={'Full Output Path'} bind:value={filePath} />
    <p class="pa0 ma0 f7">Name the destination file, select the nodes in the treeview and click generate</p>
    <button on:click={generateCss}
      class="bn bg-green white br2 h2 f7 w5 pointer">
      Generate CSS
    </button>
    <button on:click={watch}
      class="bn bg-green white br2 h2 f7 w5 pointer">
      Watch
    </button>
  </div>
  <div class="flex relative h-100 w-100">
    <div class="min-w6 bg-light-gray overflow-auto">
      <TreeView treeData={data} />
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
