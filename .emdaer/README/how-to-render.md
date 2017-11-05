Dub step uses the child callback render function pattern. This is where you render whatever you want to based on the state of dub-step which is passed to the callback as parameters. The function is passed as the child prop of the DubStep component:
```jsx
<DubStep>
  {({/* parameters here */}) => (/* your render code here*/)}
</DubStep>
```

The paramters of this function can be split into three categories: State, Components, and Actions.

See the [API Docs](https://infiniteluke.github.io/dub-step/#stateandhelpers) for a list of these properties.
