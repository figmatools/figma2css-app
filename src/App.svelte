<script>
  import baseUrl from './base-url.js'
	import TreeView from './TreeView.svelte';
  import Input from './Input.svelte'
	import { onMount } from 'svelte';
	import CSSGenerator from "./CSSGenerator.svelte";

  let filePath = ''

  let isWatching = false

  let loading = false,
      treeData = '',
      data = '',
      figmaToken = '',
      fileURL = '',
      resultCss

  let figmaTokenError = '',
    fileURLError = '',
    outputPathError = '';


  const extractFileId = (fileURL) => {
    let result = fileURL.match(/file\/(.*?)\//)
    if(result[1])
      return result[1]
    else
      return false
  }

  const isURLValid = (fileURL) => {
    let result = fileURL.match(/file\/(.*?)\//)
    if(result[1])
      return true
    else
      return false
  } 

  const loadData = async () => {
    saveInputValuesInLocalStorage();
    try {
      data = (
        await (
          await fetch(`${baseUrl}/data?fileURL=${fileURL}&figmaToken=${figmaToken}&writeData=true`)
        ).json()
      )
      return data;
    } catch(err) { console.error(err) }
  }


  const loadTreeView = async () => {
    if(!fileURL || !figmaToken) return
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
        loading = true
        await loadData()
        await generateCss()
        loading = false
      }
    }, 1000)
  } 

  const shouldUpdateData = async () => {
    if(!fileURL) {
      fileURLError = "Invalid file";
      return;
    }
    try {
      let result = (
        await (
          await fetch(`${baseUrl}/data?figmaToken=${figmaToken}&fileURL=${fileURL}&depth=1&writeData=false`)
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

  const generate = async () => {
    loading = true
    if(await shouldUpdateData()) {
      await loadData();
    }
    await generateCss()
    loading = false
  } 

  const generateCss = async () => {
    if(!data) return;
    let checkedNodes = getCheckedNodes(treeData.document.children)
    if(!checkedNodes.length) {
      console.error('No checked items!')
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
              ids: checkedNodes.map((node) => node.id) 
            })
          })
        ).text()
      )
    } catch(err) { console.error(err) }
  }

  const saveInputValuesInLocalStorage = () => {
    window.localStorage.setItem('figmaToken', figmaToken);
    window.localStorage.setItem('fileURL', fileURL);
    window.localStorage.setItem('filePath', filePath);
  }

  const loadCachedValues = () => {
    figmaToken = window.localStorage.getItem('figmaToken');
    fileURL = window.localStorage.getItem('fileURL');
    filePath = window.localStorage.getItem('filePath');
    return { figmaToken, fileURL, filePath };
  } 

	onMount(async () => {
    loadCachedValues();
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

  <div class="flex justify-between items-center bb b--light-gray ph4 pv3">
    <div class="flex">
      <Input id={'figmaToken'} label={'Figma Access Token*'} 
        bind:value={figmaToken} placeholder="Figma Access Token"  
        error={figmaTokenError} />
      <Input css="ew8" id={'fileURL'} label={'File URL*'} 
        bind:value={fileURL} placeholder="File URL*" 
        error={fileURLError}
      />
    </div>
    <button on:click={loadTreeView} class="bn bg-green white br2 h2 f7 w4 pointer">
      Load Data
    </button>
  </div>
  <div class="flex items-center justify-between bb b--light-gray ph4 pv2">
    <Input  css="ew8" id={'output-path'} label={'Full Output Path'} 
      bind:value={filePath} placeholder="Full Output Path" 
      error={outputPathError} 
    />
    <p class="pa0 ma0 f7">Select the css file output, select the nodes in the treeview and click generate</p>
    <div class="flex">
      <button on:click={generate}
        class="mr3 bn bg-green white br2 h2 f7 w4 pointer">
        Generate CSS
      </button>
      <button on:click={watch}
        class={`${isWatching ? 'bg-red' : 'bg-green'} bn white br2 h2 f7 w4 pointer`}>
        {isWatching ? 'Stop Watching!' : 'Watch'}
      </button>
    </div>
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
