import {db} from '../../App';
import {SideMenuEvent} from '../utils/utils';
import {ACTIONS} from './actions';

export const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.NOTES:
      let notes;
      if (action.sort) {
        notes = db.notes.group(action.sort);
      } else {
        notes = db.notes.group();
      }

      return {
        ...state,
        notes: notes,
        loading: false,
      };
    case ACTIONS.THEME: {
      return {
        ...state,
        colors: {...action.colors},
      };
    }
    case ACTIONS.USER: {
      let user = action.user;
      return {
        ...state,
        user: user,
      };
    }
    case ACTIONS.NOTEBOOKS: {
      return {
        ...state,
        notebooks: db.notebooks.all,
      };
    }
    case ACTIONS.TRASH: {
      return {
        ...state,
        trash: db.trash.all,
      };
    }
    case ACTIONS.PINNED: {
      let pinned = db.notes.pinned;
      return {
        ...state,
        pinned: pinned,
      };
    }
    case ACTIONS.CURRENT_SCREEN: {
      return {
        ...state,
        currentScreen: action.screen,
      };
    }
    case ACTIONS.TAGS: {
      return {
        ...state,
        tags: db.tags.all,
      };
    }
    case ACTIONS.FAVORITES: {
      return {
        ...state,
        favorites: db.notes.favorites,
      };
    }
    case ACTIONS.COLORS: {
      return {
        ...state,
        colorNotes: db.colors.all,
      };
    }
    case ACTIONS.SELECTION_MODE: {
      if (action.enabled) {
        SideMenuEvent.disable();
      } else {
        SideMenuEvent.enable();
      }

      return {
        ...state,
        selectionMode: action.enabled,
      };
    }
    case ACTIONS.SELECTED_ITEMS: {
      let selectedItems = [...state.selectedItemsList];
      if (selectedItems.includes(action.item)) {
        selectedItems.splice(selectedItems.indexOf(action.item), 1);
      } else {
        selectedItems.push(action.item);
      }

      return {
        ...state,
        selectedItemsList: selectedItems,
      };
    }
    case ACTIONS.CLEAR_SELECTION: {
      return {
        ...state,
        selectedItemsList: [],
      };
    }
    case ACTIONS.MODAL_NAVIGATOR: {
      return {
        ...state,
        preventDefaultMargins: action.enabled,
      };
    }
    case ACTIONS.LOGIN_NAVIGATOR: {
      return {
        ...state,
        isLoginNavigator: action.enabled,
      };
    }
    case ACTIONS.CURRENT_EDITING_NOTE: {
      return {
        ...state,
        currentEditingNote: action.id,
      };
    }
    case ACTIONS.SEARCH_RESULTS: {
      let results = action.results;
      return {
        ...state,
        searchResults: [...results],
      };
    }
    default:
      throw new Error('unknown action type');
  }
};
