import React, { useState } from "react";
import { 
  Text, 
  View, 
  StyleSheet,
  ImageBackground,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  scale,
  scaleWidth,
  scaleHeight,
  hp,
  RESPONSIVE,
} from '../Components/Responsiveness/gameResponsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POTION_DATA = [
  { id: 1, name: 'Health', price: 250, quantity: 5, image: 'https://github.com/user-attachments/assets/2f3f2308-5b02-4f7c-9f6b-2b15e992c111' },
  { id: 2, name: 'Mana', price: 200, quantity: 3, image: 'https://github.com/user-attachments/assets/2f3f2308-5b02-4f7c-9f6b-2b15e992c111' },
  { id: 3, name: 'Strong', price: 400, quantity: 1, image: 'https://github.com/user-attachments/assets/2f3f2308-5b02-4f7c-9f6b-2b15e992c111' },
  { id: 4, name: 'Freeze', price: 300, quantity: 0, image: 'https://github.com/user-attachments/assets/2f3f2308-5b02-4f7c-9f6b-2b15e992c111' },
  { id: 5, name: 'Speed', price: 350, quantity: 7, image: 'https://github.com/user-attachments/assets/2f3f2308-5b02-4f7c-9f6b-2b15e992c111' },
  { id: 6, name: 'Hint', price: 150, quantity: 2, image: 'https://github.com/user-attachments/assets/2f3f2308-5b02-4f7c-9f6b-2b15e992c111' },
];

const getPotionColors = (name) => {
  const colorMap = {
    Health: { background: 'rgba(220, 38, 38, 1)', border: '#dc2626', frameColor: '#991b1b', innerColor: '#f87171', pressedColor: '#b91c1c' },
    Strong: { background: 'rgba(245, 159, 11, 1)', border: '#f59e0b', frameColor: '#d97706', innerColor: '#fbbf24', pressedColor: '#ea580c' },
    Hint: { background: 'rgba(37, 100, 235, 1)', border: '#2563eb', frameColor: '#1d4ed8', innerColor: '#60a5fa', pressedColor: '#1e40af' },
    Mana: { background: 'rgba(0, 213, 255, 0.44)', border: '#00d5ff', frameColor: '#0891b2', innerColor: '#22d3ee', pressedColor: '#0e7490' },
    Freeze: { background: 'rgba(168, 85, 247, 0.8)', border: '#a855f7', frameColor: '#7c3aed', innerColor: '#c4b5fd', pressedColor: '#6d28d9' },
    Speed: { background: 'rgba(34, 197, 94, 0.8)', border: '#22c55e', frameColor: '#16a34a', innerColor: '#86efac', pressedColor: '#15803d' },
    Immune: { background: 'rgba(156, 163, 175, 0.8)', border: '#9ca3af', frameColor: '#6b7280', innerColor: '#d1d5db', pressedColor: '#4b5563' },
  };
  return colorMap[name] || { background: 'rgba(0, 213, 255, 0.44)', border: '#00d5ff', frameColor: '#0891b2', innerColor: '#22d3ee', pressedColor: '#0e7490' };
};

export default function Practice() {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }} 
        style={styles.ImageBackgroundContainer} 
        resizeMode="cover"
      >
        <View style={styles.backgroundOverlay} />
        
        {/* Top Frame - 40% */}
        <View style={styles.topFrame}>
          <ImageBackground 
            source={{ uri: 'https://res.cloudinary.com/dpbocuozx/image/upload/v1760335389/file_000000000af46209afeffe89e7b90925_ypagkm.png' }} 
            style={styles.ImageBackgroundTop} 
          />
        </View>
        
        {/* Bottom Frame - 60% */}
        <View style={styles.bottomFrame}>
          <ImageBackground 
            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760334965/shop_holder_deydxu.png' }} 
            style={styles.ImageBackgroundBottom}
            resizeMode="contain"
          >
            {/* Absolute overlay for Potions inside the bottom ImageBackground */}
            <View style={styles.potionsOverlay}>
              {selected ? (
                <DetailView selected={selected} onBack={() => setSelected(null)} />
              ) : (
                <PotionsGrid data={POTION_DATA} onSelect={(p) => p.quantity > 0 && setSelected(p)} />
              )}
            </View>
          </ImageBackground>
        </View>
      </ImageBackground>
    </View>
  );
}

function PotionsGrid({ data, onSelect }) {
  return (
    <ScrollView 
      contentContainerStyle={styles.gridWrap}
      showsVerticalScrollIndicator={false}
    >
      {data.map((potion) => {
        const colors = getPotionColors(potion.name);
        const isOut = potion.quantity === 0;
        return (
          <View key={potion.id} style={styles.cardCell}>
            <Pressable
              onPress={() => !isOut && onSelect(potion)}
              disabled={isOut}
              style={({ pressed }) => [
                styles.potionFrame,
                { backgroundColor: colors.frameColor },
                isOut && styles.outOfStockSlot,
                pressed && { transform: [{ translateY: 1 }] },
              ]}
            >
              <View
                style={[
                  styles.potionSlot,
                  {
                    backgroundColor: colors.border,
                    borderTopColor: colors.innerColor,
                    borderLeftColor: colors.innerColor,
                    borderBottomColor: colors.frameColor,
                    borderRightColor: colors.frameColor,
                  },
                ]}
              >
                <View style={styles.potionSlotInner}>
                  <View style={styles.potionSlotContent}>
                    <View style={styles.potionHighlight} />
                    <View style={styles.potionShadow} />
                    <Image source={{ uri: potion.image }} style={[styles.potionImage, isOut && styles.potionImageDisabled]} />
                    <View style={[styles.countContainer, isOut && styles.countContainerDisabled]}>
                      <Text style={styles.countText}>{potion.quantity}</Text>
                    </View>
                    <View style={styles.nameContainer}>
                      <Text style={[styles.nameText, isOut && styles.nameTextDisabled]}>{potion.name}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Price: {potion.price}</Text>
              <Text style={styles.metaText}>Qty: {potion.quantity}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function DetailView({ selected, onBack }) {
  const colors = getPotionColors(selected.name);
  const isOut = selected.quantity === 0;

  return (
    <View style={[styles.detailCard, { borderColor: colors.border }]}>
      <View style={[styles.potionFrame, { backgroundColor: colors.frameColor, width: SCREEN_WIDTH * 0.45, height: SCREEN_WIDTH * 0.55 }]}>
        <View
          style={[
            styles.potionSlot,
            {
              backgroundColor: colors.border,
              borderTopColor: colors.innerColor,
              borderLeftColor: colors.innerColor,
              borderBottomColor: colors.frameColor,
              borderRightColor: colors.frameColor,
            },
          ]}
        >
          <View style={styles.potionSlotInner}>
            <View style={styles.potionSlotContent}>
              <View style={styles.potionHighlight} />
              <View style={styles.potionShadow} />
              <Image source={{ uri: selected.image }} style={styles.potionImage} />
              <View style={styles.countContainer}>
                <Text style={styles.countText}>{selected.quantity}</Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.nameText}>{selected.name}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailInfo}>
        <Text style={styles.detailTitle}>{selected.name} Potion</Text>
        <Text style={styles.detailText}>Price: {selected.price} coins</Text>
        <Text style={styles.detailText}>Quantity: {selected.quantity}</Text>
      </View>

      <View style={styles.detailActions}>
        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: isOut ? '#666' : '#22c55e' }]}
          disabled={isOut}
          onPress={onBack}
        >
          <Text style={styles.actionText}>{isOut ? 'Out of Stock' : 'Buy'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.actionText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  ImageBackgroundContainer: {
    width: '100%',
    height: '100%',
    alignContent: 'center',
  },
  ImageBackgroundTop:{
    width: scaleWidth(390),
    height: scaleHeight(390),
  },
  ImageBackgroundBottom: {
    width: scaleWidth(810),
    height: scaleHeight(810),
    alignContent: 'center',
    top: scaleHeight(130),
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.54)', 
  },
  topFrame: {
    height: hp(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: scale(2),
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomFrame: {
    height: hp(60),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Absolute overlay area for potions inside the bottom image
  potionsOverlay: {
    position: 'absolute',
    left: scaleWidth(60),
    right: scaleWidth(60),
    top: scaleHeight(40),
    bottom: scaleHeight(80),
    justifyContent: 'center',
  },

  // Grid
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardCell: {
    width: SCREEN_WIDTH * 0.40,
    marginBottom: SCREEN_WIDTH * 0.05,
  },

  // Potion frame styling (from Potions.jsx, adapted)
  potionFrame: {
    width: SCREEN_WIDTH * 0.30,
    height: SCREEN_WIDTH * 0.30,
    borderRadius: SCREEN_WIDTH * 0.03,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },
  potionSlot: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.025,
    position: 'relative',
    overflow: 'visible',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  outOfStockSlot: {
    opacity: 0.4,
  },
  potionSlotInner: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.02,
    padding: 2,
    overflow: 'hidden',
  },
  potionSlotContent: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.015,
    backgroundColor: '#10075380',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },
  potionHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: SCREEN_WIDTH * 0.015,
    borderTopRightRadius: SCREEN_WIDTH * 0.015,
  },
  potionShadow: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomLeftRadius: SCREEN_WIDTH * 0.015,
    borderBottomRightRadius: SCREEN_WIDTH * 0.015,
  },
  potionImage: {
    width: '70%',
    height: '55%',
    borderRadius: 8,
    zIndex: 2,
    resizeMode: 'contain',
  },
  potionImageDisabled: {
    opacity: 0.3,
  },
  countContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
    zIndex: 3,
  },
  countContainerDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: '#666',
  },
  countText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
  },
  nameContainer: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 2,
    zIndex: 3,
  },
  nameText: {
    color: '#ffffff94',
    fontSize: 10,
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  nameTextDisabled: {
    color: '#666',
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'DynaPuff',
  },

  // Detail view
  detailCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(16, 7, 83, 0.5)',
    alignItems: 'center',
  },
  detailInfo: {
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  detailTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'DynaPuff',
    marginBottom: 4,
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'DynaPuff',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    alignSelf: 'stretch',
  },
  buyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
  },
});