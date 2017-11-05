
See the [API Docs](https://infiniteluke.github.io/dub-step/#dubstepproptypes) for information on the props exposed by this package.

### Control Props

dub-step manages its own state internally and calls your `onChange`/`OnPlay`/`OnPause` etc. handlers with any relevant changes. The controllable state that dub-step manages includes: `step` and `paused`. Your child callback function (read more below) can be used to manipulate this state from within the render function and can likely support many of your use cases.

However, if more control is needed, you can pass any of these pieces of state as a prop (as indicated above) and that state becomes controlled. As soon as `this.props[controllableStatePropKey] !== undefined`, internally, dub-step will determine its state based on your prop's value rather than its own internal state. You will be required to keep the state up to date, but you can also control the state from anywhere, be that state from other components, redux, react-router, or anywhere else.
