// src/app/my-recipes/page.js
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';
import IngredientAutocomplete from '@/components/IngredientAutocomplete';
import { useAuth } from '@/components/AuthProvider';

const MyRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ 
    name: '', 
    ingredients: [], 
    instructions: '',
    prepTime: ''
  });
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(null);
  const router = useRouter();
  const { user, loading: authLoading, getToken } = useAuth();
  
  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/recipes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientSelect = (ingredient) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient]
    }));
  };

  const handleCreateRecipe = async () => {
    try {
      const token = await getToken(); 
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRecipe.name,
          ingredients: newRecipe.ingredients,
          instructions: newRecipe.instructions,
          prepTime: parseInt(newRecipe.prepTime)
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }
  
      const data = await response.json();
  
      setRecipes(prev => [data, ...prev]);
      setIsCreatingRecipe(false);
      setNewRecipe({ name: '', ingredients: [], instructions: '', prepTime: '' });
    } catch (err) {
      console.error('Error creating recipe:', err);
      setError(err.message);
    }
  };

  const calculateTotalNutrition = (recipe) => {
    return recipe.ingredients.reduce(
      (total, ingredient) => {
        total.protein += ingredient.protein;
        total.fat += ingredient.fat;
        total.carbohydrates += ingredient.carbohydrates;
        total.calories += ingredient.calories;
        return total;
      },
      { protein: 0, fat: 0, carbohydrates: 0, calories: 0 }
    );
  };

  const removeIngredient = (index) => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleEditClick = () => {
    setEditedRecipe(selectedRecipe);
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedRecipe({ ...editedRecipe, [name]: value });
  };

  const fetchNutritionalInfo = async (ingredientName) => {
    // Replace with your API call
    const response = await fetch(`https://api.example.com/nutrition?ingredient=${ingredientName}`);
    const data = await response.json();
    return data;
  };

  const handleIngredientChange = async (index, e) => {
    const { name, value } = e.target;
    const updatedIngredients = editedRecipe.ingredients.map((ingredient, i) =>
      i === index ? { ...ingredient, [name]: value } : ingredient
    );
    setEditedRecipe({ ...editedRecipe, ingredients: updatedIngredients });

    if (name === 'name') {
      const nutritionInfo = await fetchNutritionalInfo(value);
      const updatedIngredientsWithNutrition = updatedIngredients.map((ingredient, i) =>
        i === index ? { ...ingredient, ...nutritionInfo } : ingredient
      );
      setEditedRecipe({ ...editedRecipe, ingredients: updatedIngredientsWithNutrition });
    }
  };

  const handleSaveClick = () => {
      // Save the edited recipe (e.g., update state or make an API call)
      setSelectedRecipe(editedRecipe);
      setIsEditing(false);
    };
  
    const handleDeleteClick = async (recipeId) => {
      try {
        const token = await getToken();
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (!response.ok) {
          throw new Error('Failed to delete recipe');
        }
  
        // Remove the deleted recipe from the state
        setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
        setSelectedRecipe(null);
      } catch (err) {
        console.error('Error deleting recipe:', err);
        setError(err.message);
      }
    };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#F5E9D4] text-[#3C4E2A] flex flex-col">
      <div className="flex-grow p-4">
        <h1 className="text-2xl font-bold mb-4">MY RECIPES</h1>

        {recipes.length === 0 ? (
          <div className="text-center mb-4">
            <p className="font-bold">Oops... there is nothing saved here...</p>
            <p>Start saving your recipes to keep track of the ingredients you use!</p>
          </div>
        ) : (
          <ul className="mb-4">
            {recipes.map(recipe => (
              <li key={recipe.id} className="mb-2">
                <button onClick={() => setSelectedRecipe(recipe)} className="text-left">
                  {recipe.name} {recipe.prep_time ? `(Prep time: ${recipe.prep_time} minutes)` : ''}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setIsCreatingRecipe(true)}
          className="bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded mb-4"
        >
          + Create New Recipe
        </button>

        {isCreatingRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-[#F5E9D4] p-4 rounded-lg w-full max-w-md m-4">
              <h2 className="text-xl font-bold mb-2">Create New Recipe</h2>
              <input
                type="text"
                value={newRecipe.name}
                onChange={(e) =>
                  setNewRecipe((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Recipe Name"
                className="w-full p-2 mb-2 border border-[#3C4E2A] rounded"
              />
              <input
                type="number"
                value={newRecipe.prepTime}
                onChange={(e) =>
                  setNewRecipe((prev) => ({
                    ...prev,
                    prepTime: e.target.value,
                  }))
                }
                placeholder="Prep Time (minutes)"
                className="w-full p-2 mb-2 border border-[#3C4E2A] rounded"
              />
              <IngredientAutocomplete
                onIngredientSelect={handleIngredientSelect}
              />
              {newRecipe.ingredients.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-bold mb-2">
                    Selected Ingredients
                  </h3>
                  <ul>
                    {newRecipe.ingredients.map((ingredient, index) => (
                      <li
                        key={index}
                        className="mb-1 flex justify-between items-center"
                      >
                        <span>
                          {ingredient.name} ({ingredient.weight}g) - Protein:{" "}
                          {ingredient.protein.toFixed(2)}g, Fat:{" "}
                          {ingredient.fat.toFixed(2)}g, Carbs:{" "}
                          {ingredient.carbohydrates.toFixed(2)}g, Calories:{" "}
                          {ingredient.calories.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeIngredient(index)}
                          className="text-red-500 ml-2"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <h3 className="text-lg font-bold mt-4 mb-2">
                    Total Nutrition
                  </h3>
                  <p>
                    Protein:{" "}
                    {calculateTotalNutrition(newRecipe).protein.toFixed(2)}g,
                    Fat: {calculateTotalNutrition(newRecipe).fat.toFixed(2)}g,
                    Carbs:{" "}
                    {calculateTotalNutrition(newRecipe).carbohydrates.toFixed(
                      2
                    )}
                    g, Calories:{" "}
                    {calculateTotalNutrition(newRecipe).calories.toFixed(2)}
                  </p>
                </div>
              )}
              <textarea
                value={newRecipe.instructions}
                onChange={(e) =>
                  setNewRecipe((prev) => ({
                    ...prev,
                    instructions: e.target.value,
                  }))
                }
                placeholder="Instructions"
                className="w-full p-2 mb-2 border border-[#3C4E2A] rounded"
                rows="4"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => setIsCreatingRecipe(false)}
                  className="bg-[#FF7F50] text-[#F5E9D4] px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRecipe}
                  className="bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-[#F5E9D4] p-4 rounded-lg w-full max-w-md m-4">
              <h2 className="text-xl font-bold mb-2">{selectedRecipe.name}</h2>
              {selectedRecipe.prep_time && <p className="mb-2">Prep Time: {selectedRecipe.prep_time} minutes</p>}
              <h3 className="text-lg font-bold mt-4 mb-2">Ingredients</h3>
              <ul>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="mb-1">
                    {ingredient.name} ({ingredient.weight}g) - Protein:{" "}
                    {ingredient.protein.toFixed(2)}g, Fat:{" "}
                    {ingredient.fat.toFixed(2)}g, Carbs:{" "}
                    {ingredient.carbohydrates.toFixed(2)}g, Calories:{" "}
                    {ingredient.calories.toFixed(2)}
                  </li>
                ))}
              </ul>
              <h3 className="text-lg font-bold mt-4 mb-2">Total Nutrition</h3>
              <p>
                Protein:{" "}
                {calculateTotalNutrition(selectedRecipe).protein.toFixed(2)}g,
                Fat: {calculateTotalNutrition(selectedRecipe).fat.toFixed(2)}g,
                Carbs:{" "}
                {calculateTotalNutrition(selectedRecipe).carbohydrates.toFixed(
                  2
                )}
                g, Calories:{" "}
                {calculateTotalNutrition(selectedRecipe).calories.toFixed(2)}
              </p>
              <h3 className="text-lg font-bold mt-4 mb-2">Instructions</h3>
              <p>{selectedRecipe.instructions}</p>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="mt-4 bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded"
              >
                Close
              </button>
              <button
                onClick={handleEditClick}
                className="mt-4 bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded ml-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(selectedRecipe.id)}
                className="mt-4 bg-red-600 text-[#F5E9D4] px-4 py-2 rounded ml-2"
              >
                Delete
              </button>
              {isEditing && (
                <div className="mt-4 p-4 border rounded bg-[#F5E9D4]">
                  <h3 className="text-lg font-bold mb-2">Edit Recipe</h3>
                  <form>
                    <div className="mb-4">
                      <label className="block mb-2 font-bold">Name:</label>
                      <input
                        type="text"
                        name="name"
                        value={editedRecipe.name}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2 font-bold">Instructions:</label>
                      <textarea
                        name="instructions"
                        value={editedRecipe.instructions}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Ingredients:</h4>
                      {editedRecipe.ingredients.map((ingredient, index) => (
                        <div key={index} className="mb-2">
                          <input
                            type="text"
                            name="name"
                            value={ingredient.name}
                            onChange={(e) => handleIngredientChange(index, e)}
                            className="w-1/2 p-2 border rounded mr-2"
                            placeholder="Name"
                          />
                          <input
                            type="number"
                            name="calories"
                            value={ingredient.calories}
                            onChange={(e) => handleIngredientChange(index, e)}
                            className="w-1/4 p-2 border rounded"
                            placeholder="Calories"
                          />
                          <input
                            type="number"
                            name="protein"
                            value={ingredient.protein}
                            onChange={(e) => handleIngredientChange(index, e)}
                            className="w-1/4 p-2 border rounded"
                            placeholder="Protein"
                          />
                          <input
                            type="number"
                            name="fat"
                            value={ingredient.fat}
                            onChange={(e) => handleIngredientChange(index, e)}
                            className="w-1/4 p-2 border rounded"
                            placeholder="Fat"
                          />
                          <input
                            type="number"
                            name="carbohydrates"
                            value={ingredient.carbohydrates}
                            onChange={(e) => handleIngredientChange(index, e)}
                            className="w-1/4 p-2 border rounded"
                            placeholder="Carbs"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveClick}
                      className="mt-4 bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded"
                    >
                      Save
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRecipesPage;
