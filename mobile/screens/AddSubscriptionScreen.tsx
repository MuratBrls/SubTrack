import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storageService } from '../services/storageService';
import { Category, BillingCycle, Currency, Subscription } from '../types';

export default function AddSubscriptionScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.TRY);
  const [category, setCategory] = useState<Category>(Category.OTHER);
  const [cycle, setCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Error', 'Please fill in Name and Price');
      return;
    }

    const newSub: Subscription = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      price: parseFloat(price),
      currency,
      category,
      cycle,
      nextPaymentDate: date,
      logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`
    };

    await storageService.addSubscription(newSub);
    
    // Reset Form
    setName('');
    setPrice('');
    setCategory(Category.OTHER);
    
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>New Subscription</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Service Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Netflix"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            
            {/* Simple Currency Selector UI */}
            <View style={[styles.formGroup, { width: 100 }]}>
               <Text style={styles.label}>Currency</Text>
               <View style={styles.pickerContainer}>
                  <Text style={styles.pickerValue}>{currency}</Text>
               </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {Object.values(Category).map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.chip, 
                    category === cat && { backgroundColor: '#4f46e5', borderColor: '#4f46e5' }
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    category === cat && { color: '#ffffff' }
                  ]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Next Payment Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-01-01"
              value={date}
              onChangeText={setDate}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Subscription</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1e293b',
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});