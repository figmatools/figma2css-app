# figma2css-app

Extract figma styles to your code

![figma2css](https://marcell-assets.s3-sa-east-1.amazonaws.com/figma2css-gif.gif)

# Attention
this project is in a very early stage, a lot of things need to be improved, issues are welcome :D

# Use cases

This is very usefull for components or pages that babely change between projects, so you don't have to change the styles everytime
you just need to map them and generate the css

We found that a mixture of generating automacally and also including your own css is the best approach in most cases

We're currently working in the css transformation itself to make it more efficient and accurate

# How to use it

Assuming you have node and npm installed

```
git clone git@github.com:figmatools/figma2css-app.git 
cd figma2css-app
npm i
npm run figma2css
```

open you browser http://localhost:4200/

# Figma Access token:
how to get an access token:
https://www.figma.com/developers/api#access-tokens

# File id*
you can get it in the file url e.g:
https://www.figma.com/file/acuAbVNviSzackLyfNNBaM/<......>

acuAbVNviSzackLyfNNBaM is the fileId of this url

# Full Output Path
you can put the output path of the generated css file e.g:
```
/home/mmc/my-project/css/figma-generated-css.css
```

The name of the elements that you want to transform need to be a css class or a id, e.g in your figma file .button or #button,
we're planing to change that in the future, maybe do a transformation of the name to match the css class that you want, but for now, this is 
how is working.

you can see an example file here https://www.figma.com/file/SGzkSxkP3pnZQrh9pzn6mf/FigmaTools?node-id=0%3A1

any question just hit me up 0000marcell@gmail.com

# Watch mode

if you're running watch mode everytime that the figma file change this file will be changed too :smile:

Click load Data to load the treeview with all the figma elements

Choose the elements that you want to extract the css from, you should also change the name of the element in the design to 
the name of your css class, we plan to change this in the future so you've more freedom to choose the name of the class, but 
for now this is the best approach

Then click **generate css** to generate the css once
or **Watch** to watch the figma file and generate the css everytime the figma file changes

and that's it enjoy

# figma2react

https://github.com/0000marcell/figma2react


# Development

For development run
```
npm run frontend
npm run backend
```

go to localhost:5000

# TODO
improve css transformation
create electron desktop app for mac, linux and windows
change the name of the selected element in figma to a class e.g: Button to .button
increase the size of the inputs
better error handling
authentication with oauth2
