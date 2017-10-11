import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { callAll, unwrapArray, getSign } from './utils';

/**
 * # DubStep
 * <h1 align="center">
 *   dub-step 🕺🏽
 *   </br>
 *   <img src="https://user-images.githubusercontent.com/1127238/30524706-690c72e0-9bad-11e7-9feb-4c76f572bdfc.png" alt="dub-step logo" title="dub-step logo" width="100">
 * </h1>
 * <p align="center">Primitives for building step based UI widgets controlled by swipe, timers, and/or buttons.</p>
 * <hr />
 * </br>
 * Many existing carousel/swipe solutions in one way or another end up dictating the markup of your UI. They expose many options to allow for extensibility, but this results in a convoluted API that is not flexible. In these cases, your often very specific design must be fit into an existing rigid solution.
 * dub-step simply manages the state needed to power a carousel, slideshow, photo gallery, or even multi-step forms, allowing you to build the UI how you want. It uses the <a href="https://medium.com/merrickchristensen/function-as-child-components-5f3920a9ace9">function as child</a> and "prop getter" patterns, which gives you maximum flexibility with a minimal API.
 *
 * dub-step provides an API for updating the state of an index or "step".
 * - Directly when an "action" like `next` is called.
 * - Incrementally when the provided Next/Previous components are clicked.
 * - On swipe when a Step component is swiped.
 * - On a timer when the provided Play/Pause components are clicked.
 *
 */
class DubStep extends Component {
  /**
   * These props affect how/when the step and associated state is updated.
   *
   * @type {object}
   * @property {number} total - The total number of steps. Defaults to `0`.
   * @property {number} defaultStep - The initial step of dub-step. Defaults to `0`.
   * @property {boolean} cycle - Whether or not dub-step should cycle. Defaults to `false`.
   * @property {number} stepInterval - The number of steps to interate when navigating. Defaults to `1`.
   * @property {boolean} autoPlay - Should dub-step autoPlay? Defaults to `false`.
   * @property {number} duration - How long should each step wait? Defaults to `0`.
   * @property {boolean} vertical - Are the steps changing vertically? Defaults to `false`.
   * @property {boolean} swipe - Are the steps swipable? Defaults to `false`.
   * @property {boolean} draggable - Are the steps draggable on desktop? Defaults to `false`.
   * @property {boolean} pauseOnHover - Should dub-step pause on hover? Defaults to `false`.
   * @property {number} touchThreshold - How much it takes to change steps. Defaults to `20`.
   * @property {number} swipeIterateOnly - Regardless of swipe direction, the step is iterated. Defaults to `false`.
   * @property {number} animationSpeed - The transition animation speed. Defaults to `0`.
   * @property {function} onBeforeChange - Called immediately before the step is changed. Defaults to `() => {}`.
   * @property {function} onChange - Called once the step has changed. Defaults to `() => {}`.
   * @property {function} onAfterChange - Called after the step has changed and after animationSpeed seconds if present. Defaults to `() => {}`.
   * @property {function} onPlay - Called when played. Defaults to `() => {}`.
   * @property {function} onPause - Called when paused. Defaults to `() => {}`.
   * @property {function} onNext - Called when iterating to the next step. Defaults to `() => {}`.
   * @property {function} onPrevious - Called when iterating to the previous step. Defaults to `() => {}`.
   * @property {function} onSwipeStart - Called when swiping/dragging has begun. Defaults to `() => {}`.
   * @property {function} onSwipeMove - Called when a swipe/drag is moved. Warning: This gets called _a lot_. Defaults to `() => {}`.
   * @property {function} onSwipeEnd - Called when a swipe/drag is cancelled. Defaults to `() => {}`.
   * @property {function|array} children - Called with an object containing current state and prop getters.
   */
  static propTypes = {
    total: PropTypes.number,
    defaultStep: PropTypes.number,
    cycle: PropTypes.bool,
    stepInterval: PropTypes.number,
    autoPlay: PropTypes.bool,
    duration: PropTypes.number,
    vertical: PropTypes.bool,
    swipe: PropTypes.bool,
    draggable: PropTypes.bool,
    pauseOnHover: PropTypes.bool,
    touchThreshold: PropTypes.number,
    swipeIterateOnly: PropTypes.bool,
    animationSpeed: PropTypes.number,
    onBeforeChange: PropTypes.func,
    onChange: PropTypes.func,
    onAfterChange: PropTypes.func,
    onPlay: PropTypes.func,
    onPause: PropTypes.func,
    onNext: PropTypes.func,
    onPrevious: PropTypes.func,
    onSwipeStart: PropTypes.func,
    onSwipeMove: PropTypes.func,
    onSwipeEnd: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.array]).isRequired,
  };

  static defaultProps = {
    total: 0,
    defaultStep: 0,
    stepInterval: 1,
    cycle: false,
    swipe: false,
    draggable: false,
    duration: 0,
    autoPlay: false,
    touchThreshold: 20,
    vertical: false,
    pauseOnHover: false,
    swipeIterateOnly: false,
    animationSpeed: 0,
    onBeforeChange: () => {},
    onChange: () => {},
    onAfterChange: () => {},
    onPlay: () => {},
    onPause: () => {},
    onNext: () => {},
    onPrevious: () => {},
    onSwipeStart: () => {},
    onSwipeMove: () => {},
    onSwipeEnd: () => {},
  };

  constructor(props) {
    super(props);
    if (this.props.cycle && !this.props.total) {
      throw new Error('Cannot use the cycle prop without a total prop.');
    }
    if (this.props.autoPlay && !this.props.duration) {
      throw new Error('Cannot use the autoPlay prop without a duration prop.');
    }
  }

  /**
   * @type {object}
   * @private
   * @property {number} step - state - The current step of dub-step. Controlled.
   * @property {boolean} paused - state - Is dub-step paused? Controlled.
   * @property {boolean} animating - state - Is the step component transition animating?
   * @property {boolean} swiping - state - Has the swipe threshold been reached?
   * @property {boolean} dragging - state - Has the step component been initially dragged?
   * @property {number} swipeLeftDistance - state - A number representing the distance the step component has been dragged horizontally.
   * @property {number} swipeDownDistance - state - A number representing the distance the step component has been dragged vertically.
   * @property {boolean} swiped - state - Has the step component been dragged enough to be moved to the next/previous step?
   * @property {number} swipeRatio - state - A number between 0 and 1 with nearness to 1 representing closeness to being swiped.
   * @property {number} swipeDirectionSign - state - Either 1 or -1. 1 representing right and -1 representing left.
   * @property {object} touchObject - Holds meta data used to calculate the swipe state. Not exposed through getStateAndHelpers.
   */
  state = {
    step: this.getControlledProp('step', { step: this.props.defaultStep }),
    paused: this.getControlledProp('paused', {
      paused: !this.props.autoPlay,
    }),
    animating: false,
    swiping: false,
    dragging: false,
    swipeLeftDistance: 0,
    swipeDownDistance: 0,
    swiped: false,
    swipeRatio: 0,
    swipeDirectionSign: 1,
    touchObject: {
      startX: 0,
      startY: 0,
      curX: 0,
      curY: 0,
      swipeLength: 0,
    },
  };

  componentDidMount() {
    if (this.props.duration && !this.getControlledProp('paused')) {
      this.interval = this.startPlaying();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      this.getControlledProp('paused') ||
      (this.props.duration &&
        !this.props.cycle &&
        this.getControlledProp('step') === this.props.total - 1)
    ) {
      this.interval = this.stopPlaying();
    } else if (this.props.duration && (prevProps.paused || prevState.paused)) {
      this.interval = this.startPlaying();
    }
  }
  componentWillUnmount() {
    if (this.interval) {
      this.stopPlaying();
    }
  }

  getControlledProp(prop, state = this.state) {
    return this.isPropControlled(prop) ? this.props[prop] : state[prop];
  }

  getStepProps = (props = {}) => ({
    ...props,
    onMouseDown: callAll(props.onMouseDown, this.swipeStart),
    onMouseMove: callAll(
      props.onMouseMove,
      this.state.dragging ? this.swipeMove : () => {}
    ),
    onMouseUp: callAll(props.onMouseUp, this.swipeEnd),
    onMouseLeave: callAll(
      props.onMouseLeave,
      this.state.dragging ? this.swipeEnd : this.mouseLeave
    ),
    onTouchStart: callAll(props.onTouchStart, this.swipeStart),
    onTouchMove: callAll(
      props.onTouchMove,
      this.state.dragging ? this.swipeMove : () => {}
    ),
    onTouchEnd: callAll(props.onTouchEnd, this.swipeEnd),
    onTouchCancel: callAll(
      props.onTouchCancel,
      this.state.dragging ? this.swipeEnd : () => {}
    ),
    onMouseEnter: callAll(props.onMouseEnter, this.mouseEnter),
    onMouseOver: callAll(props.onMouseOver, this.mouseOver),
  });
  getPreviousControlProps = (props = {}) => ({
    'aria-label': 'previous',
    ...props,
    onClick: callAll(props.onClick, this.previous),
  });
  getNextControlProps = (props = {}) => ({
    'aria-label': 'next',
    ...props,
    onClick: callAll(props.onClick, this.next),
  });
  getPauseControlProps = (props = {}) => ({
    'aria-label': 'pause',
    ...props,
    onClick: callAll(props.onClick, this.pause),
  });
  getPlayControlProps = (props = {}) => ({
    'aria-label': 'play',
    ...props,
    onClick: callAll(props.onClick, this.play),
  });
  getStepControlProps = ({ step, ...rest } = { step: 0 }) => ({
    'aria-label': 'change',
    ...rest,
    onClick: callAll(rest.onClick, () => this.changeSlide(step)),
  });

  setStepState = (nextState, callback = () => {}) => {
    this.interval = this.stopPlaying();
    if (this.isPropControlled('step')) {
      this.props.onChange(nextState.step, this.getStateAndHelpers());
      callback();
    } else {
      this.setState(nextState, () => {
        if (
          !this.interval &&
          this.props.duration &&
          !this.getControlledProp('paused')
        ) {
          this.interval = this.startPlaying();
        }
        this.props.onChange(
          this.getControlledProp('step'),
          this.getStateAndHelpers()
        );
        callback();
      });
    }
  };

  setPlayState = paused => {
    if (!this.props.duration) {
      return;
    }
    this.setState({ paused });
  };

  getNextStep(step = this.getControlledProp('step')) {
    if (this.props.total) {
      if (this.props.cycle) {
        if (step + this.props.stepInterval > this.props.total - 1) {
          return 0;
        }
      } else if (step + this.props.stepInterval > this.props.total - 1) {
        return this.props.total - 1;
      }
    }
    return step + this.props.stepInterval;
  }

  getPreviousStep(step = this.getControlledProp('step')) {
    if (this.props.total) {
      if (this.props.cycle) {
        if (step - this.props.stepInterval < 0) {
          return this.props.total - 1;
        }
      } else if (step - this.props.stepInterval < 0) {
        return 0;
      }
    }
    return step - this.props.stepInterval;
  }

  getValidStep(stepOffset) {
    if (this.props.total) {
      if (this.props.cycle) {
        return this.getControlledProp('step') + stepOffset - this.props.total;
      }
      if (this.getControlledProp('step') + stepOffset < 0) {
        return 0;
      } else if (
        this.getControlledProp('step') + stepOffset >
        this.props.total - 1
      ) {
        return this.props.total - 1;
      }
    }
    return this.getControlledProp('step') + stepOffset;
  }

  /**
   * The state of dub-step and prop getters/actions for changing the state are exposed as a parameter to the render prop.
   *
   * The paramters of this function can be split into 4 categories: State, Components, Actions.
   * - *State:* State properties of dub-step exposed to your render code. Controlled state can be passed as a prop and "controlled"
   *  by an outside component/router/store.
   * - *Components* Components that control the current step. They take a `component` prop which allows you to control your UI,
   *  add internal props, and pass through any additional props you add. Examples include: Step, Next, Previous, Play, Pause.
   *  _NOTE:_ Each component has an alternative and respective "prop getter", if that pattern is preferred. These are functions named get*ControlProps.
   *  Call/spread these on the element you're rendering for a given purpose. For example: `<button {...getNextControlProps(otherProps)}))>Next</button>`.
   *  It's advisable to pass all your props to that function rather than applying them on the element yourself to avoid your props being overridden (or overriding the props returned).
   * - *Actions:* Call these to directly change the state of dub-step.
   *
   * @typedef {object} StateAndHelpers
   *
   * @property {number} step - state - The current step of dub-step. Controlled.
   * @property {boolean} paused - state - Is dub-step paused? Controlled.
   * @property {boolean} animating - state - Is the step component transition animating?
   * @property {boolean} swiping - state - Has the swipe threshold been reached?
   * @property {boolean} dragging - state - Has the step component been initially dragged?
   * @property {number} swipeLeftDistance - state - A number representing the distance the step component has been dragged horizontally.
   * @property {number} swipeDownDistance - state - A number representing the distance the step component has been dragged vertically.
   * @property {boolean} swiped - state - Has the step component been dragged enough to be moved to the next/previous step?
   * @property {number} swipeRatio - state - A number between 0 and 1 with nearness to 1 representing closeness to being swiped.
   * @property {number} swipeDirectionSign - state - Either 1 or -1. 1 representing right and -1 representing left.
   * 
   * @property {ReactElement} Step - Component - This component is responsible for tracking touch/drag interactions and sets dub-steps swipe state properties respectively.
   *  Alternatively, use `getStepProps` if you prefer the prop getter patern. Returns the props you should apply to an element you render that is expected to have swipe/drag interactions.
   * @property {ReactElement} Next - Component - This component is responsible for incrementing the step by the stepInterval value.
   *  Alternatively, use `getNextControlProps` if you prefer the prop getter pattern. It returns the props you should apply to a next button element you render.
   * @property {ReactElement} Previous - Component - This component is responsible for decrementing the step by the stepInterval value.
   *  Alternatively, use `getPreviousControlProps` if you prefer the prop getter patern. It returns the props you should apply to a previous/back button element you render.
   * @property {ReactElement} Play - Component - This component is responsible for starting an internal interval that increments the step by the stepInterval value.
   *  Alternatively, use `getPlayControlProps` if you prefer the prop getter patern. It returns the props you should apply to a play button element you render.
   * @property {ReactElement} Pause - Component - This component is responsible for clearing an internal interval that increments the step by the stepInterval value.
   *  Alternatively, use `getPauseControlProps` if you prefer the prop getter patern. It returns the props you should apply to a pause button element you render.
   * @property {ReactElement} StepIndex - Component - This component is responsible for setting the current step of dub-step. _NOTE: It takes a step prop representing the step to which dub-step should change._
   *  Alternatively, use `getStepControlProps` if you prefer the prop getter patern. It returns the props you should apply to an element you render that sets the step of dub-step.
   * 
   * @property {function} next - Action - Increments the step by the stepInterval.
   * @property {function} previous - Action - Decrements the step by the stepInterval.
   * @property {function} play - Action - Starts the dub-step incrementor interval.
   * @property {function} pause - Action - Pauses dub-step.
   */

  /**
   * Returns state and helpers for render callback.
   * @private
   *
   * @return {StateAndHelpers}
   *  The state and helper functions exposed as a parameter to the render callback
   */
  getStateAndHelpers() {
    return {
      // State
      step: this.getControlledProp('step'),
      paused: this.getControlledProp('paused'),
      animating: this.state.animating,
      swiping: this.state.swiping,
      dragging: this.state.dragging,
      swipeLeftDistance: this.state.swipeLeftDistance,
      swipeDownDistance: this.state.swipeDownDistance,
      swiped: this.state.swiped,
      swipeRatio: this.state.swipeRatio,
      swipeDirectionSign: this.state.swipeDirectionSign,
      // Component/Prop getters
      Next: this.Next,
      getNextControlProps: this.getNextControlProps,
      Previous: this.Previous,
      getPreviousControlProps: this.getPreviousControlProps,
      Pause: this.Pause,
      getPauseControlProps: this.getPauseControlProps,
      Play: this.Play,
      getPlayControlProps: this.getPlayControlProps,
      StepIndex: this.StepIndex,
      getStepControlProps: this.getStepControlProps,
      Step: this.Step,
      getStepProps: this.getStepProps,
      // Actions
      next: this.next,
      previous: this.previous,
      pause: this.pause,
      play: this.play,
    };
  }

  /**
   * This component is responsible for tracking touch/drag interactions and sets dub-steps swipe state properties respectively.
   * 
   * @example
   * // In this example, GlamorousDogeImg is a glamorous.img. The only required prop here is component. The rest gets passed through for glamorous to for styling purposes (Like css transforms).
   * // NOTE: Glamorous is only used as an example. Any kind of component can be passed to the component prop.
   * // If no component is passed, a div will be used.
   * <Step
   *  component={GlamorousDogeImg}
   *  swipeLeftDistance={swipeLeftDistance}
   *  dragging={dragging}
   *  src={url}
   *  alt="doge pic"
   * />
   * 
   * @param {object} props
   * @param {ReactElement|string} [props.component=div] The element to render
   * @return {ReactElement}
   */
  Step = ({ component: Comp = 'div', ...otherProps }) => (
    <Comp {...this.getStepProps(otherProps)} />
  );

  /**
   * This component is responsible for incrementing the step by the stepInterval value.
   * 
   * @example
   * <Next>Next</Next>
   * 
   * @param {object} props
   * @param {ReactElement|string} [props.component=button] The element to render
   * @return {ReactElement}
   */
  Next = ({ component: Comp = 'button', ...otherProps }) => (
    <Comp {...this.getNextControlProps(otherProps)} />
  );

  /**
   * This component is responsible for decrementing the step by the stepInterval value.
   * 
   * @example
   * <Previous>Previous</Previous>
   *
   * @param {object} props
   * @param {ReactElement|string} [props.component=button] The element to render
   * @return {ReactElement}
   */
  Previous = ({ component: Comp = 'button', ...otherProps }) => (
    <Comp {...this.getPreviousControlProps(otherProps)} />
  );

  /**
   * This component is responsible for starting an internal interval that increments the step by the stepInterval value.
   * 
   * @example
   * // Any dub-step component can be customized by passing a `component` prop.
   * <Play component={MyCustomPlayButton}>Play</Play>
   * 
   * @param {object} props
   * @param {ReactElement|string} [props.component=button] The element to render
   * @return {ReactElement}
   */
  Play = ({ component: Comp = 'button', ...otherProps }) => (
    <Comp {...this.getPlayControlProps(otherProps)} />
  );

  /**
   * This component is responsible for clearing an internal interval that increments the step by the stepInterval value.
   * 
   * @example
   * <Pause>Stop</Pause>
   * 
   * @param {object} props
   * @param {ReactElement|string} [props.component=button] The element to render
   * @return {ReactElement}
   */
  Pause = ({ component: Comp = 'button', ...otherProps }) => (
    <Comp {...this.getPauseControlProps(otherProps)} />
  );

  /**
   * This component is responsible for setting the current step of dub-step.
   * 
   * @example
   * // Remember, any other prop added gets passed through to the component.
   * <StepIndex
   *   step={index}
   *   onMouseEnter={() => console.log(`About to switch to step ${index}`)}
   * >
   *   {stepNumber}
   * </StepIndex>
   *
   * @param {object} props
   * @param {number} step The step to which dub-step should change.
   * @param {ReactElement|string} [props.component=button] The element to render
   * @return {ReactElement}
   */
  StepIndex = ({ component: Comp = 'button', step, ...otherProps }) => (
    <Comp {...this.getStepControlProps({ step, ...otherProps })} />
  );

  isPropControlled(prop) {
    return this.props[prop] !== undefined;
  }

  startPlaying() {
    return setInterval(() => {
      this.next();
    }, this.props.duration);
  }

  stopPlaying() {
    return clearInterval(this.interval);
  }

  next = () => {
    const nextStep = this.getNextStep();
    this.props.onNext(nextStep, this.getStateAndHelpers());
    return this.changeSlide(nextStep);
  };
  previous = () => {
    const previousStep = this.getPreviousStep();
    this.props.onPrevious(previousStep, this.getStateAndHelpers());
    this.changeSlide(previousStep);
  };
  pause = () => {
    if (!this.isPropControlled('paused')) {
      this.setPlayState(true);
    }
    this.props.onPause(this.getStateAndHelpers());
  };
  play = () => {
    if (!this.isPropControlled('paused')) {
      this.setPlayState(false);
    }
    this.props.onPlay(this.getStateAndHelpers());
  };
  mouseEnter = e => {
    e.preventDefault();
    if (!this.getControlledProp('paused') && this.props.pauseOnHover) {
      this.pause();
      this.wasPlaying = true;
    }
  };
  mouseLeave = e => {
    e.preventDefault();
    if (
      this.wasPlaying === true &&
      this.getControlledProp('paused') &&
      this.props.pauseOnHover
    ) {
      this.play();
      delete this.wasPlaying;
    }
  };
  swipeStart = e => {
    if (
      this.props.swipe === false ||
      ('ontouchend' in document && this.props.swipe === false)
    ) {
      return;
    } else if (
      this.props.draggable === false &&
      e.type.indexOf('mouse') !== -1
    ) {
      return;
    }
    const posX = e.touches !== undefined ? e.touches[0].pageX : e.clientX;
    const posY = e.touches !== undefined ? e.touches[0].pageY : e.clientY;
    this.targetSize = e.target[this.props.vertical ? 'height' : 'width'];
    this.setState(
      {
        dragging: true,
        touchObject: {
          startX: posX,
          startY: posY,
          curX: posX,
          curY: posY,
          swipeLength: 0,
        },
      },
      () => {
        this.props.onSwipeStart({
          dragging: true,
          touchObject: this.state.touchObject,
        });
      }
    );
  };
  swipeMove = e => {
    e.preventDefault();
    if (!this.state.dragging) {
      return;
    }
    if (this.state.animating) {
      return;
    }
    const touchObject = this.state.touchObject;
    const axis = this.props.vertical ? 'Y' : 'X';
    touchObject.curX = e.touches ? e.touches[0].pageX : e.clientX;
    touchObject.curY = e.touches ? e.touches[0].pageY : e.clientY;

    touchObject.swipeLengthX = Math.round(
      Math.sqrt((touchObject.curX - touchObject.startX) ** 2)
    );
    touchObject.swipeLengthY = Math.round(
      Math.sqrt((touchObject.curY - touchObject.startY) ** 2)
    );
    touchObject.swipeLength = Math.round(
      Math.sqrt((touchObject[`cur${axis}`] - touchObject[`start${axis}`]) ** 2)
    );

    const positionOffsetX = touchObject.curX > touchObject.startX ? 1 : -1;
    const positionOffsetY = touchObject.curY > touchObject.startY ? 1 : -1;

    const swipeLeftDistance = touchObject.swipeLengthX * positionOffsetX;
    const swipeDownDistance = touchObject.swipeLengthY * positionOffsetY;
    const swipeDirectionSign = getSign(
      this.props.vertical ? swipeDownDistance : swipeLeftDistance
    );
    this.setState(
      {
        touchObject,
        swipeLeftDistance,
        swipeDownDistance,
        swiped:
          touchObject[`swipeLength${axis}`] >
          this.targetSize / this.props.touchThreshold,
        swipeRatio:
          touchObject[`swipeLength${axis}`] /
          (this.targetSize / this.props.touchThreshold),
        swipeDirectionSign,
      },
      () => {
        this.props.onSwipeMove(
          { swipeLeftDistance, swipeDownDistance, swiped: this.state.swiped },
          this.getStateAndHelpers()
        );
      }
    );

    if (touchObject.swipeLength > 4) {
      this.setState({ swiping: true });
    }
  };
  swipeEnd = e => {
    if (!this.state.dragging) {
      if (this.props.swipe) {
        e.preventDefault();
      }
      return;
    }
    const swipeDirectionSign = this.state.swipeDirectionSign;
    const touchObject = this.state.touchObject;
    const minSwipe = this.targetSize / this.props.touchThreshold;
    const wasAnimating = this.state.animating;

    // Reset the state of touch related state variables.
    const resetState = {
      dragging: false,
      swiping: false,
      swiped: false,
      swipeRatio: 0,
      swipeDirectionSign: 1,
      swipeLeftDistance: 0,
      swipeDownDistance: 0,
      touchObject: {
        startX: 0,
        startY: 0,
        curX: 0,
        curY: 0,
        swipeLength: 0,
        swipeLengthX: 0,
        swipeLengthY: 0,
      },
    };
    this.setState(resetState, () => {
      this.props.onSwipeEnd(resetState, this.getStateAndHelpers());
    });
    if (wasAnimating) {
      return;
    }

    if (!touchObject.swipeLength) {
      return;
    }

    if (touchObject.swipeLength > minSwipe) {
      e.preventDefault();

      if (this.props.swipeIterateOnly || swipeDirectionSign === -1) {
        this.next();
      } else {
        this.previous();
      }
    }
  };
  changeSlide = step => {
    if (this.props.onBeforeChange) {
      this.props.onBeforeChange(step, this.getStateAndHelpers());
    }

    const nextStateChanges = {
      animating: false,
      step,
      swipeLeftDistance: 0,
      swipeDownDistance: 0,
    };

    const callback = () => {
      this.setStepState(nextStateChanges, () => {
        if (this.props.onAfterChange) {
          this.props.onAfterChange(step, this.getStateAndHelpers());
        }
        delete this.animationEndCallback;
      });
    };

    this.setState(
      {
        // Only set animating if there is a animationSpeed prop.
        animating: Boolean(this.props.animationSpeed),
      },
      () => {
        if (this.props.animationSpeed) {
          this.animationEndCallback = setTimeout(
            callback,
            this.props.animationSpeed
          );
        } else {
          callback();
        }
      }
    );
  };

  render() {
    const renderProp = unwrapArray(this.props.children);
    return renderProp(this.getStateAndHelpers());
  }
}

export default DubStep;
