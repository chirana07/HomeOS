// pantry.tsx (Visual Pantry Hub)
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Dimensions
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Plus, 
  Minus, 
  Camera, 
  Info,
  Calendar,
  Layers,
  Scale
} from 'lucide-react-native';
import Animated, { FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function PantryScreen() {
  const { inventory, setInventory, isOffline } = useApp();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Veggies', 'Proteins', 'Grains', 'Pantry Essentials'];

  const getCategoryForItem = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('carrot') || n.includes('onion') || n.includes('garlic') || n.includes('tomato') || n.includes('bean')) return 'Veggies';
    if (n.includes('egg') || n.includes('chicken') || n.includes('fish') || n.includes('pork') || n.includes('beef')) return 'Proteins';
    if (n.includes('rice') || n.includes('flour') || n.includes('oat')) return 'Grains';
    return 'Pantry Essentials';
  };

  const handleAdjustQuantity = (id: number, delta: number) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        const step = item.unit === 'g' || item.unit === 'ml' ? 100 : 1;
        const newQty = Math.max(0, item.current_stock + (step * delta));
        return {
          ...item,
          current_stock: newQty,
          original_quantity: Math.max(item.original_quantity, newQty)
        };
      }
      return item;
    });
    setInventory(updated);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || getCategoryForItem(item.name) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Expiry ring helpers
  const getExpiryColor = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return '#f43f5e'; // Red (expires tomorrow/today)
    if (diffDays <= 3) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const getExpiryText = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `${diffDays} days left`;
  };

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Pantry Cabinet</Text>
        <Text style={styles.subText}>AI-analyzed stock levels and shelf life.</Text>
      </View>

      {/* Smart Pantry Insights Banner */}
      <Animated.View entering={FadeInUp} style={styles.insightBanner}>
        <Info size={16} color="#6366f1" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.insightTitle}>Pantry Intelligence</Text>
          <Text style={styles.insightBody}>
            You have ingredients for 8 meals. Chicken and Eggs will expire in 2 days. Onions are well-stocked.
          </Text>
        </View>
      </Animated.View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items..."
          placeholderTextColor="#64748b"
          style={styles.searchInput}
        />
      </View>

      {/* Horizontal Category Filter */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesContent}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            return (
              <TouchableOpacity 
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Food Items List */}
      <FlatList
        data={filteredInventory}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Layers size={36} color="#64748b" />
            <Text style={styles.emptyText}>No matching ingredients found.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const expiryColor = getExpiryColor(item.expiry_date);
          const percentLeft = item.original_quantity > 0 
            ? (item.current_stock / item.original_quantity) * 100 
            : 0;

          return (
            <Animated.View 
              entering={FadeInRight.delay(index * 50)} 
              style={styles.foodCard}
            >
              {/* Expiry Ring Icon Indicator */}
              <View style={styles.ringContainer}>
                <View style={[styles.ringOuter, { borderColor: expiryColor }]}>
                  <Scale size={18} color={expiryColor} />
                </View>
              </View>

              {/* Food Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                
                <View style={styles.badgeRow}>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>
                      {item.current_stock.toFixed(0)} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.expiryBadge}>
                    <Calendar size={10} color={expiryColor} />
                    <Text style={[styles.expiryText, { color: expiryColor }]}>
                      {getExpiryText(item.expiry_date)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.priceLabel}>
                  Avg Price: LKR {item.avg_price ? item.avg_price.toLocaleString() : '0'}
                </Text>
              </View>

              {/* Quantity Adjusters */}
              <View style={styles.adjusters}>
                <TouchableOpacity 
                  onPress={() => handleAdjustQuantity(item.id, -1)}
                  style={styles.adjustBtn}
                >
                  <Minus size={14} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[
                      styles.progressBarFill, 
                      { width: `${Math.min(100, percentLeft)}%`, backgroundColor: expiryColor }
                    ]} />
                  </View>
                  <Text style={styles.percentText}>{percentLeft.toFixed(0)}%</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => handleAdjustQuantity(item.id, 1)}
                  style={styles.adjustBtn}
                >
                  <Plus size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        }}
      />

      {/* Floating Banking-Style Receipt Ingest FAB */}
      <TouchableOpacity 
        onPress={() => router.push('/scanner')}
        style={styles.fab}
      >
        <Camera size={22} color="#fff" />
        <Text style={styles.fabText}>Scan Receipt</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  insightBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 24,
    marginTop: 16,
    gap: 10,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  insightBody: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  categoriesWrapper: {
    marginTop: 14,
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
  },
  ringContainer: {
    marginRight: 14,
  },
  ringOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cardInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  quantityBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantityText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expiryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  adjusters: {
    alignItems: 'center',
    gap: 8,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBarBg: {
    width: 36,
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  percentText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
