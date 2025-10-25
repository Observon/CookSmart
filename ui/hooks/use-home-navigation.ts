import { useCallback, useReducer } from "react"

export type HomeScreen =
  | "list"
  | "add-recipe"
  | "add-ingredient"
  | "recipe-detail"
  | "ingredients-list"
  | "edit-ingredient"
  | "ai-scanner"

interface NavigationState {
  currentScreen: HomeScreen
  previousScreen: HomeScreen | null
  selectedRecipeId: number | null
  editingRecipeId: number | null
  editingIngredientId: number | null
  recipeToDelete: number | null
  ingredientToDelete: number | null
}

const initialState: NavigationState = {
  currentScreen: "list",
  previousScreen: null,
  selectedRecipeId: null,
  editingRecipeId: null,
  editingIngredientId: null,
  recipeToDelete: null,
  ingredientToDelete: null,
}

type Action =
  | {
      type: "SET_SCREEN"
      screen: HomeScreen
      rememberPrevious: boolean
      clearPrevious: boolean
    }
  | { type: "RETURN_TO_PREVIOUS"; fallback: HomeScreen }
  | { type: "SET_SELECTED_RECIPE"; value: number | null }
  | { type: "SET_EDITING_RECIPE"; value: number | null }
  | { type: "SET_EDITING_INGREDIENT"; value: number | null }
  | { type: "SET_RECIPE_TO_DELETE"; value: number | null }
  | { type: "SET_INGREDIENT_TO_DELETE"; value: number | null }
  | { type: "RESET"; screen: HomeScreen }

function reducer(state: NavigationState, action: Action): NavigationState {
  switch (action.type) {
    case "SET_SCREEN": {
      const previous = action.rememberPrevious
        ? state.currentScreen
        : action.clearPrevious
        ? null
        : state.previousScreen

      return {
        ...state,
        currentScreen: action.screen,
        previousScreen: previous,
      }
    }
    case "RETURN_TO_PREVIOUS": {
      const nextScreen = state.previousScreen ?? action.fallback
      return {
        ...state,
        currentScreen: nextScreen,
        previousScreen: null,
      }
    }
    case "SET_SELECTED_RECIPE":
      return { ...state, selectedRecipeId: action.value }
    case "SET_EDITING_RECIPE":
      return { ...state, editingRecipeId: action.value }
    case "SET_EDITING_INGREDIENT":
      return { ...state, editingIngredientId: action.value }
    case "SET_RECIPE_TO_DELETE":
      return { ...state, recipeToDelete: action.value }
    case "SET_INGREDIENT_TO_DELETE":
      return { ...state, ingredientToDelete: action.value }
    case "RESET":
      return { ...initialState, currentScreen: action.screen }
    default:
      return state
  }
}

interface NavigateOptions {
  rememberPrevious?: boolean
}

export function useHomeNavigation(initialScreen: HomeScreen = "list") {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    currentScreen: initialScreen,
  })

  const navigateTo = useCallback(
    (screen: HomeScreen, options: NavigateOptions = {}) => {
      const rememberPrevious = !!options.rememberPrevious
      dispatch({
        type: "SET_SCREEN",
        screen,
        rememberPrevious,
        clearPrevious: !rememberPrevious,
      })
    },
    [],
  )

  const returnToPrevious = useCallback((fallback: HomeScreen) => {
    dispatch({ type: "RETURN_TO_PREVIOUS", fallback })
  }, [])

  const resetNavigation = useCallback(
    (screen: HomeScreen = initialScreen) => {
      dispatch({ type: "RESET", screen })
    },
    [initialScreen],
  )

  const selectRecipe = useCallback((value: number | null) => {
    dispatch({ type: "SET_SELECTED_RECIPE", value })
  }, [])

  const setEditingRecipe = useCallback((value: number | null) => {
    dispatch({ type: "SET_EDITING_RECIPE", value })
  }, [])

  const setEditingIngredient = useCallback((value: number | null) => {
    dispatch({ type: "SET_EDITING_INGREDIENT", value })
  }, [])

  const setRecipeDeletion = useCallback((value: number | null) => {
    dispatch({ type: "SET_RECIPE_TO_DELETE", value })
  }, [])

  const setIngredientDeletion = useCallback((value: number | null) => {
    dispatch({ type: "SET_INGREDIENT_TO_DELETE", value })
  }, [])

  return {
    currentScreen: state.currentScreen,
    selectedRecipeId: state.selectedRecipeId,
    editingRecipeId: state.editingRecipeId,
    editingIngredientId: state.editingIngredientId,
    recipeToDelete: state.recipeToDelete,
    ingredientToDelete: state.ingredientToDelete,
    navigateTo,
    returnToPrevious,
    resetNavigation,
    selectRecipe,
    setEditingRecipe,
    setEditingIngredient,
    setRecipeDeletion,
    setIngredientDeletion,
  }
}
