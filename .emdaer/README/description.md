Many existing carousel/swipe solutions in one way or another end up dictating the markup of your UI. They expose many options to allow for extensibility, but this results in a convoluted API that is not flexible. In these cases, your often very specific design must be fit into an existing rigid solution.

dub-step simply manages the state needed to power a carousel, slideshow, photo gallery, or even multi-step forms, allowing you to build the UI how you want. It uses the [function as child](https://medium.com/merrickchristensen/function-as-child-components-5f3920a9ace9) and "prop getter" patterns, which gives you maximum flexibility with a minimal API.

_NOTE: Version v0.0.5 introduced a breaking change. All occurences of `index` in the dub-step API were renamed to `step`, for consistency. Please see the [release notes](https://github.com/infiniteluke/dub-step/releases/tag/v0.0.5) for more info._
