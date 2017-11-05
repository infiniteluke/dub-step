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
        Next,
        Previous,
        Pause,
        Play,
        StepIndex,
        step
      }) => (
        <section>
          <Div width="350px" overflow="hidden" margin="0 auto">
            <Div
              display="flex"
              transform={`translate3d(${-step * 350}px, 0, 0)`}
              transition="all .3s ease-in-out"
            >
              {slides.map((url, i) => <Img src={url} alt="doge pic" width="100%" height="100%" />)}
            </Div>
          </Div>
          <Div display="flex" justifyContent="center">
            {slides.map((url, i) => (
              <StepIndex
                component={Img}
                step={i}
                key={i}
                src={url}
                width="30px"
                height="30px"
                margin="5px"
                padding="2px"
                border={i === step ? '1px solid darkgray' : 'none'}
                transform={`scale(${i === step ? 1.2 : 1})`}
              />
            ))}
          </Div>
          <Div display="flex" justifyContent="center">
            <Previous>Previous</Previous>
            <Next>Next</Next>
            <Play>Play</Play>
            <Pause>Pause</Pause>
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

In the example of above, the `step` is used in coordination with a css transform/transition to animate the changing slides.
