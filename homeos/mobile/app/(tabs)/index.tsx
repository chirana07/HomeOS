// index.tsx (Home OS Dashboard)
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Dimensions
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { 
  Play, 
  Pause, 
  Bot, 
  Flame, 
  Leaf, 
  TrendingUp, 
  DollarSign, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeOSScreen() {
  const { 
    currentPlan, 
    isDemoMode, 
    setDemoMode, 
    isJudgeMode, 
    setJudgeMode,
    isOffline, 
    isThinking,
    generateNewPlan
  } = useApp();
  
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [greetingSub, setGreetingSub] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showBriefSummary, setShowBriefSummary] = useState(false);
  const [logoPressCount, setLogoPressCount] = useState(0);

  // Set greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) {
      setGreeting('Good morning, Den ☀️');
      setGreetingSub("Breakfast is ready. Carrots will expire tomorrow. Let's make sure we cook them today.");
    } else if (hours >= 12 && hours < 17) {
      setGreeting('Welcome back, Den 🥗');
      setGreetingSub('Lunch is waiting. You can save LKR 450 by using your vegetables today instead of ordering out.');
    } else {
      setGreeting('Good evening, Den 🌙');
      setGreetingSub("Dinner recommendation is ready. Following today's plan avoids 2 food items becoming waste.");
    }
  }, []);

  // Synthetic Audio Briefing
  const playAudioBriefing = () => {
    if (isAudioPlaying) {
      Speech.stop();
      setIsAudioPlaying(false);
    } else {
      setIsAudioPlaying(true);
      const speechText = `Welcome back. ${greeting}. Here is your HomeOS briefing: you can prepare 6 meals with your current pantry items. You have already saved 2,850 rupees this month. Egg and Carrots are expiring soon. Today's recommendation is Braised Chicken with Carrots because it minimizes food waste.`;
      
      Speech.speak(speechText, {
        onDone: () => setIsAudioPlaying(false),
        onError: () => setIsAudioPlaying(false),
        onStopped: () => setIsAudioPlaying(false),
      });
    }
  };

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Handle hidden Judge Mode trigger (Long press/multi-taps on HomeOS Title)
  const handleLogoPress = () => {
    setLogoPressCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setJudgeMode(!isJudgeMode);
        alert(isJudgeMode ? 'Judge Mode Disabled' : 'Judge Mode Unlocked! Tapping trace agent nodes will now reveal SQLite & prompt logs.');
        return 0;
      }
      return next;
    });
    // Auto reset press count after 3 seconds
    setTimeout(() => setLogoPressCount(0), 3000);
  };

  const triggerMockPlanGeneration = () => {
    generateNewPlan(10000, 4);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onLongPress={() => {
            setJudgeMode(!isJudgeMode);
            alert(isJudgeMode ? 'Judge Mode Disabled' : 'Judge Mode Unlocked!');
          }}
          onPress={handleLogoPress}
          delayLongPress={3000}
        >
          <Text style={styles.logoText}>
            Home<Text style={{ color: '#6366f1' }}>OS</Text>
          </Text>
        </TouchableOpacity>
        <View style={styles.badgeRow}>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Local Mode</Text>
            </View>
          )}
          <TouchableOpacity 
            onPress={() => setDemoMode(!isDemoMode)} 
            style={[styles.demoModeBtn, isDemoMode && styles.demoModeBtnActive]}
          >
            <Text style={styles.demoBtnText}>
              {isDemoMode ? 'Demo ON' : 'Live Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Conversational Summary Card */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.greetingCard}>
        <Bot size={28} color="#6366f1" style={{ marginBottom: 12 }} />
        <Text style={styles.greetingTitle}>{greeting}</Text>
        <Text style={styles.greetingSubtitle}>{greetingSub}</Text>
      </Animated.View>

      {/* Daily Briefing Widget */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.briefingCard}>
        <View style={styles.briefingHeader}>
          <Text style={styles.briefingTitle}>Daily AI Briefing</Text>
          <TouchableOpacity onPress={playAudioBriefing} style={styles.playButton}>
            {isAudioPlaying ? (
              <Pause size={16} color="#fff" />
            ) : (
              <Play size={16} color="#fff" style={{ marginLeft: 2 }} />
            )}
            <Text style={styles.playButtonText}>
              {isAudioPlaying ? 'Mute' : 'Listen Brief'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.briefingText}>
          You have ingredients for 6 meals. LKR 2,850 saved this month. 2 items expire tomorrow.
        </Text>

        <View style={styles.briefingActions}>
          <TouchableOpacity 
            onPress={() => setShowBriefSummary(!showBriefSummary)}
            style={styles.actionOutline}
          >
            <Text style={styles.actionOutlineText}>
              {showBriefSummary ? 'Close Summary' : 'Read Summary'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/assistant')}
            style={styles.actionSolid}
          >
            <Text style={styles.actionSolidText}>Ask Follow-up</Text>
          </TouchableOpacity>
        </View>

        {showBriefSummary && (
          <Animated.View entering={FadeInUp} style={styles.summaryDetails}>
            <Text style={styles.summaryDetailsText}>
              • Saved LKR 2,850 this month by optimizing grocery leftovers.{'\n'}
              • Scheduled Carrot Stir Fry to prevent 400g carrots from spoilage.{'\n'}
              • Waste Prevention Grade: A (94% utilization efficiency).
            </Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Core Question 1: What should I cook today? */}
      <Text style={styles.sectionHeader}>What should I cook today?</Text>
      {isThinking ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.thinkingText}>I'm thinking...</Text>
        </View>
      ) : currentPlan ? (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.recipeHighlightCard}>
          <View style={styles.recipeHeader}>
            <View>
              <Text style={styles.recipeTag}>RECOMMENDED DINNER</Text>
              <Text style={styles.recipeName}>
                {currentPlan.daily_plan?.day_1?.dinner?.meal_name || "Carrot Stir Fry"}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/day/[id]', params: { id: 1 } })}
              style={styles.roundGoBtn}
            >
              <ArrowRight size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.recipeSummary}>
            {currentPlan.daily_plan?.day_1?.dinner?.recipe_summary || "Sautéed carrot ribbons with scrambled egg ribbons served over warm rice."}
          </Text>
          <View style={styles.recipeMetaRow}>
            <View style={styles.metaChip}>
              <Flame size={12} color="#f59e0b" />
              <Text style={styles.metaChipText}>80/100 Health</Text>
            </View>
            <View style={styles.metaChip}>
              <Leaf size={12} color="#10b981" />
              <Text style={styles.metaChipText}>Prevents Waste</Text>
            </View>
          </View>
        </Animated.View>
      ) : (
        <TouchableOpacity onPress={triggerMockPlanGeneration} style={styles.emptyPlanBtn}>
          <Bot size={24} color="#64748b" />
          <Text style={styles.emptyPlanBtnText}>Generate Your First Plan</Text>
        </TouchableOpacity>
      )}

      {/* Core Question 2 & 3: Expiring Foods & Savings */}
      <View style={styles.gridRow}>
        {/* Expiring Badge */}
        <Animated.View entering={FadeInUp.delay(400)} style={[styles.gridCard, { marginRight: 8 }]}>
          <ShieldAlert size={20} color="#f43f5e" style={{ marginBottom: 8 }} />
          <Text style={styles.gridCardLabel}>Expiring Food</Text>
          <Text style={styles.gridCardValue}>2 Items</Text>
          <Text style={styles.gridCardSub}>Carrots, Eggs expire tomorrow</Text>
        </Animated.View>

        {/* Savings Badge */}
        <Animated.View entering={FadeInUp.delay(500)} style={[styles.gridCard, { marginLeft: 8 }]}>
          <DollarSign size={20} color="#10b981" style={{ marginBottom: 8 }} />
          <Text style={styles.gridCardLabel}>Monthly Savings</Text>
          <Text style={styles.gridCardValue}>LKR 2,850</Text>
          <Text style={styles.gridCardSub}>Reflections saved LKR 450 today</Text>
        </Animated.View>
      </View>

      {/* Sustainability Badge */}
      <Animated.View entering={FadeInUp.delay(600)} style={styles.sustainabilityCard}>
        <View style={styles.leafIconContainer}>
          <Leaf size={24} color="#10b981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sustainabilityTitle}>Sustainability Score</Text>
          <Text style={styles.sustainabilityDesc}>
            Your household is currently in the top 6% of waste-preventing homes. Keep it up!
          </Text>
        </View>
        <Text style={styles.sustainabilityScore}>94%</Text>
      </Animated.View>
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  offlineBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  demoModeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  demoModeBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  demoBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  greetingCard: {
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  briefingCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  briefingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  briefingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  briefingText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  briefingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionOutline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    height: 38,
  },
  actionOutlineText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  actionSolid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  actionSolidText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryDetails: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  summaryDetailsText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  recipeHighlightCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    marginBottom: 20,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6366f1',
    letterSpacing: 1,
    marginBottom: 4,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  roundGoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeSummary: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  emptyPlanBtn: {
    height: 100,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  emptyPlanBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    padding: 16,
  },
  gridCardLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gridCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  gridCardSub: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 12,
  },
  sustainabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  leafIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sustainabilityTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  sustainabilityDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 14,
  },
  sustainabilityScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  loaderContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
    gap: 8,
  },
  thinkingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
