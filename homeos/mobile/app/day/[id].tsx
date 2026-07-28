// [id].tsx (Daily Detail & Inline AI Cooking Assistance)
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Bot, 
  CheckCircle2, 
  Coffee, 
  Moon, 
  RotateCcw, 
  Send, 
  Sun, 
  Volume2 
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import * as api from '../../services/api';

export default function DayDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentPlan, completeMeal } = useApp();

  const dayId = parseInt(Array.isArray(id) ? id[0] : id || '1', 10);
  const dayKey = `day_${dayId}`;
  
  const dayMeals = currentPlan?.daily_plan?.[dayKey];

  // Inline chat states per meal type
  const [activeMealChat, setActiveMealChat] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [chatInputs, setChatInputs] = useState({ breakfast: '', lunch: '', dinner: '' });
  const [chatAnswers, setChatAnswers] = useState({ breakfast: '', lunch: '', dinner: '' });
  const [loadingAnswers, setLoadingAnswers] = useState({ breakfast: false, lunch: false, dinner: false });

  if (!dayMeals) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No plan details found for Day {dayId}.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleToggleComplete = async (mealType: 'breakfast' | 'lunch' | 'dinner', isCompleted: boolean) => {
    const success = await completeMeal(dayId, mealType, isCompleted);
    if (success) {
      const mealName = dayMeals[mealType]?.meal_name;
      const statusText = isCompleted ? 'restored' : 'completed';
      alert(`"${mealName}" has been ${statusText}!`);
    }
  };

  const handleAskAI = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const prompt = chatInputs[mealType].trim();
    if (!prompt) return;

    setLoadingAnswers(prev => ({ ...prev, [mealType]: true }));
    setChatAnswers(prev => ({ ...prev, [mealType]: '' }));

    try {
      const mealName = dayMeals[mealType]?.meal_name || mealType;
      const res = await api.chatWithAssistantText(`Regarding recipe "${mealName}": ${prompt}`);
      const reply = res.response || res.transcript || "Request processed.";

      setChatAnswers(prev => ({ ...prev, [mealType]: reply }));
      setChatInputs(prev => ({ ...prev, [mealType]: '' }));
      
      // Auto Voice readback
      Speech.speak(reply);
    } catch (err: any) {
      setChatAnswers(prev => ({ ...prev, [mealType]: "Failed to query AI assistant." }));
    } finally {
      setLoadingAnswers(prev => ({ ...prev, [mealType]: false }));
    }
  };

  const speakText = (text: string) => {
    Speech.speak(text);
  };

  const renderMealSection = (type: 'breakfast' | 'lunch' | 'dinner', mealData: any) => {
    if (!mealData) return null;
    const isCompleted = mealData.status === 'Completed';

    let MealIcon = Coffee;
    let iconColor = '#f59e0b';
    let gradientBg = 'rgba(245, 158, 11, 0.05)';

    if (type === 'lunch') {
      MealIcon = Sun;
      iconColor = '#06b6d4';
      gradientBg = 'rgba(6, 182, 212, 0.05)';
    } else if (type === 'dinner') {
      MealIcon = Moon;
      iconColor = '#6366f1';
      gradientBg = 'rgba(99, 102, 241, 0.05)';
    }

    return (
      <Animated.View entering={FadeInDown} style={styles.mealCard} key={type}>
        {/* Card Cover */}
        <View style={[styles.cardHeaderCover, { backgroundColor: gradientBg }]}>
          <MealIcon size={32} color={iconColor} />
          <Text style={[styles.mealTypeTitle, { color: iconColor }]}>
            {type.toUpperCase()}
          </Text>
        </View>

        {/* Meal Body */}
        <View style={styles.cardBody}>
          <View style={styles.mealNameRow}>
            <Text style={styles.mealName}>{mealData.meal_name}</Text>
            <View style={styles.healthTag}>
              <Text style={styles.healthTagText}>{mealData.nutrition_score || 85}/100 score</Text>
            </View>
          </View>

          <Text style={styles.recipeSummary}>{mealData.recipe_summary}</Text>

          {/* AI Reasoning details */}
          <View style={styles.aiInsightRow}>
            <Bot size={14} color="#6366f1" />
            <Text style={styles.aiInsightText}>
              Optimized for family budget & waste reduction.
            </Text>
          </View>

          {/* Ingredients list */}
          <Text style={styles.sectionSubTitle}>Ingredients Utilized</Text>
          <View style={styles.ingredientsContainer}>
            {mealData.ingredients_used?.map((ing: string, idx: number) => (
              <View key={idx} style={styles.ingredientBadge}>
                <Text style={styles.ingredientBadgeText}>{ing}</Text>
              </View>
            ))}
          </View>

          {/* Completing Actions */}
          <View style={styles.completionRow}>
            <View>
              <Text style={styles.executionStatusLabel}>Execution State</Text>
              <Text style={[styles.executionValue, isCompleted ? styles.completedTxt : styles.pendingTxt]}>
                {isCompleted ? 'Completed' : 'Pending Preparation'}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => handleToggleComplete(type, isCompleted)}
              style={[
                styles.actionBtn, 
                isCompleted ? styles.actionBtnUndo : styles.actionBtnComplete
              ]}
            >
              {isCompleted ? (
                <>
                  <RotateCcw size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Reset Meal</Text>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Mark Done</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Interactive Cooking Assistant Inline Panel */}
          <View style={styles.chatSection}>
            <TouchableOpacity 
              onPress={() => setActiveMealChat(activeMealChat === type ? null : type)}
              style={styles.chatToggleBtn}
            >
              <Bot size={14} color="#818cf8" />
              <Text style={styles.chatToggleBtnText}>
                {activeMealChat === type ? 'Close AI Chat' : 'Ask AI about this recipe...'}
              </Text>
            </TouchableOpacity>

            {activeMealChat === type && (
              <Animated.View entering={FadeIn} style={styles.chatPanel}>
                {chatAnswers[type] ? (
                  <View style={styles.aiAnswerBubble}>
                    <Text style={styles.aiAnswerText}>{chatAnswers[type]}</Text>
                    <TouchableOpacity 
                      onPress={() => speakText(chatAnswers[type])}
                      style={styles.ttsIcon}
                    >
                      <Volume2 size={14} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {loadingAnswers[type] && (
                  <View style={styles.aiThinking}>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={styles.thinkingLabel}>Asking chef companion...</Text>
                  </View>
                )}

                <View style={styles.chatInputRow}>
                  <TextInput
                    value={chatInputs[type]}
                    onChangeText={(val) => setChatInputs(prev => ({ ...prev, [type]: val }))}
                    placeholder="e.g. Can I replace chicken with tofu?"
                    placeholderTextColor="#64748b"
                    style={styles.chatInput}
                    onSubmitEditing={() => handleAskAI(type)}
                  />
                  <TouchableOpacity 
                    onPress={() => handleAskAI(type)}
                    style={styles.chatSendBtn}
                  >
                    <Send size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#fff" />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>

        {/* Day Header Info */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>Day {dayId} Plan</Text>
          <Text style={styles.daySub}>Schedule optimized to eliminate waste and hit budget targets.</Text>
        </View>

        {/* Render Day Meals */}
        {dayMeals && (
          <View style={styles.mealsGrid}>
            {renderMealSection('breakfast', dayMeals.breakfast)}
            {renderMealSection('lunch', dayMeals.lunch)}
            {renderMealSection('dinner', dayMeals.dinner)}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  dayHeader: {
    marginBottom: 24,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  daySub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  mealsGrid: {
    gap: 24,
  },
  mealCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  cardHeaderCover: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  mealTypeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardBody: {
    padding: 20,
  },
  mealNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  healthTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  healthTagText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recipeSummary: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12,
  },
  aiInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  aiInsightText: {
    fontSize: 11,
    color: '#818cf8',
  },
  sectionSubTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  ingredientBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ingredientBadgeText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 16,
    marginBottom: 16,
  },
  executionStatusLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  executionValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedTxt: {
    color: '#10b981',
  },
  pendingTxt: {
    color: '#f59e0b',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 12,
  },
  actionBtnComplete: {
    backgroundColor: '#6366f1',
  },
  actionBtnUndo: {
    backgroundColor: '#f43f5e',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatSection: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 14,
  },
  chatToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatToggleBtnText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatPanel: {
    marginTop: 12,
    backgroundColor: '#070a13',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  aiAnswerBubble: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    position: 'relative',
  },
  aiAnswerText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
  },
  ttsIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  aiThinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  thinkingLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 11,
  },
  chatSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070a13',
    padding: 24,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
