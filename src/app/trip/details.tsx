import { View, Text } from "react-native";

type DetailsProps = {
  tripId: string
}
export function Details({ tripId }: DetailsProps) {
  return (
    <View>
      <Text className="text-white text-2xl">{tripId}</Text>
    </View>
  )
}