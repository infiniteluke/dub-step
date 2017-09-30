import React from 'react';
import { render, mount } from 'enzyme';
import DubStep from '../dub-step';

test('Renders without errors', () => {
  render(<DubStep>{({ step }) => <div>{step}</div>}</DubStep>);
});

test('Throws if cycle prop is provided without a total prop', () => {
  const element = <DubStep cycle>{({ step }) => <div>{step}</div>}</DubStep>;
  expect(() => render(element)).toThrow();
});

test('Throws if autoPlay prop is provided without a duration prop', () => {
  const element = <DubStep autoPlay>{({ step }) => <div>{step}</div>}</DubStep>;
  expect(() => render(element)).toThrow();
});

test('Starts playing on mount if duration/autoPlay is provided', () => {
  const spy = jest.spyOn(DubStep.prototype, 'startPlaying');
  const element = mount(
    <DubStep autoPlay duration={150}>
      {({ step }) => <div>{step}</div>}
    </DubStep>
  );
  expect(element.instance().state.paused).toBe(false);
  expect(spy).toHaveBeenCalled();
});
