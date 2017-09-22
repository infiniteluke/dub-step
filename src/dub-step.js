import { Component } from 'react';
import PropTypes from 'prop-types';
import { callAll, unwrapArray, getSign } from './utils';

/**
 * # DubStep
 * <h1 align="center">
 *   dub-step 🕺🏽
 *   </br>
 *   <img src="https://user-images.githubusercontent.com/1127238/30524706-690c72e0-9bad-11e7-9feb-4c76f572bdfc.png" alt="dub-step logo" title="dub-step logo" width="100">
 * </h1>
 * <p align="center">Primitives for building index based UI widgets controlled by swipe, timers, and/or buttons.</p>
 * <hr />
 * </br>
 * Many existing carousel/swipe solutions in one way or another end up dictating the markup of your UI. They expose many options to allow for extensibility, but this results in a convoluted API that is not flexible. In these cases, your often very specific design must be fit into an existing rigid solution.
 * dub-step simply manages the state needed to power a carousel, slideshow, photo gallery, or even multi-step forms, allowing you to build the UI how you want. It uses the <a href="https://medium.com/merrickchristensen/function-as-child-components-5f3920a9ace9">function as child</a> and "prop getter" patterns, which gives you maximum flexibility with a minimal API.
 *
 * dub-step provides an API for updating an index.
 * - Directly when passed to getIndexControlProps(index) or an "action" is called.
 * - Incrementally when getNextControlProps/getPreviousControlProps is applied to a button.
 * - On swipe when getSlideProps is applied to a container of "slides".
 * - On a timer when getPlayControlProps/getPauseControlProps are applied to a button.
 * 
 */
class DubStep extends Component {
  /**
   * These props affect how/when the index and associated state is updated.
   * 
   * @type {object}
   * @property {number} total - The total number of slides. Defaults to `0`.
   * @property {number} defaultIndex - The initial index of dub-step. Defaults to `0`.
   * @property {boolean} cycle - Whether or not dub-step should cycle. Defaults to `false`.
   * @property {number} stepInterval - The number of slides to interate when navigating. Defaults to `1`.
   * @property {boolean} autoPlay - Should dub-step autoPlay? Defaults to `false`.
   * @property {number} duration - How long should each slide wait? Defaults to `0`.
   * @property {boolean} vertical - Are the slides changing vertically? Defaults to `false`.
   * @property {boolean} swipe - Are the slides swipable? Defaults to `false`.
   * @property {boolean} draggable - Are the slides draggable on desktop? Defaults to `false`.
   * @property {boolean} pauseOnHover - Should dub-step pause on hover? Defaults to `false`.
   * @property {number} touchThreshold - How much it takes to change slides. Defaults to `20`.
   * @property {number} swipeIterateOnly - Regardless of swipe direction, the index will be iterated. Defaults to `false`.
   * @property {number} animationSpeed - The transition animation speed. Defaults to `0`.
   * @property {function} onBeforeChange - Called immediately before the slide is changed. Defaults to `() => {}`.
   * @property {function} onChange - Called once the slide has changed. Defaults to `() => {}`.
   * @property {function} onAfterChange - Called after the slide has changed and after animationSpeed seconds if present. Defaults to `() => {}`.
   * @property {function} onPlay - Called when played. Defaults to `() => {}`.
   * @property {function} onPause - Called when paused. Defaults to `() => {}`.
   * @property {function} onNext - Called when iterating to the next slide. Defaults to `() => {}`.
   * @property {function} onPrevious - Called when iterating to the previous slide. Defaults to `() => {}`.
   * @property {function} onSwipeStart - Called when swiping/dragging has begun. Defaults to `() => {}`.
   * @property {function} onSwipeMove - Called when a swipe/drag is moved. Warning: This gets called _a lot_. Defaults to `() => {}`.
   * @property {function} onSwipeEnd - Called when a swipe/drag is cancelled. Defaults to `() => {}`.
   * @property {function|array} children - Called with an object containing current state and prop getters.
   */
  static propTypes = {
    total: PropTypes.number,
    defaultIndex: PropTypes.number,
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
    defaultIndex: 0,
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
   * @property {number} index - The current index of dub-step. Controlled.
   * @property {boolean} paused - Is dub-step paused? Controlled.
   * @property {boolean} animating - Is the slide transition animating?
   * @property {boolean} swiping - Has the swipe threshold been reached?
   * @property {boolean} dragging - Has the slide been initially dragged?
   * @property {number} swipeLeftDistance - A number representing the distance slide has been dragged horizontally.
   * @property {number} swipeDownDistance - A number representing the distance slide has been dragged vertically.
   * @property {boolean} swiped - Has the slide been dragged enough to be moved to the next/previous slide?
   * @property {number} swipeRatio - A number between 0 and 1 with nearness to 1 representing closeness to being swiped.
   * @property {number} swipeDirectionSign - Either 1 or -1. 1 representing right and -1 representing left.
   * @property {object} touchObject - Holds meta data used to calculate the swipe state.
   */
  state = {
    index: this.getControlledProp('index', { index: this.props.defaultIndex }),
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
        this.getControlledProp('index') === this.props.total - 1)
    ) {
      this.interval = this.stopPlaying();
    } else if (this.props.duration && (prevProps.paused || prevState.paused)) {
      this.interval = this.startPlaying();
    }
  }

  getControlledProp(prop, state = this.state) {
    return this.isPropControlled(prop) ? this.props[prop] : state[prop];
  }

  getSlideProps = (props = {}) => ({
    ...props,
    onMouseDown: callAll(props.onMouseDown, this.swipeStart),
    onMouseMove: callAll(
      props.onMouseMove,
      this.state.dragging ? this.swipeMove : () => {}
    ),
    onMouseUp: callAll(props.onMouseUp, this.swipeEnd),
    onMouseLeave: callAll(
      props.onMouseLeave,
      this.state.dragging ? this.swipeEnd : () => {}
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
  getIndexControlProps = ({ index, ...rest } = { index: 0 }) => ({
    'aria-label': 'change',
    ...rest,
    onClick: callAll(rest.onClick, () => this.setIndexState({ index })),
  });

  setIndexState = (nextState, callback = () => {}) => {
    this.interval = this.stopPlaying();
    if (this.isPropControlled('index')) {
      this.props.onChange(nextState.index, this.getStateAndHelpers());
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
          this.getControlledProp('index'),
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

  getNextIndex(index = this.getControlledProp('index')) {
    if (this.props.total) {
      if (this.props.cycle) {
        if (index + this.props.stepInterval > this.props.total - 1) {
          return 0;
        }
      } else if (index + this.props.stepInterval > this.props.total - 1) {
        return this.props.total - 1;
      }
    }
    return index + this.props.stepInterval;
  }

  getPreviousIndex(index = this.getControlledProp('index')) {
    if (this.props.total) {
      if (this.props.cycle) {
        if (index - this.props.stepInterval < 0) {
          return this.props.total - 1;
        }
      } else if (index - this.props.stepInterval < 0) {
        return 0;
      }
    }
    return index - this.props.stepInterval;
  }

  getValidIndex(indexOffset) {
    if (this.props.total) {
      if (this.props.cycle) {
        return this.getControlledProp('index') + indexOffset - this.props.total;
      }
      if (this.getControlledProp('index') + indexOffset < 0) {
        return 0;
      } else if (
        this.getControlledProp('index') + indexOffset >
        this.props.total - 1
      ) {
        return this.props.total - 1;
      }
    }
    return this.getControlledProp('index') + indexOffset;
  }

  /**
   * The state of dub-step and prop getters/actions for changing the state are exposed as a parameter to the render prop.
   * 
   * The paramters of this function can be split into three categories: State, Prop getters, and Actions.
   * - *State:* State properties of dub-step exposed to your render code. Controlled state can be passed as a prop and "controlled"
   *  by an outside component/router/store.
   * - *Prop getters:* Functions named like get*ControlProps. They are used to apply props to the elements that you render.
   *  This gives you maximum flexibility to render what, when, and wherever you like.
   *  You call these on the element in question (for example: `<button {...getNextControlProps()}))>Next</button>`.
   *  It's advisable to pass all your props to that function rather than applying them on the element yourself to avoid your props being overridden (or overriding the props returned).
   * - *Actions:* Call these to directly change the state of dub-step.
   * 
   * @typedef {object} StateAndHelpers
   * 
   * @property {number} index - state - The current index of dub-step. Controlled.
   * @property {boolean} paused - state - Is dub-step paused? Controlled.
   * @property {boolean} animating - state - Is the slide transition animating?
   * @property {boolean} swiping - state - Has the swipe threshold been reached?
   * @property {boolean} dragging - state - Has the slide been initially dragged?
   * @property {number} swipeLeftDistance - state - A number representing the distance slide has been dragged horizontally.
   * @property {number} swipeDownDistance - state - A number representing the distance slide has been dragged vertically.
   * @property {boolean} swiped - state - Has the slide been dragged enough to be moved to the next/previous slide?
   * @property {number} swipeRatio - state - A number between 0 and 1 with nearness to 1 representing closeness to being swiped.
   * @property {number} swipeDirectionSign - state - Either 1 or -1. 1 representing right and -1 representing left.
   * @property {function} getNextControlProps - Prop getter - Returns the props you should apply to a next button element you render.
   *    This button will be responsible for incrementing the index by the stepInterval value.
   * @property {function} getPreviousControlProps - Prop getter - Returns the props you should apply to a previous/back button element you render.
   *    This button will be responsible for decrementing the index by the stepInterval value.
   * @property {function} getPauseControlProps - Prop getter - Returns the props you should apply to a previous button element you render.
   *    This button will be responsible for decrementing the index by the stepInterval value.
   * @property {function} getPlayControlProps - Prop getter - Returns the props you should apply to a play button element you render.
   *    This button will be responsible for starting an internal interval that increments the index by the stepInterval value.
   * @property {function} getPauseControlProps - Prop getter - Returns the props you should apply to a pause button element you render.
   *    This button will be responsible for clearing an internal interval that increments the index by the stepInterval value.
   * @property {function} getIndexControlProps - Prop getter - Returns the props you should apply to an element you render that sets the index of dub-step.
   *    This button will be responsible for setting the index of dub-step. _NOTE: It takes an object with an index property as a parameter._
   * @property {function} getSlideProps - Prop getter - Returns the props you should apply to an element you render that is expected to have swipe/drag interactions.
   *    This button will be responsible for tracking touch/drag interactions and sets dub-steps swipe state properties respectively.
   * @property {function} next - Action - Increments the index by the stepInterval.
   * @property {function} previous - Action - Decrements the index by the stepInterval.
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
      index: this.getControlledProp('index'),
      paused: this.getControlledProp('paused'),
      animating: this.state.animating,
      swiping: this.state.swiping,
      dragging: this.state.dragging,
      swipeLeftDistance: this.state.swipeLeftDistance,
      swipeDownDistance: this.state.swipeDownDistance,
      swiped: this.state.swiped,
      swipeRatio: this.state.swipeRatio,
      swipeDirectionSign: this.state.swipeDirectionSign,
      getNextControlProps: this.getNextControlProps,
      getPreviousControlProps: this.getPreviousControlProps,
      getPauseControlProps: this.getPauseControlProps,
      getPlayControlProps: this.getPlayControlProps,
      getIndexControlProps: this.getIndexControlProps,
      getSlideProps: this.getSlideProps,
      next: this.next,
      previous: this.previous,
      pause: this.pause,
      play: this.play,
    };
  }

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
    const nextIndex = this.getNextIndex();
    this.props.onNext(nextIndex, this.getStateAndHelpers());
    return this.changeSlide(nextIndex);
  };
  previous = () => {
    const previousIndex = this.getPreviousIndex();
    this.props.onPrevious(previousIndex, this.getStateAndHelpers());
    this.changeSlide(previousIndex);
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

      let newIndex;

      switch (swipeDirectionSign) {
        case -1:
          newIndex = this.getNextIndex();
          break;
        case 1:
          newIndex = this.props.swipeIterateOnly
            ? this.getNextIndex()
            : this.getPreviousIndex();
          break;
        default:
          newIndex = this.getControlledProp('index');
      }

      this.changeSlide(newIndex);
    }
  };
  changeSlide = index => {
    if (this.props.onBeforeChange) {
      this.props.onBeforeChange(index, this.getStateAndHelpers());
    }

    const nextStateChanges = {
      animating: false,
      index,
      swipeLeftDistance: 0,
      swipeDownDistance: 0,
    };

    const callback = () => {
      this.setIndexState(nextStateChanges, () => {
        if (this.props.onAfterChange) {
          this.props.onAfterChange(index, this.getStateAndHelpers());
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
