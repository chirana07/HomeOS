import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Utensils, Clock, Flame, Sparkles, CheckCircle2, X, BookOpen, ChevronRight, Heart, Users, Tag, AlertTriangle, Plus, Trash2, Layers } from 'lucide-react-native';
import { getRecipes, createRecipe } from '../../services/api';

export default function MobileRecipesScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 4, 32);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  // Add Recipe Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCuisine, setNewCuisine] = useState('Sri Lankan');
  const [newMealType, setNewMealType] = useState('Lunch/Dinner');
  const [newCookTime, setNewCookTime] = useState('25');
  const [newIngredients, setNewIngredients] = useState([
    { name: 'Rice', quantity: '200', unit: 'g' },
    { name: 'Eggs', quantity: '2', unit: 'units' }
  ]);
  const [newInstructions, setNewInstructions] = useState([
    'Prep ingredients and aromatics.',
    'Cook until tender and flavorful.',
    'Season to taste and serve.'
  ]);
  const [newTags, setNewTags] = useState('Quick Meal; High Protein; Sri Lankan');
  const [savingRecipe, setSavingRecipe] = useState(false);

  const filters = [
    'All',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Sri Lankan',
    'Indian',
    'Chinese',
    'Italian',
    'Quick Meals',
    'Healthy',
    'Available Now',
    'Need Shopping',
  ];

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await getRecipes();
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error('Failed to load mobile recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddIngredientRow = () => {
    setNewIngredients(prev => [...prev, { name: '', quantity: '100', unit: 'g' }]);
  };

  const handleRemoveIngredientRow = (idx: number) => {
    if (newIngredients.length <= 1) return;
    setNewIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx: number, field: string, val: string) => {
    setNewIngredients(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleAddStepRow = () => {
    setNewInstructions(prev => [...prev, '']);
  };

  const handleRemoveStepRow = (idx: number) => {
    if (newInstructions.length <= 1) return;
    setNewInstructions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleStepChange = (idx: number, val: string) => {
    setNewInstructions(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleSaveRecipe = async () => {
    if (!newRecipeName.trim()) {
      Alert.alert('Required Field', 'Please enter a recipe name.');
      return;
    }
    const validIngs = newIngredients.filter(i => i.name.trim());
    if (validIngs.length === 0) {
      Alert.alert('Required Field', 'Please add at least one valid ingredient.');
      return;
    }

    setSavingRecipe(true);
    try {
      const payload = {
        recipe_name: newRecipeName.trim(),
        recipe_summary: newSummary.trim(),
        cuisine: newCuisine,
        meal_type: newMealType,
        cooking_time: parseInt(newCookTime, 10) || 25,
        nutrition_score: 85,
        ingredients: validIngs.map(i => ({
          name: i.name.trim(),
          quantity: parseFloat(i.quantity) || 1,
          unit: i.unit.trim() || 'g'
        })),
        instructions: newInstructions.filter(s => s.trim()),
        tags: newTags.split(';').map(t => t.trim()).filter(Boolean)
      };

      await createRecipe(payload);
      Alert.alert('Recipe Created!', `Recipe '${newRecipeName}' indexed into AI vector knowledge base.`);
      setIsAddModalOpen(false);
      setNewRecipeName('');
      setNewSummary('');
      await loadRecipes();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Failed to save recipe.');
    } finally {
      setSavingRecipe(false);
    }
  };

  const filteredRecipes = recipes.filter(r => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      r.recipe_name.toLowerCase().includes(query) ||
      r.cuisine.toLowerCase().includes(query) ||
      (r.ingredients && r.ingredients.some((i: string) => i.toLowerCase().includes(query)));

    if (!matchesSearch) return false;
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Available Now') return r.availability_status === 'Available Now';
    if (selectedFilter === 'Need Shopping') return r.availability_status === 'Need Shopping';

    const fLower = selectedFilter.toLowerCase();
    const cuisineMatch = r.cuisine.toLowerCase() === fLower;
    const mealMatch = r.meal_type.toLowerCase().includes(fLower);
    const tagMatch = r.tags && r.tags.some((t: string) => t.toLowerCase().includes(fLower));

    return cuisineMatch || mealMatch || tagMatch;
  });

  const getIngredientQtyString = (recipe: any, ingName: string) => {
    if (!recipe.ingredients_json) return '1 portion';
    const lowerName = ingName.toLowerCase().trim();
    for (const [key, val] of Object.entries(recipe.ingredients_json)) {
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
        if (typeof val === 'number') {
          if (key.includes('egg')) return `${val} unit(s)`;
          if (key.includes('oil') || key.includes('sauce') || key.includes('milk')) return `${val} ml`;
          return `${val} g`;
        }
        return `${val}`;
      }
    }
    return '1 portion';
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" translucent={false} />
      
      {/* Top Header View */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconCircle}>
            <BookOpen size={18} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Recipe Library</Text>
            <Text style={styles.headerSubtitle}>{recipes.length} Recipes • AI Knowledge Base</Text>
          </View>
          <TouchableOpacity onPress={() => setIsAddModalOpen(true)} style={styles.addBtnHeader} activeOpacity={0.8}>
            <Plus size={14} color="#ffffff" />
            <Text style={styles.addBtnHeaderText}>Add Recipe</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body */}
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recipes, cuisines, ingredients..."
            placeholderTextColor="#64748b"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScrollView} contentContainerStyle={styles.chipsContainer}>
          {filters.map(filter => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.chip, isActive && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recipe Cards List */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loaderText}>Syncing recipes with live SQLite pantry...</Text>
          </View>
        ) : filteredRecipes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Utensils size={36} color="#475569" />
            <Text style={styles.emptyTitle}>No matching recipes</Text>
            <Text style={styles.emptySub}>Try adjusting your search query or create a new recipe.</Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {filteredRecipes.map(r => {
              const isFav = favorites[r.id];
              const isAvailable = r.availability_status === 'Available Now';

              return (
                <View key={r.id} style={styles.recipeCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cuisineBadge}>
                      <Text style={styles.cuisineText}>{r.cuisine} • {r.meal_type}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleFavorite(r.id)}>
                      <Heart size={16} color={isFav ? '#f43f5e' : '#64748b'} fill={isFav ? '#f43f5e' : 'none'} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.cardTitle}>{r.recipe_name}</Text>
                  {r.recipe_summary ? (
                    <Text style={styles.cardSummary}>{r.recipe_summary}</Text>
                  ) : null}

                  <View style={styles.metricsRow}>
                    <View style={[styles.metricBadge, r.pantry_match_pct >= 85 ? styles.badgeGreen : styles.badgeAmber]}>
                      <Text style={[styles.metricText, r.pantry_match_pct >= 85 ? styles.textGreen : styles.textAmber]}>
                        Match {r.pantry_match_pct}%
                      </Text>
                    </View>
                    <View style={styles.metricBadgeGray}>
                      <Flame size={12} color="#fb923c" />
                      <Text style={styles.metricTextGray}>{r.health_score} / 10</Text>
                    </View>
                    <View style={styles.metricBadgeGray}>
                      <Clock size={12} color="#94a3b8" />
                      <Text style={styles.metricTextGray}>{r.cooking_time}</Text>
                    </View>
                  </View>

                  {/* AI Recommendation Reason */}
                  {r.ai_recommendation_reason ? (
                    <View style={styles.aiBox}>
                      <Sparkles size={12} color="#818cf8" style={{ marginTop: 1 }} />
                      <Text style={styles.aiText}>{r.ai_recommendation_reason}</Text>
                    </View>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={[styles.statusText, isAvailable ? styles.textGreen : styles.textAmber]}>
                      {isAvailable ? '🟢 Available Now' : `🛒 Need ${r.missing_ingredients?.length || 0} item(s)`}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedRecipe(r)} style={styles.detailsBtn} activeOpacity={0.8}>
                      <Text style={styles.detailsBtnText}>Details</Text>
                      <ChevronRight size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Recipe Modal Form */}
      {isAddModalOpen && (
        <Modal visible={isAddModalOpen} animationType="slide" transparent={false} onRequestClose={() => setIsAddModalOpen(false)}>
          <View style={[styles.modalFullScreen, { paddingTop: topPadding }]}>
            <View style={styles.modalHeaderBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cuisineTextModal}>AI Knowledge Base</Text>
                <Text style={styles.modalHeaderTitle}>Create New Recipe</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)} style={styles.modalCloseIconBtn}>
                <X size={20} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 4 }}>
                <Text style={styles.formLabel}>Recipe Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newRecipeName}
                  onChangeText={setNewRecipeName}
                  placeholder="e.g. Traditional Dhal Curry"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.formLabel}>Recipe Summary / Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 60 }]}
                  value={newSummary}
                  onChangeText={setNewSummary}
                  placeholder="Brief description of tastes & prep..."
                  placeholderTextColor="#64748b"
                  multiline
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.formLabel}>Cuisine</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newCuisine}
                    onChangeText={setNewCuisine}
                    placeholder="Sri Lankan"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.formLabel}>Meal Type</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newMealType}
                    onChangeText={setNewMealType}
                    placeholder="Lunch/Dinner"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.sectionTitleText}>Ingredients List</Text>
                  <TouchableOpacity onPress={handleAddIngredientRow} style={styles.addRowBtn}>
                    <Plus size={12} color="#818cf8" />
                    <Text style={styles.addRowBtnText}>Add Ingredient</Text>
                  </TouchableOpacity>
                </View>

                {newIngredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingFormRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 2 }]}
                      value={ing.name}
                      onChangeText={(val) => handleIngredientChange(idx, 'name', val)}
                      placeholder="Ingredient (e.g. Garlic)"
                      placeholderTextColor="#64748b"
                    />
                    <TextInput
                      style={[styles.formInput, { flex: 1, textAlign: 'center' }]}
                      value={ing.quantity}
                      onChangeText={(val) => handleIngredientChange(idx, 'quantity', val)}
                      placeholder="Qty"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.formInput, { flex: 1, textAlign: 'center' }]}
                      value={ing.unit}
                      onChangeText={(val) => handleIngredientChange(idx, 'unit', val)}
                      placeholder="Unit"
                      placeholderTextColor="#64748b"
                    />
                    <TouchableOpacity onPress={() => handleRemoveIngredientRow(idx)} style={{ padding: 4 }}>
                      <Trash2 size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.sectionTitleText}>Preparation Steps</Text>
                  <TouchableOpacity onPress={handleAddStepRow} style={styles.addRowBtn}>
                    <Plus size={12} color="#34d399" />
                    <Text style={[styles.addRowBtnText, { color: '#34d399' }]}>Add Step</Text>
                  </TouchableOpacity>
                </View>

                {newInstructions.map((step, idx) => (
                  <View key={idx} style={styles.stepFormRow}>
                    <Text style={styles.stepFormNum}>{idx + 1}</Text>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      value={step}
                      onChangeText={(val) => handleStepChange(idx, val)}
                      placeholder={`Instruction step ${idx + 1}...`}
                      placeholderTextColor="#64748b"
                    />
                    <TouchableOpacity onPress={() => handleRemoveStepRow(idx)} style={{ padding: 4 }}>
                      <Trash2 size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.formLabel}>Tags (Semicolon separated)</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTags}
                  onChangeText={setNewTags}
                  placeholder="Quick Meal; High Protein; Sri Lankan"
                  placeholderTextColor="#64748b"
                />
              </View>
            </ScrollView>

            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                onPress={handleSaveRecipe}
                disabled={savingRecipe}
                style={styles.saveSubmitBtn}
                activeOpacity={0.8}
              >
                {savingRecipe ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Sparkles size={16} color="#ffffff" />
                    <Text style={styles.saveSubmitBtnText}>Save & Index Recipe into AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Comprehensive Full-Screen Recipe Detail Modal */}
      {selectedRecipe && (
        <Modal visible={!!selectedRecipe} animationType="slide" transparent={false} onRequestClose={() => setSelectedRecipe(null)}>
          <View style={[styles.modalFullScreen, { paddingTop: topPadding }]}>
            {/* Modal Header Bar */}
            <View style={styles.modalHeaderBar}>
              <View style={{ flex: 1 }}>
                <View style={styles.cuisineBadgeModal}>
                  <Text style={styles.cuisineTextModal}>{selectedRecipe.cuisine} • {selectedRecipe.meal_type}</Text>
                </View>
                <Text style={styles.modalHeaderTitle}>{selectedRecipe.recipe_name}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.modalCloseIconBtn}>
                <X size={20} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            {/* Modal Scroll Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Recipe Summary */}
              {selectedRecipe.recipe_summary ? (
                <View style={styles.modalSummaryBox}>
                  <Text style={styles.modalSummaryText}>{selectedRecipe.recipe_summary}</Text>
                </View>
              ) : null}

              {/* Quick Metrics Bar */}
              <View style={styles.modalMetricsGrid}>
                <View style={styles.modalMetricTile}>
                  <Text style={styles.modalMetricLabel}>Pantry Match</Text>
                  <Text style={[styles.modalMetricValue, { color: '#34d399' }]}>{selectedRecipe.pantry_match_pct}%</Text>
                </View>
                <View style={styles.modalMetricTile}>
                  <Text style={styles.modalMetricLabel}>Health Score</Text>
                  <Text style={[styles.modalMetricValue, { color: '#fb923c' }]}>{selectedRecipe.health_score} / 10</Text>
                </View>
                <View style={styles.modalMetricTile}>
                  <Text style={styles.modalMetricLabel}>Cook Time</Text>
                  <Text style={[styles.modalMetricValue, { color: '#818cf8' }]}>{selectedRecipe.cooking_time}</Text>
                </View>
                <View style={styles.modalMetricTile}>
                  <Text style={styles.modalMetricLabel}>Household</Text>
                  <Text style={[styles.modalMetricValue, { color: '#38bdf8' }]}>4 Servings</Text>
                </View>
              </View>

              {/* Tags List */}
              {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {selectedRecipe.tags.map((tag: string, idx: number) => (
                    <View key={idx} style={styles.tagChip}>
                      <Tag size={10} color="#94a3b8" />
                      <Text style={styles.tagChipText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* AI Recommendation Rationale */}
              <View style={styles.modalAiBox}>
                <Sparkles size={18} color="#818cf8" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalAiTitle}>AI Recommendation Rationale</Text>
                  <Text style={styles.modalAiText}>{selectedRecipe.ai_recommendation_reason}</Text>
                </View>
              </View>

              {/* Complete Ingredients Checklist with Quantities */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Utensils size={16} color="#6366f1" />
                  <Text style={styles.sectionTitleText}>Required Ingredients & Stock Level</Text>
                </View>

                <View style={{ gap: 8, marginTop: 10 }}>
                  {selectedRecipe.ingredients?.map((ing: string, idx: number) => {
                    const isMissing = selectedRecipe.missing_ingredients?.includes(ing);
                    const qtyStr = getIngredientQtyString(selectedRecipe, ing);
                    return (
                      <View key={idx} style={[styles.ingRowFull, isMissing ? styles.ingMissingFull : styles.ingInStockFull]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.ingNameFull, isMissing ? { color: '#fca5a5' } : { color: '#ffffff' }]}>
                            {ing}
                          </Text>
                          <Text style={styles.ingQtyText}>Required: {qtyStr}</Text>
                        </View>
                        <Text style={[styles.ingStatusTagFull, isMissing ? styles.tagMissingFull : styles.tagInStockFull]}>
                          {isMissing ? '🔴 Missing' : '🟢 In Stock'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Missing Items & Shopping Cost Banner */}
              {selectedRecipe.missing_ingredients && selectedRecipe.missing_ingredients.length > 0 ? (
                <View style={styles.missingCostBox}>
                  <AlertTriangle size={18} color="#f59e0b" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missingCostTitle}>
                      Missing {selectedRecipe.missing_ingredients.length} item(s) for complete recipe
                    </Text>
                    <Text style={styles.missingCostItems}>
                      {selectedRecipe.missing_ingredients.join(', ')}
                    </Text>
                    <Text style={styles.missingCostPrice}>
                      Est. Replenishment Cost: LKR {selectedRecipe.estimated_shopping_cost?.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.allStockedBox}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <Text style={styles.allStockedText}>
                    All ingredients are 100% available in your cabinet right now!
                  </Text>
                </View>
              )}

              {/* Cooking Instructions */}
              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Clock size={16} color="#10b981" />
                    <Text style={styles.sectionTitleText}>Step-by-Step Cooking Instructions</Text>
                  </View>

                  <View style={{ gap: 10, marginTop: 10 }}>
                    {selectedRecipe.instructions.map((step: string, idx: number) => (
                      <View key={idx} style={styles.stepCardFull}>
                        <View style={styles.stepBadgeFull}>
                          <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.stepContentText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalBottomBar}>
              <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.closeFullBtn}>
                <Text style={styles.closeFullBtnText}>Close Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    padding: 0,
  },
  chipsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 32,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  chipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#1e293b',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 11,
    color: '#64748b',
  },
  cardsGrid: {
    gap: 12,
  },
  recipeCard: {
    backgroundColor: '#151b2e',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cuisineBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cuisineText: {
    fontSize: 10,
    color: '#818cf8',
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardSummary: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metricBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  metricText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textGreen: {
    color: '#34d399',
  },
  textAmber: {
    color: '#fbbf24',
  },
  metricBadgeGray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#090b14',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricTextGray: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  aiBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#090b14',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  aiText: {
    flex: 1,
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  /* Form Styles */
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  formInput: {
    backgroundColor: '#151b2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addRowBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818cf8',
  },
  ingFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepFormNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveSubmitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  /* Modal Styles */
  modalFullScreen: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  modalHeaderBar: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cuisineBadgeModal: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  cuisineTextModal: {
    fontSize: 10,
    color: '#818cf8',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalCloseIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  modalScrollBody: {
    padding: 16,
    gap: 14,
  },
  modalSummaryBox: {
    backgroundColor: '#151b2e',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalSummaryText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 17,
  },
  modalMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  modalMetricTile: {
    flex: 1,
    backgroundColor: '#151b2e',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalMetricLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalMetricValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagChipText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalAiBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  modalAiTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#818cf8',
  },
  modalAiText: {
    fontSize: 11,
    color: '#e2e8f0',
    marginTop: 2,
    lineHeight: 15,
  },
  sectionCard: {
    backgroundColor: '#151b2e',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  ingRowFull: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  ingInStockFull: {
    backgroundColor: '#090b14',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  ingMissingFull: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  ingNameFull: {
    fontSize: 12,
    fontWeight: '700',
  },
  ingQtyText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  ingStatusTagFull: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagInStockFull: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
  },
  tagMissingFull: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
  },
  missingCostBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  missingCostTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  missingCostItems: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
  },
  missingCostPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    marginTop: 4,
  },
  allStockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  allStockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  stepCardFull: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#090b14',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepBadgeFull: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#818cf8',
  },
  stepContentText: {
    flex: 1,
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  modalBottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0f172a',
  },
  closeFullBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeFullBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
