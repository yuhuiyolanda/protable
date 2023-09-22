import { useReducer } from 'react';


/**
 * 模拟class组件批量更新state
 * @param {*} initialState 初始状态
 * @returns state setState
 */

export const useCompositeState = initialState => {
    const [state, dispatch] = useReducer((state, action) => {
      switch (action.type) {
        case 'setState':
          return { ...state, ...action.payload };
        default:
          break;
      }
    }, initialState);
    const setState = partialState => {
      dispatch({ type: 'setState', payload: partialState });
    };
    return [state, setState];
  };
  