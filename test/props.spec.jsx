import React from 'react';
import { render, screen } from '@testing-library/react';

import PlayerStack from '@';

describe('PlayerStack - props', () => {
  const renderComponent = (props) => {
    return render(<PlayerStack {...props} />);
  };

  test('className', () => {
    renderComponent({ className: 'reactjs-player' });
    expect(screen.getByTestId('media-player-skin')).toHaveClass('reactjs-player');
  });

  test('style', () => {
    renderComponent({ style: { marginTop: '1rem' } });
    expect(screen.getByTestId('media-player-skin')).toHaveStyle('margin-top:1rem;');
  });

  test('wrapper - string', () => {
    renderComponent({ wrapper: 'span' });
    expect(screen.getByTestId('media-player-skin').nodeName.toLowerCase()).toBe('span');
  });

  // test('wrapper - element', (t) => {
  //   const Element = () => null;
  //   renderComponent({ wrapper: Element });
  //   expect(screen.queryByTestId('media-player-skin')).toBeFalsy();
  // });
});
