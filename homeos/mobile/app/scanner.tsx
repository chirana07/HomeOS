// scanner.tsx (Banking-Grade Receipt Scanner with 2-Stage Review & Commit Workflow)
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  TextInput,
  ScrollView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Camera, X, CheckCircle2, ShieldCheck, Image as ImageIcon, CameraOff, Trash2, Plus, Edit3, Calendar, Store, DollarSign } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeIn,
  SlideInDown
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

interface ReviewedItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  price: string;
  estimated_expiry_date: string;
  freshness_status?: string;
}

export default function ScannerScreen() {
  const router = useRouter();
  const { ingestReceiptImage, confirmReceiptSave } = useApp();
  
  const [step, setStep] = useState<'idle' | 'permission_denied' | 'scanning' | 'review' | 'saving' | 'success'>('idle');
  const [progressStage, setProgressStage] = useState<'Uploading' | 'Reading Receipt' | 'Extracting Items' | 'Saving Records' | 'Finished'>('Uploading');
  const [scanResult, setScanResult] = useState<any>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  // Editable store metadata
  const [storeName, setStoreName] = useState('Supermarket');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Review items list state
  const [reviewItems, setReviewItems] = useState<ReviewedItem[]>([]);

  // Laser line animation
  const laserY = useSharedValue(0);

  useEffect(() => {
    if (step === 'scanning') {
      laserY.value = withRepeat(
        withSequence(
          withTiming(height * 0.45, { duration: 1200 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      );
      
      const processOCR = async () => {
        setProgressStage('Uploading');
        const dateStr = purchaseDate || new Date().toISOString().split('T')[0];
        try {
          let res: any;
          if (capturedImageUri) {
            const formData = new FormData();
            const filename = capturedImageUri.split('/').pop() || 'receipt.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            
            // @ts-ignore
            formData.append('file', { uri: capturedImageUri, name: filename, type });
            formData.append('store_name', storeName);
            formData.append('purchase_date', dateStr);
            
            setProgressStage('Reading Receipt');
            res = await ingestReceiptImage(formData);
          } else {
            // Default sample items if camera not used
            res = {
              success: true,
              store_name: "Keells Supermarket",
              purchase_date: dateStr,
              items: [
                { name: 'milk', quantity: '1', unit: 'l', price: 450, estimated_expiry_date: '2026-08-03', freshness_status: 'Fresh' },
                { name: 'wholegrain bread', quantity: '1', unit: 'pack', price: 220, estimated_expiry_date: '2026-08-01', freshness_status: 'Fresh' },
                { name: 'eggs', quantity: '10', unit: 'pcs', price: 480, estimated_expiry_date: '2026-08-17', freshness_status: 'Fresh' },
                { name: 'bananas', quantity: '1', unit: 'kg', price: 380, estimated_expiry_date: '2026-08-01', freshness_status: 'Fresh' },
                { name: 'toilet paper', quantity: '1', unit: 'pack', price: 650, estimated_expiry_date: 'N/A', freshness_status: 'Non-Perishable' },
                { name: 'shopping bag', quantity: '1', unit: 'pcs', price: 50, estimated_expiry_date: 'N/A', freshness_status: 'Non-Perishable' }
              ]
            };
          }

          if (res && res.success) {
            setStoreName(res.store_name || "Supermarket");
            setPurchaseDate(res.purchase_date || dateStr);
            const formatted = (res.items || []).map((it: any, idx: number) => ({
              id: (idx + 1).toString(),
              name: it.name || 'item',
              quantity: it.quantity ? it.quantity.toString() : '1',
              unit: it.unit || 'pcs',
              price: it.price ? it.price.toString() : '0',
              estimated_expiry_date: it.estimated_expiry_date || 'N/A',
              freshness_status: it.freshness_status || 'Fresh'
            }));
            setReviewItems(formatted);
            setStep('review');
          } else {
            alert(res?.message || 'Receipt OCR failed.');
            setStep('idle');
          }
        } catch (err: any) {
          alert('Scanner error: ' + (err.message || 'Unable to connect to backend.'));
          setStep('idle');
        }
      };

      processOCR();
    }
  }, [step]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value }]
  }));

  const handleCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      setStep('permission_denied');
      return;
    }

    const cameraResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!cameraResult.canceled && cameraResult.assets.length > 0) {
      setCapturedImageUri(cameraResult.assets[0].uri);
      setStep('scanning');
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access photo gallery is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      setCapturedImageUri(pickerResult.assets[0].uri);
      setStep('scanning');
    }
  };

  const handleItemChange = (id: string, field: keyof ReviewedItem, value: string) => {
    setReviewItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setReviewItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: ReviewedItem = {
      id: Date.now().toString(),
      name: 'new item',
      quantity: '1',
      unit: 'pcs',
      price: '100',
      estimated_expiry_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      freshness_status: 'Fresh'
    };
    setReviewItems(prev => [...prev, newItem]);
  };

  // Calculate total price automatically
  const totalReceiptValue = reviewItems.reduce((sum, item) => {
    const val = parseFloat(item.price);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Save to Pantry Button Handler (Triggers Stage 2 POST /api/receipts/confirm)
  const handleSaveToPantry = async () => {
    if (reviewItems.length === 0) {
      alert("Please add at least one item before saving.");
      return;
    }

    setStep('saving');
    setProgressStage('Saving Records');

    try {
      const payload = {
        store_name: storeName,
        purchase_date: purchaseDate,
        items: reviewItems.map(it => ({
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          price: parseFloat(it.price) || 0.0,
          estimated_expiry_date: it.estimated_expiry_date
        }))
      };

      const res = await confirmReceiptSave(payload);
      if (res && res.success) {
        setScanResult(res);
        setStep('success');
      } else {
        alert(res?.message || 'Failed to save confirmed receipt.');
        setStep('review');
      }
    } catch (err: any) {
      alert('Error saving receipt: ' + (err.message || 'Server error.'));
      setStep('review');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Receipt Ingestion</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <X size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {step === 'idle' && (
        <Animated.View entering={FadeIn} style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={styles.scanTargetBox} />
            <Text style={styles.viewfinderInstructions}>
              Align receipt page edges inside the frame or select a photo.
            </Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={handlePickImage} style={styles.galleryBtn}>
              <ImageIcon size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCapture} style={styles.captureBtn}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>

            <View style={{ width: 44 }} />
          </View>
        </Animated.View>
      )}

      {step === 'permission_denied' && (
        <View style={styles.permissionContainer}>
          <CameraOff size={48} color="#f43f5e" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDesc}>
            HomeOS needs camera permissions to scan grocery receipts, extract item prices, and calculate estimated food freshness automatically.
          </Text>
          <TouchableOpacity onPress={handleCapture} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'scanning' && (
        <Animated.View entering={FadeIn} style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={styles.scanTargetBox} />
            <Animated.View style={[styles.laserLine, laserStyle]} />
            <View style={styles.progressBadge}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.progressText}>{progressStage}...</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {step === 'review' && (
        <Animated.View entering={SlideInDown} style={styles.reviewContainer}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>Receipt Review Screen</Text>
            <Text style={styles.reviewSub}>Edit detected items and metadata before saving to SQLite.</Text>
          </View>

          {/* Store & Date Input Row */}
          <View style={styles.metaBox}>
            <View style={styles.metaInputGroup}>
              <Store size={14} color="#6366f1" />
              <TextInput 
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Store Name"
                placeholderTextColor="#64748b"
                style={styles.metaTextInput}
              />
            </View>
            <View style={styles.metaInputGroup}>
              <Calendar size={14} color="#6366f1" />
              <TextInput 
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
                style={styles.metaTextInput}
              />
            </View>
          </View>

          {/* Items Scroll List */}
          <ScrollView style={styles.reviewList} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            {reviewItems.map(item => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={{ flex: 1, gap: 6 }}>
                  <TextInput 
                    value={item.name}
                    onChangeText={(val) => handleItemChange(item.id, 'name', val)}
                    style={styles.reviewItemNameInput}
                  />
                  
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={styles.reviewMetaLabel}>Qty:</Text>
                    <TextInput 
                      value={item.quantity}
                      onChangeText={(val) => handleItemChange(item.id, 'quantity', val)}
                      keyboardType="numeric"
                      style={styles.reviewMetaInput}
                    />
                    <TextInput 
                      value={item.unit}
                      onChangeText={(val) => handleItemChange(item.id, 'unit', val)}
                      style={styles.reviewMetaInput}
                    />

                    <Text style={styles.reviewMetaLabel}>LKR:</Text>
                    <TextInput 
                      value={item.price}
                      onChangeText={(val) => handleItemChange(item.id, 'price', val)}
                      keyboardType="numeric"
                      style={styles.reviewMetaInputPrice}
                    />

                    <Text style={styles.reviewMetaLabel}>Expiry:</Text>
                    <TextInput 
                      value={item.estimated_expiry_date}
                      onChangeText={(val) => handleItemChange(item.id, 'estimated_expiry_date', val)}
                      style={styles.reviewMetaInputExpiry}
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.deleteItemBtn}>
                  <Trash2 size={18} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={handleAddItem} style={styles.addItemBtn}>
              <Plus size={16} color="#6366f1" />
              <Text style={styles.addItemBtnText}>+ Add Missing Item Manually</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Total Value Summary Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Receipt Value:</Text>
            <Text style={styles.totalVal}>LKR {totalReceiptValue.toLocaleString()}</Text>
          </View>

          <TouchableOpacity onPress={handleSaveToPantry} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Save to Pantry ({reviewItems.length} Items)</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {step === 'saving' && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>{progressStage}...</Text>
          <Text style={styles.loaderSub}>Writing reviewed records to SQLite & updating pantry context.</Text>
        </View>
      )}

      {step === 'success' && scanResult && (
        <Animated.View entering={SlideInDown} style={styles.successPanel}>
          <View style={styles.successIconBox}>
            <CheckCircle2 size={48} color="#10b981" />
          </View>
          
          <Text style={styles.successTitle}>Your pantry is up to date.</Text>
          <Text style={styles.successDesc}>
            Saved {scanResult.parsed_items} reviewed items to SQLite database.
          </Text>

          <View style={styles.expenseBox}>
            <Text style={styles.expenseLabel}>Total Logged Expense</Text>
            <Text style={styles.expenseVal}>LKR {scanResult.total_expense ? scanResult.total_expense.toLocaleString() : '0'}</Text>
          </View>

          <View style={styles.summaryList}>
            <View style={styles.summaryItem}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.summaryItemText}>SQLite inventory updated cleanly.</Text>
            </View>
            <View style={styles.summaryItem}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.summaryItemText}>Dashboard, Pantry & Assistant Context synced.</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>Confirm & Finish</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderContainer: {
    flex: 1,
  },
  viewfinder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    position: 'relative',
  },
  scanTargetBox: {
    width: width * 0.75,
    height: height * 0.45,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 24,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  laserLine: {
    position: 'absolute',
    left: width * 0.125,
    width: width * 0.75,
    height: 3,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    zIndex: 5,
  },
  viewfinderInstructions: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomBar: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingHorizontal: 30,
  },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  permissionDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#070a13',
  },
  reviewHeader: {
    marginBottom: 12,
  },
  reviewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reviewSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  metaBox: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metaInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  metaTextInput: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewList: {
    flex: 1,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  reviewItemNameInput: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#070a13',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reviewMetaLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  reviewMetaInput: {
    color: '#cbd5e1',
    fontSize: 11,
    backgroundColor: '#070a13',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 36,
  },
  reviewMetaInputPrice: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#070a13',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 50,
  },
  reviewMetaInputExpiry: {
    color: '#6366f1',
    fontSize: 11,
    backgroundColor: '#070a13',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 80,
  },
  deleteItemBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addItemBtnText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginTop: 8,
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalVal: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'black',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loaderSub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  successPanel: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  expenseBox: {
    backgroundColor: '#070a13',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  expenseLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expenseVal: {
    fontSize: 22,
    fontWeight: 'black',
    color: '#10b981',
  },
  summaryList: {
    width: '100%',
    gap: 10,
    marginBottom: 30,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryItemText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  doneBtn: {
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
