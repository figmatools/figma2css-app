<script>
  import baseUrl from './base-url.js'
	import TreeView from './TreeView.svelte';
  import Input from './Input.svelte'
  import Button from './Button.svelte'
	import { onMount } from 'svelte';
	import CSSGenerator from "./CSSGenerator.svelte";

  let loading = false,
      data = '',
      figmaToken = '',
      fileId = ''

  const handleSubmit = async () => {
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

	onMount(() => {
    getSavedCredentials();
	})
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
    
  <form class="flex items-end bb b--light-gray ph4 pv3" 
    on:submit|preventDefault={handleSubmit}>
    <Input label={'Figma Acess Token*'} value={figmaToken} /> 
    <Input label={'File Id*'} value={fileId} /> 
    <Button type={'submit'} text={'Generate'} />
  </form>
  <div class="relative h-100 w-100">
    <div class="absolute w5 h-100 bg-light-gray">
      <TreeView treeData={data} />
    </div>
  </div>
  <CSSGenerator/>
  <footer>
  </footer>
</main>

<style>
</style>
