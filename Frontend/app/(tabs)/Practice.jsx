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
  { id: 1, name: 'Love',  price: 250, quantity: 5, image: 'https://github.com/user-attachments/assets/765b1917-5b6a-4156-9d38-0acbdbfc909a', description: 'A warm elixir that momentarily boosts charm and empathy.' },
  { id: 2, name: 'Mana',  price: 200, quantity: 3, image: 'https://github.com/user-attachments/assets/d2a4ab58-2d5d-4e35-80b2-71e591bdd297', description: 'Restores magical energy; ideal for spellcasting in long encounters.' },
  { id: 3, name: 'Strong', price: 400, quantity: 1, image: 'https://github.com/user-attachments/assets/3264eb79-0afd-4987-8c64-6d46b0fc03a0', description: 'Temporarily increases physical strength and melee damage.' },
  { id: 4, name: 'Freeze', price: 300, quantity: 0, image: 'https://github.com/user-attachments/assets/3264eb79-0afd-4987-8c64-6d46b0fc03a0', description: 'Emits a chilling vapor that slows enemies for a short duration.' },
  { id: 5, name: 'Speed', price: 350, quantity: 7, image: 'https://github.com/user-attachments/assets/d2a4ab58-2d5d-4e35-80b2-71e591bdd297', description: 'Sharpens reflexes and movement speed for quick maneuvers.' },
  { id: 6, name: 'Hint',  price: 150, quantity: 2, image: 'https://github.com/user-attachments/assets/d2a4ab58-2d5d-4e35-80b2-71e591bdd297', description: 'A subtle whisper of guidance—reveals a helpful hint for puzzles.' },
];

const getPotionColors = (name) => {
  const brown = '#943f02ff';
  return {
    background: brown,
    border: brown,
    frameColor: brown,
    innerColor: brown,
    pressedColor: brown,
  };
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
          </ImageBackground>

          {/* potionsOverlay now always renders the grid.
              When a potion is selected we also render DetailView as an overlay,
              so the grid remains visible while the details are shown. */}
          <View style={styles.potionsOverlay}>
            <PotionsGrid data={POTION_DATA} onSelect={(p) => p.quantity > 0 && setSelected(p)} />

            {selected && (
              <View style={styles.detailOverlay}>
                <DetailView selected={selected} onBack={() => setSelected(null)} />
              </View>
            )}
          </View>
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
              <Image source={{ uri: selected.image }} style={styles.potionImageDetail} />
              <View style={styles.countContainerDetail}>
                <Text style={styles.countTextDetail}>{selected.quantity}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailInfo}>
        <Text style={styles.detailTitle}>{selected.name} Potion</Text>
        <Text style={styles.detailText}>Price: {selected.price} coins</Text>

        {/* ADDED: description below the price (comes from POTION_DATA) */}
        <Text style={styles.detailDescription}>{selected.description}</Text>

      </View>

      <View style={styles.detailActions}>
        <TouchableOpacity
          style={[styles.buyButton, isOut ? styles.keyDisabled : styles.keyActive]}
          disabled={isOut}
          onPress={onBack}
        >
          <Text style={[styles.actionText, styles.keyText]}>{isOut ? 'Out of Stock' : 'Buy'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backButton, styles.keyActive]}
          activeOpacity={0.9}
          onPress={onBack}
        >
          <Text style={[styles.actionText, styles.keyText]}>Back</Text>
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
    width: scaleWidth(700),
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
    borderBottomWidth: scale(20),
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomFrame: {
    height: hp(60),
    justifyContent: 'center',
    alignItems: 'center',
  },

  potionsOverlay: {
    position: 'absolute',
    zIndex: 100,
    justifyContent: 'center',
    marginTop: scaleHeight(-130)
  },

  detailOverlay: {
    position: 'absolute',
    right: scaleWidth(68),
    top: scaleHeight(6),
    zIndex: 200,
    alignItems: 'center',
  },

  // Grid
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(30),
  },
  cardCell: {
    width: '30%',    
    marginBottom: scaleHeight(20),
    alignItems: 'center',
  },

  potionFrame: {
    width: scaleWidth(100),
    aspectRatio: scaleWidth(140) / scaleHeight(200),
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
    backgroundColor: '#ffffff7b',
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
    position: 'absolute',
    width: scaleWidth(120),
    height: scaleHeight(200),
    borderRadius: 8,
    zIndex: 2,
    resizeMode: 'contain',
  },
  potionImageDetail:{
    position: 'absolute',
    width: scaleWidth(200),
    height: scaleHeight(200),
    borderRadius: 8,
  },
  potionImageDisabled: {
    opacity: 0.3,
  },
  countContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    minWidth: scaleWidth(30),
    height: scaleHeight(24),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(112, 63, 0, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
    zIndex: 3,
  },
  countContainerDetail:{
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    minWidth: scaleWidth(50),
    height: scaleHeight(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(112, 63, 0, 1)',
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
    color: 'white',
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'DynaPuff',
  },
  countTextDetail: {
    color: 'white',
    fontSize: SCREEN_WIDTH * 0.05,
    fontFamily: 'DynaPuff',
  },
  nameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: SCREEN_WIDTH * 0.03,
    borderTopRightRadius: SCREEN_WIDTH * 0.03,
    zIndex: 3,
  },
  nameText: {
    color: '#fbf7f794',
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'DynaPuff',
    textAlign: 'center',
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
    top: scaleHeight(-20),
    borderWidth: scale(4),
    borderRadius: 12,
    width: scaleWidth(250),
    padding: 12,
    backgroundColor: 'rgba(87, 32, 5, 1)',
    alignItems: 'center',
  },
  detailInfo: {
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: SCREEN_WIDTH * 0.07
  },
  detailTitle: {
    color: '#ffffffff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'DynaPuff',
    marginBottom: 4,
  },
  detailText: {
    color: '#bcbcbcff',
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'DynaPuff',
  },

  /* ADDED: description style shown under the price in DetailView */
  detailDescription: {
    color: '#e9e1d9ff',
    fontSize: SCREEN_WIDTH * 0.028,
    fontFamily: 'DynaPuff',
    marginTop: 6,
    marginBottom: 6,
    lineHeight: SCREEN_WIDTH * 0.04,
    maxWidth: scaleWidth(200),
  },

  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    alignSelf: 'stretch',
  },

  /* KEYBOARD-LIKE BUTTON STYLES */
  keyActive: {
    backgroundColor: '#ffffffff',          
    borderColor: '#8f0000ff',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 3 }, 
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 4,
    transform: [{ translateY: 0 }],        
  },
  keyDisabled: {
    backgroundColor: '#e1e1e1',
    borderColor: '#bfbfbf',
  },
  keyText: {
    color: '#111827',                    
    fontWeight: '700',
  },

  buyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: scaleWidth(6),
  },
  backButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000ff',
    backgroundColor: '#f3f4f6',
  },

  actionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
  },
});
