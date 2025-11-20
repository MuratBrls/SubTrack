import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storageService } from '../services/storageService';
import { Subscription, CURRENCY_SYMBOLS, CATEGORY_COLORS } from '../types';
import { Trash2, Wallet } from 'lucide-react-native';

export default function DashboardScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await storageService.getSubscriptions();
    setSubscriptions(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Subscription",
      "Are you sure you want to delete this?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const updated = await storageService.deleteSubscription(id);
            setSubscriptions(updated);
          }
        }
      ]
    );
  };

  // Metrics
  const totalMonthly = subscriptions.reduce((acc, sub) => {
    let price = sub.price;
    if (sub.cycle === 'Yearly') price = sub.price / 12;
    if (sub.cycle === 'Weekly') price = sub.price * 4;
    return acc + price;
  }, 0);

  const renderItem = ({ item }: { item: Subscription }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.logoContainer}>
           <Image 
             source={{ uri: item.logoUrl }} 
             style={styles.logo} 
           />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: CATEGORY_COLORS[item.category] + '20' }]}>
             <Text style={[styles.badgeText, { color: CATEGORY_COLORS[item.category] }]}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{CURRENCY_SYMBOLS[item.currency]}{item.price}</Text>
            <Text style={styles.cycleText}>/{item.cycle}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>Next: {item.nextPaymentDate}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SubTrack AI</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIconBg}>
           <Wallet size={24} color="#ffffff" />
        </View>
        <View>
            <Text style={styles.summaryLabel}>Monthly Spend</Text>
            <Text style={styles.summaryValue}>${totalMonthly.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Subscriptions</Text>

      <FlatList
        data={subscriptions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No subscriptions yet.</Text>
                <Text style={styles.emptySubText}>Tap the + button to add one.</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
  },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 24,
  },
  summaryIconBg: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  summaryLabel: {
    color: '#e0e7ff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cycleText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#94a3b8',
    fontSize: 14,
  }
});