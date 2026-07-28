// pantry.tsx (Pantry Cabinet Hub)
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  RefreshControl,
  Dimensions,
  Modal
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { Apple, Search, Calendar, Scale, Info, Layers, Camera, X, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeInRight, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function PantryTab() {
  const { inventory, isLoading, refreshData } = useApp();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<any>(null);

  const categories = ['All', 'Vegetables', 'Fruits', 'Proteins', 'Dairy', 'Grains', 'Household', 'Pantry Essentials'];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getItemName = (item: any): string => {
    return item.name || item.ingredient || 'Item';
  };

  const getItemStock = (item: any): number => {
    return typeof item.current_stock === 'number' 
      ? item.current_stock 
      : (typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || '0'));
  };

  const getCategoryForItem = (item: any): string => {
    if (item.category) return item.category;
    const name = getItemName(item).toLowerCase();
    if (name.includes('carrot') || name.includes('onion') || name.includes('garlic') || name.includes('tomato') || name.includes('spinach') || name.includes('potato')) return 'Vegetables';
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('berry')) return 'Fruits';
    if (name.includes('egg') || name.includes('chicken') || name.includes('fish') || name.includes('pork') || name.includes('beef')) return 'Proteins';
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('butter')) return 'Dairy';
    if (name.includes('rice') || name.includes('bread') || name.includes('flour') || name.includes('oat')) return 'Grains';
    if (name.includes('toilet paper') || name.includes('paper towel') || name.includes('soap') || name.includes('foil') || name.includes('bag')) return 'Household';
    return 'Pantry Essentials';
  };

  const filteredInventory = inventory.filter(item => {
    const itemName = getItemName(item).toLowerCase();
    const itemCategory = getCategoryForItem(item).toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = !query || itemName.includes(query) || itemCategory.includes(query);
    const matchesCategory = selectedCategory === 'All' || itemCategory === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getExpiryColor = (item: any) => {
    const status = item.freshness_status;
    if (status === 'Non-Perishable') return '#94a3b8';
    if (status === 'Fresh') return '#10b981';
    if (status === 'Expires Soon') return '#f59e0b';
    if (status === 'Expired') return '#f43f5e';
    return '#10b981';
  };

  const getExpiryText = (item: any) => {
    const status = item.freshness_status;
    if (status === 'Non-Perishable') return 'Non-Perishable';
    if (status === 'Fresh') return `Fresh (${item.days_remaining ?? 7}d left)`;
    if (status === 'Expires Soon') return `Expires Soon (${item.days_remaining ?? 2}d left)`;
    if (status === 'Expired') return `Expired`;
    return item.days_remaining ? `${item.days_remaining}d left` : 'Fresh';
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>Cabinet & Inventory</Text>
        <Text style={styles.subText}>Live SQLite Inventory Records</Text>
      </View>

      {/* Insight Banner */}
      <Animated.View entering={FadeInUp} style={styles.insightBanner}>
        <Info size={16} color="#6366f1" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.insightTitle}>Pantry Intelligence</Text>
          <Text style={styles.insightBody}>
            {inventory.length > 0 
              ? `SQLite currently tracks ${inventory.length} active ingredients in your cabinet.` 
              : "Your pantry is empty. Scan a receipt to log purchased items into SQLite!"}
          </Text>
        </View>
      </Animated.View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items, categories, aliases..."
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
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Layers size={36} color="#64748b" />
            <Text style={styles.emptyText}>
              {isLoading ? "Loading inventory from SQLite..." : "No matching ingredients found."}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const itemName = getItemName(item);
          const stock = getItemStock(item);
          const expiryColor = getExpiryColor(item);

          return (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setSelectedItemForModal(item)}
            >
              <Animated.View 
                entering={FadeInRight.delay(index * 40)} 
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
                  <Text style={styles.foodName}>{itemName}</Text>
                  
                  <View style={styles.badgeRow}>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>
                        {stock.toFixed(0)} {item.unit || 'pcs'}
                      </Text>
                    </View>
                    <View style={[styles.expiryBadge, { backgroundColor: `${expiryColor}15`, borderColor: expiryColor, borderWidth: 1 }]}>
                      <Calendar size={10} color={expiryColor} />
                      <Text style={[styles.expiryText, { color: expiryColor, fontWeight: 'bold' }]}>
                        {getExpiryText(item)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.priceLabel}>
                    Avg Price: LKR {item.avg_price ? item.avg_price.toLocaleString() : '0'} • {getCategoryForItem(item)}
                  </Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Item Details Modal */}
      {selectedItemForModal && (
        <Modal
          visible={!!selectedItemForModal}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedItemForModal(null)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={SlideInDown} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{getItemName(selectedItemForModal)}</Text>
                <TouchableOpacity onPress={() => setSelectedItemForModal(null)} style={styles.modalCloseBtn}>
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDetailGrid}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Category:</Text>
                  <Text style={styles.modalVal}>{getCategoryForItem(selectedItemForModal)}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Stock Level:</Text>
                  <Text style={styles.modalVal}>{getItemStock(selectedItemForModal)} {selectedItemForModal.unit || 'pcs'}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Freshness Status:</Text>
                  <Text style={[styles.modalVal, { color: getExpiryColor(selectedItemForModal), fontWeight: 'bold' }]}>
                    {getExpiryText(selectedItemForModal)}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Purchase Date:</Text>
                  <Text style={styles.modalVal}>{selectedItemForModal.purchase_date || 'Today'}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Estimated Expiry:</Text>
                  <Text style={styles.modalVal}>{selectedItemForModal.estimated_expiry_date || 'N/A'}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Expected Shelf Life:</Text>
                  <Text style={styles.modalVal}>
                    {selectedItemForModal.shelf_life_days === -1 ? 'Non-Perishable' : `${selectedItemForModal.shelf_life_days || 7} days`}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalLabel}>Average Price:</Text>
                  <Text style={styles.modalVal}>LKR {selectedItemForModal.avg_price ? selectedItemForModal.avg_price.toLocaleString() : '0'}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setSelectedItemForModal(null)} style={styles.modalDoneBtn}>
                <Text style={styles.modalDoneBtnText}>Close Details</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}

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
    color: '#6366f1',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  insightBody: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  categoriesWrapper: {
    marginTop: 16,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontWeight: 'bold',
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 4,
  },
  foodName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  quantityText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  expiryText: {
    fontSize: 11,
  },
  priceLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDetailGrid: {
    gap: 12,
    marginBottom: 24,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  modalVal: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalDoneBtn: {
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
