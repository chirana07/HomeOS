// scanner.tsx (Banking-Grade Receipt Scanner)
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Camera, X, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeIn,
  SlideInDown
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const router = useRouter();
  const { ingestReceipt, isDemoMode } = useApp();
  
  const [step, setStep] = useState<'idle' | 'scanning' | 'parsing' | 'success'>('idle');
  const [scanResult, setScanResult] = useState<any>(null);

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
      
      // Auto transition to parsing after 2.5 seconds
      const t = setTimeout(() => {
        setStep('parsing');
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'parsing') {
      // Simulate parser API request delay
      const t = setTimeout(async () => {
        const mockRawText = "Keells Super\nchicken 2 g - 1450\neggs 10 pcs - 480\nonions 500 g - 380\n";
        const dateStr = new Date().toISOString().split('T')[0];
        
        try {
          const res = await ingestReceipt("Keells Super", dateStr, mockRawText);
          if (res.success) {
            setScanResult(res);
            setStep('success');
          } else {
            alert(res.message);
            setStep('idle');
          }
        } catch (err) {
          alert('Scanner error occurred. Returning to cabinet.');
          setStep('idle');
        }
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value }]
  }));

  const handleCapture = () => {
    setStep('scanning');
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
          {/* Mock Camera Viewfinder */}
          <View style={styles.viewfinder}>
            <View style={styles.scanTargetBox} />
            <Text style={styles.viewfinderInstructions}>
              Align receipt page edges inside the frame.
            </Text>
          </View>

          {/* Trigger button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={handleCapture} style={styles.captureBtn}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {step === 'scanning' && (
        <Animated.View entering={FadeIn} style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={styles.scanTargetBox} />
            {/* Animated Laser Line */}
            <Animated.View style={[styles.laserLine, laserStyle]} />
            <Text style={[styles.viewfinderInstructions, { color: '#10b981' }]}>
              Reading receipt details...
            </Text>
          </View>
        </Animated.View>
      )}

      {step === 'parsing' && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>I'm thinking...</Text>
          <Text style={styles.loaderSub}>Extracting quantities & prices via Groq AI.</Text>
        </View>
      )}

      {step === 'success' && scanResult && (
        <Animated.View entering={SlideInDown} style={styles.successPanel}>
          <View style={styles.successIconBox}>
            <CheckCircle2 size={48} color="#10b981" />
          </View>
          
          <Text style={styles.successTitle}>Your pantry is up to date.</Text>
          <Text style={styles.successDesc}>
            Ingested {scanResult.parsed_items} items from Keells Super.
          </Text>

          {/* Expense Box */}
          <View style={styles.expenseBox}>
            <Text style={styles.expenseLabel}>Total Logged Expense</Text>
            <Text style={styles.expenseVal}>LKR {scanResult.total_expense.toLocaleString()}</Text>
          </View>

          {/* Success checklist summary */}
          <View style={styles.summaryList}>
            <View style={styles.summaryItem}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.summaryItemText}>Chicken quantity increased by 2.0 g.</Text>
            </View>
            <View style={styles.summaryItem}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.summaryItemText}>Eggs stock replenished (+10 pcs).</Text>
            </View>
            <View style={styles.summaryItem}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.summaryItemText}>Onions stock replenished (+500 g).</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>Confirm & Sync</Text>
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
  bottomBar: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
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
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
