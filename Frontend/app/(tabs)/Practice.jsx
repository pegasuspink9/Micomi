import { Text, View, Image } from "react-native";

export default function Practice() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Practice Page
      </Text>
      <Image source={{ uri: 'https://i.pinimg.com/736x/42/04/6f/42046fa55cd361ed78775cf54a89270b.jpg' }} style={{ width: 500, height: 500, marginTop: 20 }} />
    </View>
  );
}