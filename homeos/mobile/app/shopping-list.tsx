import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ShoppingBag, CheckCircle2, AlertTriangle, Info, Clock, DollarSign } from 'lucide-react-native';
import { useApp } from '../context/AppContext';

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 4, 32);

  const { currentPlan } = useApp();
  const summary = currentPlan?.shopping_summary;
  const items = summary?.items || {};

  const criticalItems = items.critical || [];
  const essentialItems = items.essential || [];
  const runningLowItems = items.running_low || [];
  const totalAttention = summary?.total_attention_count || currentPlan?.shopping_list?.length || 0;
  const estCost = summary?.estimated_shopping_cost || 0;
  const wellStocked = summary?.well_stocked_count || 24;

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" translucent={false} />
      
      {/* Top Header Navigation - Seamless #0f172a background */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSubtitle}>Household Restocking Intelligence</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Summary Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.badgeContainer}>
              <ShoppingBag size={14} color="#f59e0b" />
              <Text style={styles.badgeText}>🛒 {totalAttention} items need attention</Text>
            </View>
            <View style={styles.wellStockedBadge}>
              <Text style={styles.wellStockedText}>{wellStocked} stocked</Text>
            </View>
          </View>

          <View style={styles.costBox}>
            <Text style={styles.costLabel}>Estimated Shopping Cost</Text>
            <Text style={styles.costValue}>LKR {estCost.toLocaleString()}</Text>
            <Text style={styles.costNote}>Cost to restore Critical & Essential items to target stock levels</Text>
          </View>
        </View>

        {totalAttention === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircle2 size={40} color="#10b981" />
            <Text style={styles.emptyTitle}>✅ Pantry Complete</Text>
            <Text style={styles.emptySub}>
              All household items are currently sufficiently stocked above target levels.
            </Text>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {/* 🔴 Critical Section */}
            {criticalItems.length > 0 && (
              <View style={styles.categoryCardCritical}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitleCritical}>
                    🔴 Critical — Buy Today ({criticalItems.length})
                  </Text>
                </View>
                <View style={styles.itemsList}>
                  {criticalItems.map((item: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemMainRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemStockText}>
                            {item.current_qty} remaining ({item.remaining_pct}% left)
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.itemCostText}>LKR {item.cost?.toLocaleString()}</Text>
                          {item.expiry_date ? (
                            <Text style={styles.expiryTag}>
                              Expires: {item.expiry_date}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {item.ai_reasoning ? (
                        <View style={styles.reasoningBoxCritical}>
                          <Info size={12} color="#f87171" style={{ marginRight: 4 }} />
                          <Text style={styles.reasoningTextCritical}>{item.ai_reasoning}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 🟠 Essential Section */}
            {essentialItems.length > 0 && (
              <View style={styles.categoryCardEssential}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitleEssential}>
                    🟠 Essential — Buy This Week ({essentialItems.length})
                  </Text>
                </View>
                <View style={styles.itemsList}>
                  {essentialItems.map((item: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemMainRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemStockText}>
                            {item.current_qty} remaining ({item.remaining_pct}% left)
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.itemCostText}>LKR {item.cost?.toLocaleString()}</Text>
                          {item.expiry_date ? (
                            <Text style={styles.expiryTagEssential}>
                              Expires: {item.expiry_date}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {item.ai_reasoning ? (
                        <View style={styles.reasoningBoxEssential}>
                          <Info size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                          <Text style={styles.reasoningTextEssential}>{item.ai_reasoning}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 🟡 Running Low Section */}
            {runningLowItems.length > 0 && (
              <View style={styles.categoryCardLow}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitleLow}>
                    🟡 Running Low ({runningLowItems.length})
                  </Text>
                </View>
                <View style={styles.itemsList}>
                  {runningLowItems.map((item: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemMainRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemStockText}>
                            {item.current_qty} remaining ({item.remaining_pct}% left)
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.itemCostText}>LKR {item.cost?.toLocaleString()}</Text>
                        </View>
                      </View>
                      {item.ai_reasoning ? (
                        <View style={styles.reasoningBoxLow}>
                          <Info size={12} color="#60a5fa" style={{ marginRight: 4 }} />
                          <Text style={styles.reasoningTextLow}>{item.ai_reasoning}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            {wellStocked} pantry items are currently well-stocked.
          </Text>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#151b2e',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  wellStockedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wellStockedText: {
    fontSize: 11,
    color: '#34d399',
    fontWeight: '600',
  },
  costBox: {
    backgroundColor: '#090b14',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  costLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  costValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#34d399',
    marginTop: 4,
  },
  costNote: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  sectionsContainer: {
    gap: 16,
  },
  categoryCardCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  categoryTitleCritical: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ef4444',
  },
  categoryCardEssential: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  categoryTitleEssential: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f59e0b',
  },
  categoryCardLow: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  categoryTitleLow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3b82f6',
  },
  categoryHeader: {
    marginBottom: 10,
  },
  itemsList: {
    gap: 10,
  },
  itemRow: {
    backgroundColor: '#090b14',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  itemStockText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  itemCostText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
  },
  expiryTag: {
    fontSize: 10,
    color: '#f87171',
    fontWeight: '600',
    marginTop: 2,
  },
  expiryTagEssential: {
    fontSize: 10,
    color: '#fbbf24',
    fontWeight: '600',
    marginTop: 2,
  },
  reasoningBoxCritical: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  reasoningTextCritical: {
    fontSize: 10,
    color: '#fca5a5',
    fontWeight: '600',
  },
  reasoningBoxEssential: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  reasoningTextEssential: {
    fontSize: 10,
    color: '#fde047',
    fontWeight: '600',
  },
  reasoningBoxLow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  reasoningTextLow: {
    fontSize: 10,
    color: '#93c5fd',
    fontWeight: '600',
  },
  footerNote: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 11,
    color: '#64748b',
  },
});
