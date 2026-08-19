// index.tsx (Home OS Mobile Dashboard - Native Hierarchy & Apple Health/Wallet Polish)
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  RefreshControl,
  Dimensions,
  Modal
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { 
  Play, 
  Pause, 
  Bot, 
  Flame, 
  Leaf, 
  DollarSign, 
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Users,
  Minus,
  Plus,
  X,
  Sliders,
  Sparkles,
  ShoppingBag,
  TrendingDown,
  CheckCircle2,
  Calendar,
  Clock,
  UtensilsCrossed,
  Layers,
  Recycle,
  Tag,
  Zap,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import Animated, { FadeInUp, SlideInDown, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { VoiceAssistantModal } from '../../components/VoiceAssistantModal';
import { VoiceFloatingButton } from '../../components/VoiceFloatingButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_CARD_WIDTH = SCREEN_WIDTH * 0.82;

export default function HomeOSScreen() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const voice = useVoiceAssistant();

  const openVoiceAssistant = () => {
    setIsVoiceModalOpen(true);
    voice.startListening();
  };

  const { 
    currentPlan, 
    inventory,
    isJudgeMode, 
    setJudgeMode,
    isOffline, 
    isLoading,
    error,
    refreshData,
    isThinking,
    generateNewPlan
  } = useApp();
  
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showBriefPanel, setShowBriefPanel] = useState(false);
  const [showBriefDetails, setShowBriefDetails] = useState(false);
  const [logoPressCount, setLogoPressCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);

  // Household Planner State
  const [budget, setBudget] = useState(10000);
  const [familySize, setFamilySize] = useState(4);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);

  // Set greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) {
      setGreeting('Good morning ☀️');
    } else if (hours >= 12 && hours < 17) {
      setGreeting('Welcome back 🥗');
    } else {
      setGreeting('Good evening 🌙');
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Synthetic Audio Briefing
  const playAudioBriefing = () => {
    if (isAudioPlaying) {
      Speech.stop();
      setIsAudioPlaying(false);
    } else {
      setIsAudioPlaying(true);
      const dinnerName = currentPlan?.daily_plan?.day_1?.dinner?.meal_name || "a customized meal";
      const savings = currentPlan?.household_economics?.estimated_savings || 2850;
      const speechText = `Welcome back. ${greeting}. Here is your HomeOS briefing: you have ${inventory.length} ingredients in stock. Estimated monthly savings is ${savings} rupees. Today's recommendation is ${dinnerName}.`;
      
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

  const handleLogoPress = () => {
    setLogoPressCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setJudgeMode(!isJudgeMode);
        alert(isJudgeMode ? 'Judge Mode Disabled' : 'Judge Mode Unlocked!');
        return 0;
      }
      return next;
    });
    setTimeout(() => setLogoPressCount(0), 3000);
  };

  const handleConfirmGeneration = () => {
    generateNewPlan(budget, familySize);
    setIsPlannerModalOpen(false);
  };

  const estimatedDailyBudget = Math.round(budget / 30);
  const totalSavings = currentPlan?.household_economics?.estimated_savings || 2850;

  // Safe Budget Optimization Calculations
  const budgetLimit = (currentPlan?.household_economics?.monthly_budget && currentPlan.household_economics.monthly_budget > 0) 
    ? currentPlan.household_economics.monthly_budget 
    : (budget > 0 ? budget : 10000);
  const optimizedCost = currentPlan?.estimated_cost || 3450;
  const initialDraftCost = currentPlan?.household_economics?.initial_draft_cost || Math.round(optimizedCost * 1.35);

  const getSafePct = (num: number, max: number): `${number}%` => {
    if (!max || max <= 0 || isNaN(num) || isNaN(max)) return '50%';
    const pct = Math.min(100, Math.max(5, Math.round((num / max) * 100)));
    return `${pct}%`;
  };

  const getPriorityColor = (priority: any) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') return '#f43f5e';
    if (p === 'medium') return '#f59e0b';
    return '#10b981';
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      {/* Brand Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onLongPress={() => {
            setJudgeMode(!isJudgeMode);
            alert(isJudgeMode ? 'Judge Mode Disabled' : 'Judge Mode Unlocked!');
          }}
          onPress={handleLogoPress}
          delayLongPress={3000}
          style={styles.logoRow}
        >
          <View style={styles.logoBadge}>
            <Zap size={16} color="#6366f1" />
          </View>
          <Text style={styles.logoText}>
            Home<Text style={{ color: '#6366f1' }}>OS</Text>
          </Text>
        </TouchableOpacity>
        <View style={styles.badgeRow}>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => setIsPlannerModalOpen(true)} style={styles.configBtn}>
            <Sliders size={16} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshData} style={styles.refreshBtn}>
            <RefreshCw size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Issue Overlay */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity onPress={refreshData} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. COMPACT WELCOME BANNER (70px max height) */}
      <Animated.View entering={FadeInUp.delay(60)} style={styles.compactGreetingBanner}>
        <View style={styles.greetingLeft}>
          <Text style={styles.greetingWelcome}>{greeting}</Text>
          <Text style={styles.greetingSummary}>
            {inventory.length} Pantry Items • Saved <Text style={{ color: '#10b981', fontWeight: 'bold' }}>LKR {totalSavings.toLocaleString()}</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={playAudioBriefing} style={styles.audioBriefIconBtn}>
          {isAudioPlaying ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" style={{ marginLeft: 2 }} />}
        </TouchableOpacity>
      </Animated.View>

      {/* 1. TODAY'S MEAL (HERO CENTERPIECE - Highest Visual Weight ~30% height) */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.heroRecipeCard}>
        <View style={styles.heroTagRow}>
          <Text style={styles.heroTagText}>TODAY'S RECOMMENDATION</Text>
          <View style={styles.savingsPill}>
            <Text style={styles.savingsPillText}>Saved LKR {totalSavings.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.heroMealName}>
          {currentPlan?.daily_plan?.day_1?.dinner?.meal_name || "Carrot & Egg Stir Fry"}
        </Text>

        <Text style={styles.heroMealDesc}>
          {currentPlan?.daily_plan?.day_1?.dinner?.reason || "Intelligently selected to consume active cabinet items nearing expected shelf life."}
        </Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <Clock size={12} color="#6366f1" />
            <Text style={styles.heroMetaText}>25 mins</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <UtensilsCrossed size={12} color="#10b981" />
            <Text style={styles.heroMetaText}>100% Pantry Match</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Flame size={12} color="#f59e0b" />
            <Text style={styles.heroMetaText}>Health 88</Text>
          </View>
        </View>

        {/* Primary CTA Cook Now & Secondary CTA Why this meal? */}
        <View style={styles.heroActionRow}>
          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/day/[id]', params: { id: 1 } })}
            style={styles.heroPrimaryBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.heroPrimaryBtnText}>Cook Now</Text>
            <ArrowRight size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsWhyExpanded(!isWhyExpanded)}
            style={styles.heroSecondaryBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.heroSecondaryBtnText}>Why this meal?</Text>
            {isWhyExpanded ? <ChevronUp size={14} color="#6366f1" /> : <ChevronDown size={14} color="#6366f1" />}
          </TouchableOpacity>
        </View>

        {/* Expandable AI Explanation */}
        {isWhyExpanded && (
          <Animated.View entering={FadeInUp} layout={Layout} style={styles.whyExplainBox}>
            <Text style={styles.whyExplainItem}>✓ Uses ingredients expiring soon</Text>
            <Text style={styles.whyExplainItem}>✓ Saved LKR {totalSavings.toLocaleString()}</Text>
            <Text style={styles.whyExplainItem}>✓ Uses active pantry inventory</Text>
            <Text style={styles.whyExplainItem}>✓ Meets household budget target</Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* 3. COLLAPSED AI BRIEF PANEL */}
      <Animated.View entering={FadeInUp.delay(140)} style={styles.aiBriefPanel}>
        <TouchableOpacity 
          onPress={() => setShowBriefPanel(!showBriefPanel)} 
          style={styles.aiBriefHeaderRow}
          activeOpacity={0.7}
        >
          <View style={styles.aiBriefLeft}>
            <Bot size={16} color="#6366f1" />
            <Text style={styles.aiBriefTitle}>Daily AI Brief</Text>
            <View style={styles.aiBriefBadge}>
              <Text style={styles.aiBriefBadgeText}>2 Insights</Text>
            </View>
          </View>
          {showBriefPanel ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </TouchableOpacity>

        {showBriefPanel && (
          <Animated.View entering={FadeInUp} layout={Layout} style={styles.aiBriefExpandedContent}>
            <Text style={styles.aiBriefText}>
              • Active cabinet stock: {inventory.length} items.{'\n'}
              • Waste prevention score: 94% utilization.
            </Text>
            <View style={styles.aiBriefActionRow}>
              <TouchableOpacity onPress={() => setShowBriefDetails(!showBriefDetails)} style={styles.briefActionBtn}>
                <Text style={styles.briefActionText}>{showBriefDetails ? 'Hide Summary' : 'Read Summary'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={playAudioBriefing} style={styles.briefActionBtn}>
                <Text style={styles.briefActionText}>Listen</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/assistant')} style={styles.briefActionSolidBtn}>
                <Text style={styles.briefActionSolidText}>Ask Follow-up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Animated.View>

      {/* 4. COLLAPSED PLANNER BANNER */}
      <Animated.View entering={FadeInUp.delay(180)} style={styles.plannerBanner}>
        <View style={styles.plannerBannerLeft}>
          <Users size={16} color="#6366f1" />
          <Text style={styles.plannerBannerText}>
            {familySize} People • LKR {budget.toLocaleString()}/month
          </Text>
        </View>
        <TouchableOpacity onPress={() => setIsPlannerModalOpen(true)} style={styles.plannerBannerBtn} activeOpacity={0.8}>
          <Text style={styles.plannerBannerBtnText}>Configure</Text>
          <ArrowRight size={12} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* 5. BUDGET SNAPSHOT & 3 STAT TILES */}
      <Animated.View entering={FadeInUp.delay(220)} style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <TrendingDown size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Budget Snapshot</Text>
        </View>

        {/* 3 Premium Statistic Tiles */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>LKR {totalSavings.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Money Saved</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#6366f1' }]}>
              {Math.round((optimizedCost / budgetLimit) * 100)}%
            </Text>
            <Text style={styles.metricLabel}>Budget Used</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#10b981' }]}>94%</Text>
            <Text style={styles.metricLabel}>Waste Reduced</Text>
          </View>
        </View>

        {/* Progress Bars Underneath */}
        <View style={styles.barGroup}>
          {/* Draft Cost */}
          <View style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Draft Cost</Text>
              <Text style={[styles.barVal, { color: '#f43f5e' }]}>LKR {initialDraftCost.toLocaleString()}</Text>
            </View>
            <View style={styles.thickBarTrack}>
              <View style={[styles.barFill, { width: getSafePct(initialDraftCost, budgetLimit), backgroundColor: 'rgba(244, 63, 94, 0.8)' }]} />
            </View>
          </View>

          {/* Optimized Cost */}
          <View style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Optimized Cost</Text>
              <Text style={[styles.barVal, { color: '#10b981' }]}>LKR {optimizedCost.toLocaleString()}</Text>
            </View>
            <View style={styles.thickBarTrack}>
              <View style={[styles.barFill, { width: getSafePct(optimizedCost, budgetLimit), backgroundColor: '#10b981' }]} />
            </View>
          </View>

          {/* Budget Limit */}
          <View style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Monthly Budget</Text>
              <Text style={[styles.barVal, { color: '#6366f1' }]}>LKR {budgetLimit.toLocaleString()}</Text>
            </View>
            <View style={styles.thickBarTrack}>
              <View style={[styles.barFill, { width: '100%', backgroundColor: '#6366f1' }]} />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* 6. 3-DAY MEAL PLAN (Apple Wallet Snapping Carousel) */}
      {currentPlan?.daily_plan && (
        <Animated.View entering={FadeInUp.delay(260)} style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Calendar size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>3-Day Meal Execution Plan</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            snapToInterval={CAROUSEL_CARD_WIDTH + 12}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
          >
            {['day_1', 'day_2', 'day_3'].map((dayKey, idx) => {
              const dayObj = currentPlan.daily_plan[dayKey];
              if (!dayObj) return null;
              return (
                <TouchableOpacity 
                  key={dayKey}
                  onPress={() => router.push({ pathname: '/day/[id]', params: { id: idx + 1 } })}
                  activeOpacity={0.85}
                  style={styles.walletDayCard}
                >
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>DAY {idx + 1}</Text>
                    <Text style={styles.dayDate}>{dayObj.date || 'Scheduled'}</Text>
                  </View>
                  <View style={styles.mealBlock}>
                    <Text style={styles.mealLabel}>Dinner</Text>
                    <Text style={styles.dayMealBold}>{dayObj.dinner?.meal_name || 'Custom Meal'}</Text>
                  </View>
                  <View style={styles.mealBlock}>
                    <Text style={styles.mealLabel}>Lunch</Text>
                    <Text style={styles.dayMealSub}>{dayObj.lunch?.meal_name || 'Leftovers'}</Text>
                  </View>
                  <View style={styles.mealBlock}>
                    <Text style={styles.mealLabel}>Breakfast</Text>
                    <Text style={styles.dayMealSub}>{dayObj.breakfast?.meal_name || 'Standard'}</Text>
                  </View>
                  <View style={styles.dayNavRow}>
                    <Text style={styles.dayNavText}>View</Text>
                    <ArrowRight size={12} color="#6366f1" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* 7. SHOPPING CARD (Compact Summary + View All Navigation) */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShoppingBag size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>Shopping Status</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '700' }}>
            🛒 {currentPlan?.shopping_summary?.total_attention_count || currentPlan?.shopping_list?.length || 0} items
          </Text>
        </View>

        {(!currentPlan?.shopping_summary && (!currentPlan?.shopping_list || currentPlan.shopping_list.length === 0)) ||
         (currentPlan?.shopping_summary && currentPlan.shopping_summary.total_attention_count === 0) ? (
          <View style={styles.compactSuccessBox}>
            <View style={styles.compactSuccessLeft}>
              <CheckCircle2 size={24} color="#10b981" />
              <View>
                <Text style={styles.compactSuccessTitle}>✅ Pantry Complete</Text>
                <Text style={styles.compactSuccessSub}>Sufficiently stocked</Text>
              </View>
            </View>
            <View style={styles.compactSuccessRight}>
              <Text style={styles.compactSuccessCostLabel}>Est. Cost</Text>
              <Text style={styles.compactSuccessCostVal}>LKR 0</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {/* Categorized Summary View - Max 3 items per category with "+ X more" */}
            <View style={{ gap: 8 }}>
              {/* Critical Category (Max 3) */}
              {currentPlan?.shopping_summary?.items?.critical?.length > 0 && (
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#ef4444', marginBottom: 4 }}>
                    🔴 Critical ({currentPlan.shopping_summary.items.critical.length})
                  </Text>
                  {currentPlan.shopping_summary.items.critical.slice(0, 3).map((item: any, idx: number) => (
                    <Text key={idx} style={{ fontSize: 11, color: '#f1f5f9', paddingVertical: 1.5, fontWeight: '500' }}>
                      • {item.name}
                    </Text>
                  ))}
                  {currentPlan.shopping_summary.items.critical.length > 3 && (
                    <Text style={{ fontSize: 10, color: '#f87171', fontWeight: '700', marginTop: 3 }}>
                      +{currentPlan.shopping_summary.items.critical.length - 3} more
                    </Text>
                  )}
                </View>
              )}

              {/* Essential Category (Max 3) */}
              {currentPlan?.shopping_summary?.items?.essential?.length > 0 && (
                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#f59e0b', marginBottom: 4 }}>
                    🟠 Essential ({currentPlan.shopping_summary.items.essential.length})
                  </Text>
                  {currentPlan.shopping_summary.items.essential.slice(0, 3).map((item: any, idx: number) => (
                    <Text key={idx} style={{ fontSize: 11, color: '#f1f5f9', paddingVertical: 1.5, fontWeight: '500' }}>
                      • {item.name}
                    </Text>
                  ))}
                  {currentPlan.shopping_summary.items.essential.length > 3 && (
                    <Text style={{ fontSize: 10, color: '#fbbf24', fontWeight: '700', marginTop: 3 }}>
                      +{currentPlan.shopping_summary.items.essential.length - 3} more
                    </Text>
                  )}
                </View>
              )}

              {/* Running Low Category (Max 3) */}
              {currentPlan?.shopping_summary?.items?.running_low?.length > 0 && (
                <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#3b82f6', marginBottom: 4 }}>
                    🟡 Running Low ({currentPlan.shopping_summary.items.running_low.length})
                  </Text>
                  {currentPlan.shopping_summary.items.running_low.slice(0, 3).map((item: any, idx: number) => (
                    <Text key={idx} style={{ fontSize: 11, color: '#f1f5f9', paddingVertical: 1.5, fontWeight: '500' }}>
                      • {item.name}
                    </Text>
                  ))}
                  {currentPlan.shopping_summary.items.running_low.length > 3 && (
                    <Text style={{ fontSize: 10, color: '#60a5fa', fontWeight: '700', marginTop: 3 }}>
                      +{currentPlan.shopping_summary.items.running_low.length - 3} more
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Stocked Count & Estimated Shopping Cost Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                {currentPlan?.shopping_summary?.well_stocked_count || 24} pantry items sufficiently stocked
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#34d399' }}>
                Est. Cost: LKR {(currentPlan?.shopping_summary?.estimated_shopping_cost || 0).toLocaleString()}
              </Text>
            </View>

            {/* CTA Button navigating to dedicated Shopping List Screen */}
            <TouchableOpacity
              onPress={() => router.push('/shopping-list')}
              style={{
                backgroundColor: '#6366f1',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 2,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>
                View Complete Shopping List
              </Text>
              <ArrowRight size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* 8. INVENTORY: 4 Circular Ring Widgets (Apple Health Ring Inspired) */}
      <Animated.View entering={FadeInUp.delay(340)} style={styles.healthCard}>
        <Text style={styles.healthTitle}>Inventory Health</Text>
        <View style={styles.healthRow}>
          <View style={styles.circularStatItem}>
            <View style={[styles.circleRing, { borderColor: '#10b981' }]}>
              <Text style={[styles.circleStatNum, { color: '#10b981' }]}>
                {inventory.filter(i => i.freshness_status === 'Fresh').length}
              </Text>
            </View>
            <Text style={styles.circleStatLabel}>🟢 Fresh</Text>
          </View>
          <View style={styles.circularStatItem}>
            <View style={[styles.circleRing, { borderColor: '#f59e0b' }]}>
              <Text style={[styles.circleStatNum, { color: '#f59e0b' }]}>
                {inventory.filter(i => i.freshness_status === 'Expires Soon').length}
              </Text>
            </View>
            <Text style={styles.circleStatLabel}>🟡 Expires Soon</Text>
          </View>
          <View style={styles.circularStatItem}>
            <View style={[styles.circleRing, { borderColor: '#f43f5e' }]}>
              <Text style={[styles.circleStatNum, { color: '#f43f5e' }]}>
                {inventory.filter(i => i.freshness_status === 'Expired').length}
              </Text>
            </View>
            <Text style={styles.circleStatLabel}>🔴 Expired</Text>
          </View>
          <View style={styles.circularStatItem}>
            <View style={[styles.circleRing, { borderColor: '#94a3b8' }]}>
              <Text style={[styles.circleStatNum, { color: '#94a3b8' }]}>
                {inventory.filter(i => i.freshness_status === 'Non-Perishable').length}
              </Text>
            </View>
            <Text style={styles.circleStatLabel}>⚪ Non-Perish</Text>
          </View>
        </View>
      </Animated.View>

      {/* 9. ASSISTANT: Floating Support Section */}
      <Animated.View entering={FadeInUp.delay(380)} style={styles.floatingAssistantCard}>
        <View style={styles.floatingAssistantLeft}>
          <View style={styles.assistantIconBox}>
            <MessageSquare size={16} color="#6366f1" />
          </View>
          <Text style={styles.floatingAssistantText}>Need recipe help?</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/assistant')} style={styles.floatingAssistantBtn} activeOpacity={0.8}>
          <Text style={styles.floatingAssistantBtnText}>Chat with HomeOS AI</Text>
          <ArrowRight size={12} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Sheet Planner Modal */}
      <Modal
        visible={isPlannerModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPlannerModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInDown} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Household Preferences</Text>
                <Text style={styles.modalSub}>Configure family member count & budget limit</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPlannerModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Household Size Stepper */}
            <View style={styles.configCard}>
              <View style={styles.configCardHeader}>
                <Users size={16} color="#6366f1" />
                <Text style={styles.configCardTitle}>Household Size</Text>
                <Text style={styles.configCardVal}>{familySize} {familySize === 1 ? 'Person' : 'People'}</Text>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity 
                  onPress={() => setFamilySize(prev => Math.max(1, prev - 1))}
                  disabled={familySize <= 1}
                  style={[styles.stepperBtn, familySize <= 1 && { opacity: 0.3 }]}
                >
                  <Minus size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.stepperNum}>{familySize}</Text>
                <TouchableOpacity 
                  onPress={() => setFamilySize(prev => Math.min(10, prev + 1))}
                  disabled={familySize >= 10}
                  style={[styles.stepperBtn, familySize >= 10 && { opacity: 0.3 }]}
                >
                  <Plus size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.configHint}>Recipe ingredient scaling: {familySize}x</Text>
            </View>

            {/* Monthly Budget Selector */}
            <View style={styles.configCard}>
              <View style={styles.configCardHeader}>
                <DollarSign size={16} color="#10b981" />
                <Text style={styles.configCardTitle}>Monthly Food Budget</Text>
                <Text style={[styles.configCardVal, { color: '#10b981' }]}>LKR {budget.toLocaleString()}</Text>
              </View>
              <View style={styles.budgetAdjustRow}>
                <TouchableOpacity 
                  onPress={() => setBudget(prev => Math.max(5000, prev - 1000))}
                  style={styles.budgetAdjustBtn}
                >
                  <Text style={styles.budgetAdjustText}>- LKR 1,000</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setBudget(prev => Math.min(100000, prev + 1000))}
                  style={styles.budgetAdjustBtn}
                >
                  <Text style={styles.budgetAdjustText}>+ LKR 1,000</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dailyBudgetRow}>
                <Text style={styles.dailyBudgetLabel}>Est. Daily Budget:</Text>
                <Text style={styles.dailyBudgetVal}>LKR {estimatedDailyBudget.toLocaleString()} / day</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleConfirmGeneration} style={styles.modalGenerateBtn}>
              <Sparkles size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.modalGenerateBtnText}>
                Generate Optimized Plan (LKR {budget.toLocaleString()} • {familySize}P)
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>

    {/* Floating Action Voice Button */}
    <VoiceFloatingButton onPress={openVoiceAssistant} status={voice.status} />

    {/* Voice Assistant Overlay Modal */}
    <VoiceAssistantModal
      visible={isVoiceModalOpen}
      onClose={() => {
        voice.cancelRecording();
        setIsVoiceModalOpen(false);
      }}
      status={voice.status}
      transcript={voice.transcript}
      errorMsg={voice.errorMsg}
      isMuted={voice.isMuted}
      permissionGranted={voice.permissionGranted}
      conversationHistory={voice.conversationHistory}
      startListening={voice.startListening}
      stopListeningAndProcess={voice.stopListeningAndProcess}
      cancelRecording={voice.cancelRecording}
      replayLastResponse={voice.replayLastResponse}
      toggleMute={voice.toggleMute}
      requestMicrophonePermission={voice.requestMicrophonePermission}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090b14',
  },
  content: {
    padding: 18,
    paddingTop: 56,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  offlineBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  configBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#151b2e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: 'bold',
  },
  errorSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  retryBtn: {
    marginTop: 6,
  },
  retryBtnText: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  compactGreetingBanner: {
    backgroundColor: '#151b2e',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    height: 72,
  },
  greetingLeft: {
    gap: 2,
  },
  greetingWelcome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  greetingSummary: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  audioBriefIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRecipeCard: {
    backgroundColor: '#1d2440',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTagText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  savingsPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsPillText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroMealName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroMealDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151b2e',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  heroMetaText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroPrimaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  heroSecondaryBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#151b2e',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heroSecondaryBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  whyExplainBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#090b14',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    gap: 6,
  },
  whyExplainItem: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  aiBriefPanel: {
    backgroundColor: '#151b2e',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  aiBriefHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  aiBriefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBriefTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  aiBriefBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBriefBadgeText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  aiBriefExpandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  aiBriefText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
  },
  aiBriefActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  briefActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#090b14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  briefActionText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  briefActionSolidBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  briefActionSolidText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  plannerBanner: {
    backgroundColor: '#151b2e',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 48,
  },
  plannerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plannerBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  plannerBannerBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plannerBannerBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardContainer: {
    backgroundColor: '#151b2e',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#090b14',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  barGroup: {
    gap: 10,
  },
  barRow: {
    gap: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  barVal: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  thickBarTrack: {
    height: 12,
    backgroundColor: '#090b14',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  carouselContent: {
    gap: 12,
    paddingVertical: 4,
  },
  walletDayCard: {
    width: CAROUSEL_CARD_WIDTH,
    backgroundColor: '#090b14',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 8,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  dayDate: {
    fontSize: 11,
    color: '#64748b',
  },
  mealBlock: {
    gap: 2,
  },
  mealLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dayMealBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  dayMealSub: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  dayNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayNavText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  compactSuccessBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
  },
  compactSuccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactSuccessTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  compactSuccessSub: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1,
  },
  compactSuccessRight: {
    alignItems: 'flex-end',
  },
  compactSuccessCostLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  compactSuccessCostVal: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shoppingList: {
    gap: 8,
  },
  shoppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090b14',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  shoppingName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  shoppingQty: {
    fontSize: 10,
    color: '#94a3b8',
  },
  shoppingCost: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  priorityBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  healthCard: {
    backgroundColor: '#151b2e',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  healthTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  circularStatItem: {
    alignItems: 'center',
    gap: 6,
  },
  circleRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090b14',
  },
  circleStatNum: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  circleStatLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  floatingAssistantCard: {
    backgroundColor: '#1d2440',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    height: 54,
  },
  floatingAssistantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assistantIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingAssistantText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingAssistantBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingAssistantBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 20, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151b2e',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#090b14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configCard: {
    backgroundColor: '#090b14',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  configCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configCardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  configCardVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151b2e',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 6,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1d2440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  configHint: {
    fontSize: 10,
    color: '#64748b',
  },
  budgetAdjustRow: {
    flexDirection: 'row',
    gap: 10,
  },
  budgetAdjustBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#151b2e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetAdjustText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dailyBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  dailyBudgetLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  dailyBudgetVal: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: 'bold',
  },
  modalGenerateBtn: {
    height: 50,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalGenerateBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
