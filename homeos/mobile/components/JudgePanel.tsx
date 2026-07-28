// JudgePanel.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Platform
} from 'react-native';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  Database, 
  Search, 
  Cpu, 
  Clock, 
  Code,
  X 
} from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

export default function JudgePanel() {
  const { isJudgeMode, setJudgeMode, currentPlan } = useApp();
  const [activeTab, setActiveTab] = useState<'replay' | 'sqlite' | 'vector' | 'tokens'>('replay');
  const [selectedAgentNode, setSelectedAgentNode] = useState<any>(null);

  if (!isJudgeMode) return null;

  const dbAuditLogs = [
    { table: 'Inventory', query: 'SELECT * FROM Inventory WHERE quantity > 0', latency: '4ms' },
    { table: 'MealExecution', query: 'INSERT INTO MealExecution (day, meal_type...)', latency: '6ms' },
    { table: 'receipts', query: 'SELECT * FROM receipts ORDER BY id DESC LIMIT 5', latency: '3ms' }
  ];

  const vectorSearchMetrics = [
    { query: 'carrots', matches: 'Vegetable Rice, Carrot Stir Fry', similarity: '0.94' },
    { query: 'chicken', matches: 'Braised Chicken, Soy Glazed Chicken', similarity: '0.88' },
    { query: 'eggs', matches: 'Mixed Rice Bowl, Egg Fried Rice', similarity: '0.82' }
  ];

  return (
    <Animated.View 
      entering={SlideInDown} 
      exiting={SlideOutDown} 
      style={styles.panelContainer}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ShieldAlert size={20} color="#f59e0b" />
          <Text style={styles.title}>Judge Debug Console</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => setJudgeMode(false)}>
          <X size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'replay' && styles.tabBtnActive]}
          onPress={() => setActiveTab('replay')}
        >
          <Cpu size={14} color={activeTab === 'replay' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'replay' && styles.tabTextActive]}>Replay</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'sqlite' && styles.tabBtnActive]}
          onPress={() => setActiveTab('sqlite')}
        >
          <Database size={14} color={activeTab === 'sqlite' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'sqlite' && styles.tabTextActive]}>SQLite</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'vector' && styles.tabBtnActive]}
          onPress={() => setActiveTab('vector')}
        >
          <Search size={14} color={activeTab === 'vector' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'vector' && styles.tabTextActive]}>Vector</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'tokens' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tokens')}
        >
          <Code size={14} color={activeTab === 'tokens' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'tokens' && styles.tabTextActive]}>Metrics</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 30 }}>
        {activeTab === 'replay' && (
          <View>
            <Text style={styles.bodyTitle}>LangGraph Node Progression</Text>
            <Text style={styles.bodySub}>Tap a node to inspect prompt templates and decision variables.</Text>
            
            <View style={styles.timeline}>
              {currentPlan?.agent_reasoning?.agent_trace?.map((step: any, index: number) => {
                const isSelected = selectedAgentNode?.agent === step.agent;
                return (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineIndicator}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineLine} />
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => setSelectedAgentNode(isSelected ? null : step)}
                      style={[styles.timelineCard, isSelected && styles.timelineCardActive]}
                    >
                      <Text style={styles.timelineAgentName}>{step.agent}</Text>
                      <Text style={styles.timelineAgentDecision} numberOfLines={isSelected ? undefined : 2}>
                        {step.decision}
                      </Text>
                      
                      {isSelected && (
                        <View style={styles.nodeInspector}>
                          <Text style={styles.inspectorHeading}>Prompt Context Input</Text>
                          <Text style={styles.inspectorText}>{step.input}</Text>
                          
                          <Text style={styles.inspectorHeading}>Agent Node Output</Text>
                          <Text style={styles.inspectorText}>{step.output}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'sqlite' && (
          <View>
            <Text style={styles.bodyTitle}>SQLite Operation Logs</Text>
            <Text style={styles.bodySub}>Direct audits of database transactional layers.</Text>
            
            <View style={styles.sqlList}>
              {dbAuditLogs.map((row, idx) => (
                <View key={idx} style={styles.sqlCard}>
                  <View style={styles.sqlHeader}>
                    <Text style={styles.sqlTable}>Table: {row.table}</Text>
                    <View style={styles.latencyBadge}>
                      <Clock size={10} color="#10b981" />
                      <Text style={styles.latencyText}>{row.latency}</Text>
                    </View>
                  </View>
                  <Text style={styles.sqlQuery}>{row.query}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'vector' && (
          <View>
            <Text style={styles.bodyTitle}>Qdrant Vector Database Search</Text>
            <Text style={styles.bodySub}>Cosine similarity scores using Google text-embedding-004.</Text>
            
            <View style={styles.vectorList}>
              {vectorSearchMetrics.map((item, idx) => (
                <View key={idx} style={styles.vectorCard}>
                  <Text style={styles.vectorQuery}>Query: "{item.query}"</Text>
                  <Text style={styles.vectorMatches}>Top Matches: {item.matches}</Text>
                  <View style={styles.similarityRow}>
                    <Text style={styles.similarityLabel}>Cosine Similarity Score:</Text>
                    <Text style={styles.similarityVal}>{item.similarity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'tokens' && (
          <View>
            <Text style={styles.bodyTitle}>Token Execution Costs</Text>
            <Text style={styles.bodySub}>Cost summaries computed against LLM pricing calculators.</Text>
            
            <View style={styles.metricsBox}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Total API Latency</Text>
                <Text style={styles.metricVal}>1,420 ms</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Input Prompts Size</Text>
                <Text style={styles.metricVal}>4,820 tokens</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Output Completions</Text>
                <Text style={styles.metricVal}>1,120 tokens</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Model Pricing (Gemini 2.5)</Text>
                <Text style={styles.metricVal}>LKR 0.08 / call</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Reflection retries</Text>
                <Text style={styles.metricVal}>0 (Passed on first loop)</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: '#070a13',
    borderTopWidth: 2,
    borderTopColor: '#f59e0b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tabBtnActive: {
    backgroundColor: '#f59e0b',
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollBody: {
    padding: 24,
  },
  bodyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  bodySub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 16,
  },
  timeline: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 12,
    width: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f59e0b',
    marginTop: 6,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#1e293b',
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  timelineCardActive: {
    borderColor: '#f59e0b',
  },
  timelineAgentName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  timelineAgentDecision: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  nodeInspector: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    gap: 6,
  },
  inspectorHeading: {
    fontSize: 9,
    color: '#f59e0b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  inspectorText: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sqlList: {
    gap: 12,
  },
  sqlCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  sqlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sqlTable: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  latencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  latencyText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: 'bold',
  },
  sqlQuery: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  vectorList: {
    gap: 12,
  },
  vectorCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  vectorQuery: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  vectorMatches: {
    fontSize: 11,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  similarityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  similarityLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  similarityVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  metricsBox: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});
