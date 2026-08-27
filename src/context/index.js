import React from 'react';

import { createTypedReducer, getTranslations } from '@playerstack/core';

// ─── createPlayerContext (self-contained, previously from core/hooks) ───

/**
 * Factory that creates a typed player context with reducer, Provider, and hooks.
 * The Provider uses useReducer internally with createTypedReducer(actionTypes).
 * Initializes i18n field in state from getTranslations(language).
 */
function createPlayerContext({ actionTypes, initialState, getTranslationsFn }) {
  const getTranslationsFnResolved = getTranslationsFn || getTranslations;
  const reducer = createTypedReducer(actionTypes);

  const Context = React.createContext({
    state: initialState,
    dispatch: () => null,
  });

  const Provider = ({ children, language }) => {
    const [state, dispatch] = React.useReducer(reducer, {
      ...initialState,
      i18n: getTranslationsFnResolved(language || 'en'),
    });

    const prevLanguageRef = React.useRef(language);
    React.useEffect(() => {
      if (prevLanguageRef.current !== language) {
        prevLanguageRef.current = language;
        dispatch({ type: 'i18n', payload: getTranslationsFnResolved(language || 'en') });
      }
    }, [language, dispatch]);

    const context = React.useMemo(() => ({ state, dispatch }), [state, dispatch]);

    return React.createElement(Context.Provider, { value: context }, children);
  };

  Provider.displayName = 'PlayerContextProvider';

  const useSelector = () => {
    const { state } = React.useContext(Context);
    return state;
  };

  const useDispatch = () => {
    const { state, dispatch } = React.useContext(Context);

    const stateRef = React.useRef(state);
    stateRef.current = state;

    const enhancedDispatch = React.useCallback(
      (action) => {
        if (typeof action === 'function') {
          const resolvedAction = action(stateRef.current);
          dispatch(resolvedAction);
        } else {
          dispatch(action);
        }
      },
      [dispatch],
    );

    return enhancedDispatch;
  };

  return { Context, Provider, useSelector, useDispatch };
}

// ─── App Context Instance ───

const actionTypes = [
  'i18n',
  'captionDragging',
  'contextMenuVisible',
  'controlsHovering',
  'hiding',
  'menuVisible',
  'subMenuVisible',
  'timeSliding',
  'volumeSliding',
  'videoRef',
  'playerRef',
];

const initialState = {
  i18n: {},
  captionDragging: false,
  contextMenuVisible: false,
  controlsHovering: false,
  hiding: true,
  menuVisible: false,
  subMenuVisible: false,
  timeSliding: false,
  volumeSliding: false,
  videoRef: null,
  playerRef: null,
};

const { Context, Provider, useSelector, useDispatch } = createPlayerContext({
  actionTypes,
  initialState,
  getTranslationsFn: getTranslations,
});

// Export hooks with app-specific names so consumers import without aliases
const useAppSelector = useSelector;
const useAppDispatch = useDispatch;

export { Context, Provider, useAppSelector, useAppDispatch, actionTypes, initialState };
