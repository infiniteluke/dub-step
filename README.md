<h1 align="center">
  dub-step 🕺🏽
    </br>
    <img src="https://user-images.githubusercontent.com/1127238/30524706-690c72e0-9bad-11e7-9feb-4c76f572bdfc.png" alt="dub-step logo" title="dub-step logo" width="100">
</h1>
<p align="center">Primitives for building index based UI widgets controlled by swipe, timers, and/or buttons.</p>
<hr />

[![Travis](https://img.shields.io/travis/infiniteluke/dub-step.svg?style=flat-square)](https://travis-ci.org/infiniteluke/dub-step)
[![npm](https://img.shields.io/npm/v/dub-step.svg?style=flat-square)](https://www.npmjs.com/package/dub-step)
[![GitHub issues](https://img.shields.io/github/issues/infiniteluke/dub-step.svg?style=flat-square)](https://github.com/infiniteluke/dub-step/issues)
[![Coverage](https://img.shields.io/coveralls/infiniteluke/dub-step.svg?style=flat-square)]()
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
</br>
[![Twitter](https://img.shields.io/twitter/url/https/github.com/infiniteluke/dub-step.svg?style=social)](https://twitter.com/intent/tweet?text=Step%20through%20an%20index%20with%20style%20with%20dub-step.%20Check%20it%20out!%20https://github.com/infiniteluke/dub-step%20🕺🏽&url=%5Bobject%20Object%5D)
[![GitHub stars](https://img.shields.io/github/stars/badges/shields.svg?style=social&label=Star&)]()

Many existing carousel/swipe solutions in one way or another end up dictating the markup of your UI. They expose many options to allow for extensibility, but this results in a convoluted API that is not flexible. In these cases, your often very specific design must be fit into an existing rigid solution.

dub-step simply manages the state needed to power a carousel, slideshow, photo gallery, or even multi-step forms, allowing you to build the UI how you want. It uses the [function as child](https://medium.com/merrickchristensen/function-as-child-components-5f3920a9ace9) and "prop getter" patterns, which gives you maximum flexibility with a minimal API.

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [Props](#props)
* [Control Props](#control-props)
* [Child Callback Function](#child-callback-function)
* [Examples (WIP)](#examples)
* [Credits](#credits)

## Installation

This module is distributed via [npm](https://www.npmjs.com/package/dub-step) which is bundled with [node](https://nodejs.org) and
should be installed as one of your project's `dependencies`:

```
npm install --save dub-step
```

> This package also depends on `react` and `prop-types`. Please make sure you
> have those installed as well.

## Usage
> NOTE: Glamorous is used for styles in this example, but is not required.

```jsx
import DubStep from 'dub-step';
import glamorous, { Div, Img } from 'glamorous';

function BasicSlideshow({slides, onChange}) {
  return (
    <DubStep
      cycle
      pauseOnHover
      duration={1500}
      total={slides.length}
    >
      {({
        getNextControlProps,
        getPreviousControlProps,
        getPauseControlProps,
        getPlayControlProps,
        getIndexControlProps,
        index
      }) => (
        <section>
          <Div width="350px" overflow="hidden" margin="0 auto">
            <Div
              display="flex"
              transform={`translate3d(${-index * 350}px, 0, 0)`}
              transition="all .3s ease-in-out"
            >
              {slides.map((url, i) => <Img src={url} alt="doge pic" width="100%" height="100%" />)}
            </Div>
          </Div>
          <Div display="flex" justifyContent="center">
            {slides.map((url, i) => (
              <Img
                {...getIndexControlProps({ index: i })}
                src={url}
                width="30px"
                height="30px"
                margin="5px"
                padding="2px"
                border={i === index ? '1px solid darkgray' : 'none'}
                transform={`scale(${i === index ? 1.2 : 1})`}
              />
            ))}
          </Div>
          <Div display="flex" justifyContent="center">
            <button {...getPreviousControlProps()}>Previous</button>
            <button {...getNextControlProps()}>Next</button>
            <button {...getPlayControlProps()}>Play</button>
            <button {...getPauseControlProps()}>Pause</button>
          </Div>
        </section>
      )}
    </DubStep>
  );
}

const DOGE_PICS = [
  'http://doge2048.com/meta/doge-600.png',
  'http://doge2048.com/meta/doge-600.png',
  'http://doge2048.com/meta/doge-600.png',
  'http://doge2048.com/meta/doge-600.png',
  'http://doge2048.com/meta/doge-600.png'
];

function App() {
  return (
    <BasicSlideshow
      slides={DOGE_PICS}
      onChange={currentIndex => console.log(currentIndex)}
    />
  )
}
```
Builds...</br>
![simpleslideshow](https://user-images.githubusercontent.com/1127238/30525038-b6b6cd5a-9bb3-11e7-9699-cac9f0bed3d2.gif)

In the example of above, the props returned by the get*ControlProps parameters empower any element in your UI to control the state of the slideshow. The index is used in coordination with a css transform/transition to animate the changing slides. 
`dub-step` is the only component. It doesn't render anything itself, it just calls the child function and renders that. Wrap everything in `<DubStep>{/* your function here! */}</DubStep>`.

## Props

See the [API Docs](https://infiniteluke.github.io/dub-step/#dubstepproptypes) for information on the props exposed by this package.

## Control Props

dub-step manages its own state internally and calls your `onChange`/`OnPlay`/`OnPause` etc. handlers with any relevant changes. The controllable state that dub-step manages includes: `index` and `paused`. Your child callback function (read more below) can be used to manipulate this state from within the render function and can likely support many of your use cases.

However, if more control is needed, you can pass any of these pieces of state as a prop (as indicated above) and that state becomes controlled. As soon as `this.props[controllableStatePropKey] !== undefined`, internally, dub-step will determine its state based on your prop's value rather than its own internal state. You will be required to keep the state up to date, but you can also control the state from anywhere, be that state from other components, redux, react-router, or anywhere else.

## Child Callback Function
This is where you render whatever you want to based on the state of dub-step. The function is passed as the child prop:
```jsx
<DubStep>
  {({/* parameters here */}) => (/* your render code here*/)}
</DubStep>
```

The paramters of this function can be split into three categories: State, Prop getters, and Actions.

See the [API Docs](https://infiniteluke.github.io/dub-step/#stateandhelpers) for a list of these properties.

## Examples
These are not yet available on github. But check out the codesandbox until they are! Fork it and build your own examples then [tweet me](https://twitter.com/lukeherrington) about it!

[![Edit dub-step Examples 🕺🏽](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/p5vr4pq897)

Here are some of the existing examples:</br>
![dub-step-examples](https://user-images.githubusercontent.com/1127238/30551187-8d947314-9c4e-11e7-8d73-7d5f131c36ca.gif)


## Credits

[Kent Dodds'](github.com/kentcdodds) work on [downshift 🏎](https://github.com/paypal/downshift/) heavily inspired this package. You may even notice some copy pasta in the README 😏.

This package is also inspired by work I rubber-ducked with [flip](https://github.com/flipactual/) for managing focus in a TV Shelf UI.

Much of the swipe code was lifted from [react-slick](https://github.com/akiran/react-slick/) by [akiran](https://github.com/akiran) a very solid solution for swipe friendly carousels.

There is no lack of carousel libraries out there. I looked at many of them while writting this package. I hope dub-step represents a move towards an unopinionated solution that enables design and development to work together not against each other.

Check out other solutions on [npm](https://www.npmjs.com/search?q=carousel%20swipe%20react&page=1&ranking=optimal).

Some of the time spent writting this package was sponsored by [Four Kitchens](https://www.fourkitchens.com/). I ❤️ 4K. Come [work with us](https://www.fourkitchens.com/careers/)!

<a href="https://www.fourkitchens.com">
  <img src="https://www.fourkitchens.com/wp-content/themes/twentysixteen-4k/img/logos/4k-logo.svg" alt="Four Kitchens logo" title="4K logo" width="200">
</a>

## License
MIT
